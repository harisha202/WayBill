
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

from datetime import datetime
from fastapi import UploadFile, File, HTTPException
from app.services.database_service import (
    get_rag_quota,
    increment_rag_quota,
    list_rag_documents,
    delete_rag_document,
)
from app.services.rag_service import rag_service

@router.post("/query", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))])
async def ai_query(req: ChatRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    role = payload.get("role", "")
    username = payload.get("username", "")
    company_name = payload.get("company_name")
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

    # Retrieve grounded document chunks for scoped RAG
    doc_context, citations = rag_service.build_grounded_rag_context(
        req.question,
        uploader_company=company_name if role != "admin" else None,
        top_k=4
    )
    if doc_context:
        context_data["grounded_document_sources"] = doc_context
        
    async def event_generator():
        async for chunk in astream_chat_response(req.question, context_data):
            yield f"data: {chunk}\n\n"
        if citations:
            citation_str = "\n\n**Sources:**\n" + "\n".join(f"- {c}" for c in citations)
            yield f"data: {citation_str}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/chat/stream", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))])
async def chat_stream(req_body: dict, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    question = req_body.get("question", "")
    context_data = req_body.get("context_data", {})
    company_name = payload.get("company_name")
    role = payload.get("role", "")

    doc_context, citations = rag_service.build_grounded_rag_context(
        question,
        uploader_company=company_name if role != "admin" else None,
        top_k=4
    )
    if doc_context:
        context_data["grounded_document_sources"] = doc_context
    
    async def event_generator():
        async for chunk in astream_chat_response(question, context_data):
            yield f"data: {chunk}\n\n"
        if citations:
            citation_str = "\n\n**Sources:**\n" + "\n".join(f"- {c}" for c in citations)
            yield f"data: {citation_str}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/rag-quota", dependencies=[Depends(require_roles(UserRole.admin))])
async def get_quota():
    month_str = datetime.utcnow().strftime("%Y-%m")
    return get_rag_quota(month_str)

@router.get("/documents", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer))])
async def get_documents(payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer))):
    role = payload.get("role", "")
    company = payload.get("company_name") if role != "admin" else None
    return list_rag_documents(uploader_company=company)

@router.delete("/documents/{document_id}", dependencies=[Depends(require_roles(UserRole.admin))])
async def remove_document(document_id: str):
    success = delete_rag_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "success", "message": f"Document {document_id} deleted"}

@router.post("/document/upload", dependencies=[Depends(require_roles(UserRole.admin))])
async def upload_document(
    file: UploadFile = File(...),
    payload: dict = Depends(require_roles(UserRole.admin))
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        doc_record = rag_service.process_and_store_document(
            filename=file.filename or "uploaded_document",
            content=content,
            content_type=file.content_type or "application/octet-stream",
            uploader_id=payload.get("sub"),
            uploader_role=payload.get("role"),
            uploader_company=payload.get("company_name"),
        )

        pages_to_add = doc_record.get("page_count", 1)
        month_str = datetime.utcnow().strftime("%Y-%m")
        quota = increment_rag_quota(month_str, pages_to_add)

        return {
            "status": "success",
            "message": f"Processed and indexed {pages_to_add} pages from {file.filename}",
            "document": doc_record,
            "quota": quota
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload document error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.post("/supplier-risk", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer))])
async def get_supplier_risk(payload: dict, user_payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    name = payload.get("supplier_name", "")
    data = payload.get("supplier_data", {})
    news = payload.get("news_snippets", [])
    result = await aanalyse_supplier_risk(name, data, news, actor_id=user_payload.get("sub"), actor_role=user_payload.get("role"))
    return result

@router.post("/route-optimizer", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter))])
async def optimize_route(payload: dict, user_payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    warehouse = payload.get("warehouse", "")
    stops = payload.get("stops", [])
    constraints = payload.get("constraints", {})
    result = await aoptimise_delivery_route(warehouse, stops, constraints, actor_id=user_payload.get("sub"), actor_role=user_payload.get("role"))
    return result

@router.post("/shipment-anomalies", dependencies=[Depends(require_roles(UserRole.admin, UserRole.transporter, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop))])
async def shipment_anomalies(payload: dict, user_payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    tid = payload.get("tracking_id", "")
    events = payload.get("tracking_events", [])
    expected = payload.get("expected_delivery", "")
    result = await adetect_shipment_anomalies(tid, events, expected, actor_id=user_payload.get("sub"), actor_role=user_payload.get("role"))
    return result

@router.post("/dashboard-insights", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))])
async def dashboard_insights(payload: dict, user_payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    inv = payload.get("inventory_summary", {})
    shipments = payload.get("recent_shipments", [])
    suppliers = payload.get("top_suppliers", [])
    result = await aget_dashboard_insights(inv, shipments, suppliers, actor_id=user_payload.get("sub"), actor_role=user_payload.get("role"))
    return result

@router.post("/inventory-alerts", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop))])
async def inventory_alerts(payload: dict, user_payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer, UserRole.dealer, UserRole.retail_shop, UserRole.transporter))):
    items = payload.get("inventory_items", [])
    demand = payload.get("avg_daily_demand", {})
    result = await acheck_inventory_alerts(items, demand, actor_id=user_payload.get("sub"), actor_role=user_payload.get("role"))
    return result
