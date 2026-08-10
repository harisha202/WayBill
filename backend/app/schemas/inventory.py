from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.base import IdempotentRequest

class OrderCreateRequest(IdempotentRequest):
    retailer_name: str
    retailer_email: str
    dealer_id: str
    product_sku: str
    quantity: int = Field(..., gt=0)
    origin: Optional[str] = None
    destination: Optional[str] = None

class ReceiptRequest(IdempotentRequest):
    received_quantity: int = Field(..., ge=0)

class ReorderRecommendation(BaseModel):
    sku: str
    recommended_quantity: int
    justification: str
    status: str
    
class BackorderSchema(BaseModel):
    id: int
    order_id: str
    sku: str
    missing_quantity: int
    reason: Optional[str]
    status: str
    created_at: datetime
    fulfilled_at: Optional[datetime]
