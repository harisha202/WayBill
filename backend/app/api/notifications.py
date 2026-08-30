from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException

from app.core.middleware import get_current_payload, require_roles
from app.models.user import UserRole
from app.schemas.base import APIResponse
from app.services.database_service import DatabaseError, list_notifications_for_user
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=APIResponse[list])
def get_my_notifications(
    limit: int = Query(50, ge=1, le=200),
    payload: dict = Depends(get_current_payload),
) -> APIResponse[list]:
    """
    Return notifications for the currently authenticated user's role.
    Uses the JWT `role` claim as the user_id lookup key.
    """
    user_id = payload.get("role", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing role claim")
    try:
        items = notification_service.list_recent(limit=limit, user_id=user_id)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return APIResponse(success=True, data=items)


@router.get("/unread-count")
def get_unread_count(payload: dict = Depends(get_current_payload)):
    """Return the count of recent notifications for this user (quick badge count)."""
    user_id = payload.get("sub", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")
    try:
        items = notification_service.list_recent(limit=200, user_id=user_id)
    except DatabaseError:
        return {"count": 0}
    return {"count": len(items)}
