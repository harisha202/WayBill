from __future__ import annotations
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class MetaData(BaseModel):
    page: Optional[int] = 1
    limit: Optional[int] = 25
    total: Optional[int] = 0

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[str] = None
    meta: Optional[MetaData] = None

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    message: Optional[str] = None
    error: Optional[str] = None
    meta: MetaData

class IdempotentRequest(BaseModel):
    idempotency_key: str = Field(..., description="Unique key to prevent duplicate processing")
