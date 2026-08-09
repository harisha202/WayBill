
from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from typing import Optional

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.ai_service import astream_chat_response

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
