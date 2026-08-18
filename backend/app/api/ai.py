
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

@router.post("/query", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))])
async def ai_query(req: ChatRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    role = payload.get("role", "")
    username = payload.get("username", "")
    context_data = {}
    
    from app.services.database_service import (
        get_control_tower_analytics,
        get_mfg_dashboard_analytics,
        get_dealer_pipeline_funnel,
        get_dealer_alerts_analytics,
        get_retail_dashboard_overview,
        get_fleet_utilization,
        get_delay_risk_distribution
    )
    
    if role == "admin":
        context_data = get_control_tower_analytics()
    elif role == "manufacturer":
        context_data = get_mfg_dashboard_analytics()
    elif role == "dealer":
        context_data = {
            "funnel": get_dealer_pipeline_funnel(),
            "alerts": get_dealer_alerts_analytics()
        }
    elif role == "retail_shop":
        retailer = username if role != "admin" else "retail"
        context_data = get_retail_dashboard_overview(retailer_name=retailer, days=30)
    elif role == "transporter":
        context_data = {
            "fleet_utilization": get_fleet_utilization(),
            "delay_risk_distribution": get_delay_risk_distribution()
        }
        
    async def event_generator():
        async for chunk in astream_chat_response(req.question, context_data):
            yield f"data: {chunk}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/chat/stream", dependencies=[Depends(require_roles(UserRole.admin))])
async def chat_stream(payload: dict):
    question = payload.get("question", "")
    context_data = payload.get("context_data", {})
    
    async def event_generator():
        async for chunk in astream_chat_response(question, context_data):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


from datetime import datetime
from fastapi import UploadFile, File, HTTPException
from app.services.database_service import get_rag_quota, increment_rag_quota

@router.get("/rag-quota", dependencies=[Depends(require_roles(UserRole.admin))])
async def get_quota():
    month_str = datetime.utcnow().strftime("%Y-%m")
    return get_rag_quota(month_str)

@router.post("/document/upload", dependencies=[Depends(require_roles(UserRole.admin))])
async def upload_document(file: UploadFile = File(...)):
    # Mocking document parsing
    # In a real app we'd use PyPDF2 or pandas
    
    # Calculate mock pages based on file size, just for demonstration
    file.file.seek(0, 2)
    size = file.file.tell()
    pages_to_add = max(1, size // 10000) # roughly 10kb per page
    if pages_to_add > 50: pages_to_add = 50 # cap for demo
    
    month_str = datetime.utcnow().strftime("%Y-%m")
    try:
        quota = increment_rag_quota(month_str, pages_to_add)
        return {"status": "success", "message": f"Processed {pages_to_add} pages from {file.filename}", "quota": quota}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
