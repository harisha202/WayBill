from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Any, List, Dict
import uuid
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.auth import get_current_payload, require_roles
from app.models.user import UserRole
from app.schemas.waybill import (
    WaybillCreateRequest,
    WaybillTransferRequest,
    WaybillReceiveRequest,
    WaybillVerifyRequest,
    WaybillVerifyResponse
)
from app.schemas.base import APIResponse
from app.services.database_service import (
    check_and_record_idempotency_key,
    create_waybill,
    update_waybill_custody,
    get_waybill,
    get_all_waybills,
    verify_waybill
)

router = APIRouter(prefix="/waybills", tags=["waybills"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/", response_model=APIResponse[dict])
def create_waybill_endpoint(
    req: WaybillCreateRequest,
    payload: dict = Depends(require_roles(UserRole.manufacturer, UserRole.admin))
):
    if not check_and_record_idempotency_key(req.idempotency_key):
        return APIResponse(success=True, message="Already processed (idempotent)")
    
    actor_id = payload.get("sub")
    actor_role = payload.get("role")
    waybill_id = f"WB-{uuid.uuid4().hex[:8].upper()}"
    
    waybill = create_waybill(
        waybill_id=waybill_id,
        batch_id=req.batch_id,
        sku=req.sku,
        quantity=req.quantity,
        order_id=req.order_id,
        initial_custodian=req.initial_custodian,
        actor_id=actor_id,
        actor_role=actor_role
    )
    
    return APIResponse(success=True, data=waybill, message="Waybill created successfully")

@router.post("/{waybill_id}/transfer", response_model=APIResponse[dict])
def transfer_waybill_custody(
    waybill_id: str,
    req: WaybillTransferRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.transporter, UserRole.retail_shop))
):
    if not check_and_record_idempotency_key(req.idempotency_key):
        return APIResponse(success=True, message="Already processed (idempotent)")
        
    actor_id = payload.get("sub")
    actor_role = payload.get("role")
    
    waybill = update_waybill_custody(
        waybill_id=waybill_id,
        new_custodian=req.to_custodian,
        actor_id=actor_id,
        actor_role=actor_role,
        quantity=req.quantity,
        location=req.location,
        event_type="transfer"
    )
    
    if not waybill:
        raise HTTPException(status_code=404, detail="Waybill not found")
        
    return APIResponse(success=True, data=waybill, message="Waybill transferred successfully")

@router.post("/{waybill_id}/receive", response_model=APIResponse[dict])
def receive_waybill_custody(
    waybill_id: str,
    req: WaybillReceiveRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.transporter, UserRole.retail_shop))
):
    if not check_and_record_idempotency_key(req.idempotency_key):
        return APIResponse(success=True, message="Already processed (idempotent)")
        
    actor_id = payload.get("sub")
    actor_role = payload.get("role")
    
    # Using actor_id as the new custodian for receiving if it's implicitly received by the caller
    waybill = update_waybill_custody(
        waybill_id=waybill_id,
        new_custodian=actor_id, 
        actor_id=actor_id,
        actor_role=actor_role,
        quantity=req.received_quantity,
        location=req.location,
        event_type="receive"
    )
    
    if not waybill:
        raise HTTPException(status_code=404, detail="Waybill not found")
        
    return APIResponse(success=True, data=waybill, message="Waybill received successfully")

@router.post("/{waybill_id}/verify", response_model=APIResponse[WaybillVerifyResponse])
@limiter.limit(lambda: os.getenv("RATE_LIMIT_WAYBILL_VERIFY", "10/minute"))
def verify_waybill_endpoint(
    waybill_id: str,
    req: WaybillVerifyRequest,
    request: Request,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.transporter, UserRole.retail_shop))
):
    if not check_and_record_idempotency_key(req.idempotency_key):
        return APIResponse(success=True, message="Already processed (idempotent)")
        
    verification = verify_waybill(waybill_id, req.seal_hash)
    
    return APIResponse(
        success=True,
        data=WaybillVerifyResponse(**verification),
        message="Verification completed"
    )

@router.get("/{waybill_id}", response_model=APIResponse[dict])
def get_waybill_endpoint(
    waybill_id: str,
    payload: dict = Depends(get_current_payload)
):
    waybill = get_waybill(waybill_id)
    if not waybill:
        raise HTTPException(status_code=404, detail="Waybill not found")
        
    return APIResponse(success=True, data=waybill)
    
@router.get("/", response_model=APIResponse[List[Dict]])
def get_all_waybills_endpoint(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer))
):
    waybills = get_all_waybills()
    return APIResponse(success=True, data=waybills)
