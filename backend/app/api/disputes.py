from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.schemas.base import APIResponse
from app.services.database_service import (
    DatabaseError,
    create_dispute,
    resolve_dispute,
    list_disputes,
)
from app.services.domain_events import emit_event_sync

router = APIRouter(prefix="/disputes", tags=["disputes"])


class DisputeCreateRequest(BaseModel):
    mismatch_type: str
    description: str
    waybill_id: Optional[str] = None
    order_id: Optional[str] = None


class DisputeResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


@router.post("/", response_model=APIResponse[dict])
def create_dispute_endpoint(
    data: DisputeCreateRequest,
    payload: dict = Depends(
        require_roles(
            UserRole.admin,
            UserRole.dealer,
            UserRole.manufacturer,
            UserRole.transporter,
            UserRole.retail_shop,
        )
    ),
) -> APIResponse[dict]:
    actor_id = payload.get("sub", "unknown")
    actor_role = payload.get("role", "unknown")
    try:
        dispute = create_dispute(
            mismatch_type=data.mismatch_type,
            description=data.description,
            waybill_id=data.waybill_id,
            order_id=data.order_id,
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    emit_event_sync(
        "DISPUTE_CREATED",
        {
            "dispute_id": dispute["dispute_id"],
            "mismatch_type": data.mismatch_type,
            "order_id": data.order_id,
            "waybill_id": data.waybill_id,
            "actor_id": actor_id,
        },
        notify_roles=["admin"],
        notify_severity="warning",
        notify_title="Dispute Raised",
        notify_message=f"A {data.mismatch_type} dispute was raised by {actor_id}.",
    )

    return APIResponse(success=True, data=dispute, message="Dispute created successfully")


@router.patch("/{dispute_id}/resolve", response_model=APIResponse[dict])
def resolve_dispute_endpoint(
    dispute_id: str,
    data: DisputeResolveRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer, UserRole.manufacturer)),
) -> APIResponse[dict]:
    actor_id = payload.get("sub", "unknown")
    try:
        updated = resolve_dispute(dispute_id=dispute_id, resolution_note=data.resolution_note)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    if updated is None:
        raise HTTPException(status_code=404, detail="Dispute not found")

    emit_event_sync(
        "DISPUTE_RESOLVED",
        {"dispute_id": dispute_id, "resolved_by": actor_id},
        notify_roles=["admin"],
        notify_title="Dispute Resolved",
        notify_message=f"Dispute {dispute_id} has been resolved by {actor_id}.",
    )

    return APIResponse(success=True, data=updated, message="Dispute resolved successfully")


@router.get("/", response_model=APIResponse[list])
def list_disputes_endpoint(
    status: Optional[str] = Query(None),
    waybill_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    payload: dict = Depends(
        require_roles(
            UserRole.admin,
            UserRole.dealer,
            UserRole.manufacturer,
            UserRole.transporter,
            UserRole.retail_shop,
        )
    ),
) -> APIResponse[list]:
    try:
        items = list_disputes(
            status=status,
            waybill_id=waybill_id,
            order_id=order_id,
            limit=limit,
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    return APIResponse(success=True, data=items)
