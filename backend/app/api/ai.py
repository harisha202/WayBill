
from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from typing import Optional

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.ai_service import (
    astream_chat_response,
    aanalyse_supplier_risk,
    aoptimise_delivery_route,
    adetect_shipment_anomalies,
    aget_dashboard_insights,
    acheck_inventory_alerts
)

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatRequest(BaseModel):
    question: str
    context_data: Optional[dict] = None
    allow_data_tools: bool = False

@router.post("/chat/stream")
async def chat_stream(payload: dict):
    question = payload.get("question", "")
    context_data = payload.get("context_data", {})
    
    async def event_generator():
        async for chunk in astream_chat_response(question, context_data):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/supplier-risk")
async def get_supplier_risk(payload: dict):
    name = payload.get("supplier_name", "")
    data = payload.get("supplier_data", {})
    news = payload.get("news_snippets", [])
    result = await aanalyse_supplier_risk(name, data, news)
    return result

@router.post("/route-optimizer")
async def optimize_route(payload: dict):
    warehouse = payload.get("warehouse", "")
    stops = payload.get("stops", [])
    constraints = payload.get("constraints", {})
    result = await aoptimise_delivery_route(warehouse, stops, constraints)
    return result

@router.post("/shipment-anomalies")
async def shipment_anomalies(payload: dict):
    tid = payload.get("tracking_id", "")
    events = payload.get("tracking_events", [])
    expected = payload.get("expected_delivery", "")
    result = await adetect_shipment_anomalies(tid, events, expected)
    return result

@router.post("/dashboard-insights")
async def dashboard_insights(payload: dict):
    inv = payload.get("inventory_summary", {})
    shipments = payload.get("recent_shipments", [])
    suppliers = payload.get("top_suppliers", [])
    result = await aget_dashboard_insights(inv, shipments, suppliers)
    return result

@router.post("/inventory-alerts")
async def inventory_alerts(payload: dict):
    items = payload.get("inventory_items", [])
    demand = payload.get("avg_daily_demand", {})
    result = await acheck_inventory_alerts(items, demand)
    return result
