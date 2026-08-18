import asyncio
import json
from typing import Dict, List, Any, Optional, Tuple
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # (user_id, role) -> websocket
        self.active_connections: List[Tuple[WebSocket, Optional[str], Optional[str]]] = []

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None, role: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append((websocket, user_id, role))

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [(ws, uid, r) for ws, uid, r in self.active_connections if ws != websocket]

    async def _send_to(self, websocket: WebSocket, message: str):
        try:
            await websocket.send_text(message)
        except Exception:
            pass

    async def broadcast_event(self, event_type: str, payload: Dict[str, Any]):
        """Backward compatible generic broadcast"""
        await self.broadcast_all(event_type, payload)

    async def broadcast_to_roles(self, event_type: str, payload: Dict[str, Any], roles: List[str]):
        message = json.dumps({"event": event_type, "data": payload})
        for ws, uid, role in self.active_connections:
            if role in roles:
                await self._send_to(ws, message)

    async def broadcast_to_users(self, event_type: str, payload: Dict[str, Any], user_ids: List[str]):
        message = json.dumps({"event": event_type, "data": payload})
        for ws, uid, role in self.active_connections:
            if uid in user_ids:
                await self._send_to(ws, message)

    async def broadcast_all(self, event_type: str, payload: Dict[str, Any]):
        message = json.dumps({"event": event_type, "data": payload})
        for ws, uid, role in self.active_connections:
            await self._send_to(ws, message)

manager = WebSocketManager()
