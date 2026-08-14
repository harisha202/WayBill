import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_event(self, event_type: str, payload: Dict[str, Any]):
        message = json.dumps({"event": event_type, "data": payload})
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Connection might have dropped between check and send
                pass

manager = WebSocketManager()
