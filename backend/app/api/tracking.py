from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.models.tracking import GPSEvent
from app.services.tracking_service import tracking_service
from app.services.database_service import _engine, shipments_table, trucks_table, drivers_table, interventions_table
from app.schemas.base import APIResponse
from sqlalchemy import select
from app.api.websocket import manager

router = APIRouter(prefix="/tracking", tags=["tracking"])

class InterventionRequest(BaseModel):
    action_type: str
    reason: str
    severity: str

class VehicleAssignmentRequest(BaseModel):
    truck_id: str
    driver_id: str

@router.post("/gps", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))], response_model=APIResponse)
async def ingest_gps(event: GPSEvent, payload: dict = Depends(require_roles(UserRole.admin, UserRole.transporter))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        
        state_update = tracking_service.ingest_gps_ping(
            shipment_id=event.shipment_id,
            lat=event.latitude,
            lng=event.longitude,
            speed=event.speed or 0.0,
            heading=event.heading or 0.0,
            actor_id=actor_id,
            actor_role=actor_role
        )
        return APIResponse(success=True, data=state_update)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/overview", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_transporter_overview():
    with _engine().begin() as conn:
        shipments = conn.execute(select(shipments_table)).fetchall()
        in_transit = len([s for s in shipments if s.status == "IN_TRANSIT"])
        delayed = len([s for s in shipments if s.delay_risk_score and s.delay_risk_score > 30])
    return APIResponse(success=True, data={
        "total_shipments": len(shipments),
        "in_transit": in_transit,
        "delayed": delayed
    })

@router.get("/shipments", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_shipments():
    with _engine().begin() as conn:
        shipments = conn.execute(select(shipments_table)).fetchall()
        return APIResponse(success=True, data=[dict(s._mapping) for s in shipments])

@router.get("/shipments/{shipment_id}", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_shipment(shipment_id: str):
    with _engine().begin() as conn:
        shipment = conn.execute(select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)).first()
        if not shipment:
            raise HTTPException(status_code=404, detail="Shipment not found")
        return APIResponse(success=True, data=dict(shipment._mapping))

@router.post("/shipments/{shipment_id}/interventions", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def report_intervention(shipment_id: str, data: InterventionRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.transporter))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = tracking_service.log_intervention(shipment_id, data.action_type, data.reason, data.severity, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/interventions", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_interventions():
    with _engine().begin() as conn:
        ints = conn.execute(select(interventions_table)).fetchall()
        return APIResponse(success=True, data=[dict(i._mapping) for i in ints])

@router.get("/fleet", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_fleet():
    with _engine().begin() as conn:
        trucks = conn.execute(select(trucks_table)).fetchall()
        return APIResponse(success=True, data=[dict(t._mapping) for t in trucks])

@router.get("/drivers", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
def get_drivers():
    with _engine().begin() as conn:
        drivers = conn.execute(select(drivers_table)).fetchall()
        return APIResponse(success=True, data=[dict(d._mapping) for d in drivers])
