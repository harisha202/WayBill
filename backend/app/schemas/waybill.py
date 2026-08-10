from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.base import IdempotentRequest

class CustodyEventSchema(BaseModel):
    id: int
    waybill_id: str
    event_type: str
    from_custodian: Optional[str]
    to_custodian: str
    actor_id: str
    actor_role: str
    quantity: int
    location: Optional[str]
    metadata: dict = Field(default_factory=dict)
    event_hash: str
    previous_event_hash: Optional[str]
    created_at: datetime

class WaybillDocumentSchema(BaseModel):
    id: int
    waybill_id: str
    batch_id: str
    sku: str
    quantity: int
    order_id: Optional[str]
    current_custodian: str
    status: str
    qr_code: Optional[str]
    created_at: datetime
    updated_at: datetime
    custody_chain: Optional[List[CustodyEventSchema]] = None

class WaybillCreateRequest(IdempotentRequest):
    batch_id: str
    sku: str
    quantity: int = Field(..., gt=0)
    order_id: Optional[str] = None
    initial_custodian: str

class WaybillTransferRequest(IdempotentRequest):
    to_custodian: str
    location: Optional[str] = None
    quantity: int = Field(..., gt=0)

class WaybillReceiveRequest(IdempotentRequest):
    location: Optional[str] = None
    received_quantity: int = Field(..., ge=0)

class WaybillVerifyRequest(IdempotentRequest):
    seal_hash: str
    
class WaybillVerifyResponse(BaseModel):
    valid: bool
    waybill: Optional[WaybillDocumentSchema] = None
    reason: Optional[str] = None
