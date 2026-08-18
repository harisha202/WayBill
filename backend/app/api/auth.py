from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt  # type: ignore[import-untyped]
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.middleware import get_current_payload, require_roles
from app.core.security import hash_password, verify_password
from app.models.user import UserRole
from app.services.database_service import (
    DatabaseConflictError,
    DatabaseError,
    create_guest_entry,
    create_user,
    get_user_by_email,
    set_user_role,
    record_failed_login,
    reset_failed_logins,
    is_account_locked,
)
from app.services.email_service import get_email_service
from app.services.otp_service import OTPService

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, Depends, HTTPException, status, APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

otp_service = OTPService()
email_service = get_email_service()


class LoginRequest(BaseModel):
    email: str
    password: str
    role: UserRole


class SendOTPRequest(BaseModel):
    email: str
    name: str = Field(default="User", max_length=80)


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RoleAssignmentRequest(BaseModel):
    email: str
    role: UserRole


class RoleAssignmentResponse(BaseModel):
    email: str
    role: UserRole
    updated_by: str

def normalize_email(email: str) -> str:
    return str(email).strip().lower()


def normalize_display_name(name: str, fallback: str = "User") -> str:
    text = str(name or "").strip()
    if not text:
        return fallback
    return text[8:].strip() if text.lower().startswith("default ") else text


def normalize_role(role: UserRole | str) -> UserRole:
    if isinstance(role, UserRole):
        return role

    raw_role = str(role).strip().lower()
    legacy_map = {
        "retail": UserRole.retail_shop.value,
        "retailshop": UserRole.retail_shop.value,
    }
    normalized = legacy_map.get(raw_role, raw_role)
    return UserRole(normalized)


def create_access_token(subject: str, role: UserRole) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    # Using hard-coded 15 minutes or config
    minutes = settings.access_token_expire_minutes if settings.access_token_expire_minutes else 15
    expire_at = now + timedelta(minutes=minutes)
    payload = {
        "sub": subject,
        "type": "access",
        "role": role.value,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, role: UserRole) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    # Defaulting to 7 days config
    days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    expire_at = now + timedelta(days=days)
    payload = {
        "sub": subject,
        "type": "refresh",
        "role": role.value,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def _build_otp_response(data: SendOTPRequest):
    email = normalize_email(data.email)
    try:
        existing_user = get_user_by_email(email)
    except DatabaseError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    otp = otp_service.create_otp(email)
    email_sent = email_service.send_otp_email(
        to_email=email,
        name=data.name.strip(),
        otp=otp,
        validity_minutes=OTPService.OTP_VALIDITY_MINUTES,
    )

    expose_otp = os.getenv("EXPOSE_OTP_IN_RESPONSE", "").strip().lower() in {"1", "true", "yes", "on"}

    if not email_sent and not expose_otp:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "OTP delivery failed. Configure SMTP (SMTP_SERVER/SMTP_PORT/SENDER_EMAIL/SENDER_PASSWORD), "
                "keep MOCK_EMAIL_DELIVERY=false, restart the backend, then try again."
            ),
        )

    payload: dict[str, object] = {
        "success": True,
        "message": f"OTP sent to {email}",
        "email_sent": bool(email_sent),
    }

    if expose_otp:
        payload["otp"] = otp
        if not email_sent:
            payload["email_error"] = "Email delivery failed; OTP was returned only because EXPOSE_OTP_IN_RESPONSE=true."

    return payload


@router.post("/send-otp")
@limiter.limit(lambda: os.getenv("RATE_LIMIT_AUTH", "5/minute"))
async def send_otp(request: Request):
    try:
        body = await request.json()
        data = SendOTPRequest(**body)
    except Exception as exc:
        logger.error(f"OTP parsing failed: {exc}")
        raise HTTPException(status_code=422, detail=f"Invalid request payload: {exc}")
    return _build_otp_response(data)


@router.post("/verify-otp")
async def verify_otp(request: Request):
    try:
        body = await request.json()
        data = VerifyOTPRequest(**body)
    except Exception as exc:
        logger.error(f"OTP verify parsing failed: {exc}")
        raise HTTPException(status_code=422, detail=f"Invalid request payload: {exc}")
        
    email = normalize_email(data.email)
    is_valid, message = otp_service.verify_otp(email, data.otp)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return {"success": True, "message": message, "valid": True}


@router.post("/resend-otp")
@limiter.limit(lambda: os.getenv("RATE_LIMIT_AUTH", "5/minute"))
async def resend_otp(request: Request):
    try:
        body = await request.json()
        data = SendOTPRequest(**body)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Invalid request payload")
    return _build_otp_response(data)


@router.post("/login", response_model=LoginResponse)
@limiter.limit(lambda: os.getenv("RATE_LIMIT_AUTH", "5/minute"))
async def login(request: Request) -> LoginResponse:
    try:
        body = await request.json()
        data = LoginRequest(**body)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Invalid request payload")

    email = normalize_email(data.email)
    try:
        db_user = get_user_by_email(email)
    except DatabaseError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
        
    # Check if account is locked
    if db_user and is_account_locked(db_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked due to too many failed login attempts. Try again later."
        )

    # Check if account is inactive
    if db_user and db_user.get("is_active") == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact your administrator."
        )

    if db_user is not None:
        db_role = normalize_role(db_user["role"])
        if not verify_password(data.password, db_user["password_hash"]):
            record_failed_login(db_user["id"])
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
            
        reset_failed_logins(db_user["id"])

        if db_role != data.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Selected role does not match user role",
            )

        token = create_access_token(subject=email, role=db_role)
        refresh = create_refresh_token(subject=email, role=db_role)
        return LoginResponse(
            access_token=token,
            refresh_token=refresh,
            role=db_role,
            user={
                "id": db_user["id"],
                "email": db_user["email"],
                "name": normalize_display_name(db_user["name"], fallback="User"),
                "role": db_role,
            },
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )


@router.post("/refresh")
def refresh_token(data: RefreshTokenRequest):
    settings = get_settings()
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
            
        email = payload.get("sub")
        role_str = payload.get("role")
        if not email or not role_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
            
        role = normalize_role(role_str)
        new_access_token = create_access_token(subject=email, role=role)
        return {"access_token": new_access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


@router.post(
    "/assign-role",
    response_model=RoleAssignmentResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def assign_role(
    data: RoleAssignmentRequest,
    payload: dict = Depends(require_roles(UserRole.admin)),
) -> RoleAssignmentResponse:
    email = normalize_email(data.email)
    try:
        target = set_user_role(email=email, role=data.role.value)
    except DatabaseError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return RoleAssignmentResponse(
        email=email,
        role=data.role,
        updated_by=payload.get("sub", "admin"),
    )


@router.get("/me")
def me(payload: dict = Depends(get_current_payload)):
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        db_user = get_user_by_email(email)
    except DatabaseError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {
        "id": db_user["id"],
        "email": db_user["email"],
        "name": normalize_display_name(db_user["name"], fallback="User"),
        "role": normalize_role(db_user["role"]),
    }


@router.get("/validate-token")
def validate_token(
    payload: dict = Depends(
        require_roles(
            UserRole.admin,
            UserRole.manufacturer,
            UserRole.transporter,
            UserRole.dealer,
            UserRole.retail_shop,
        )
    ),
):
    return {"valid": True, "payload": payload}

