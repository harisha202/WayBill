from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    role: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: int
    created_at: datetime
    last_login_at: Optional[datetime] = None

class UserCreateRequest(BaseModel):
    username: str
    password: str = Field(..., min_length=6)
    full_name: str
    email: EmailStr
    role: str
    company_name: Optional[str] = None
    phone: Optional[str] = None

class UserUpdateRequest(BaseModel):
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: str

class UserStatusRequest(BaseModel):
    is_active: int

class UserResetPasswordRequest(BaseModel):
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    role: Optional[str] = None

