import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("NoticePulseWebSocket")

class ConnectionManager:
    def __init__(self):
        # List of all active WebSocket connections
        self.active_connections: List[WebSocket] = []
        # Client metadata mapping: websocket -> { user_id, department, role }
        self.client_meta: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None, department: Optional[str] = None, role: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_meta[websocket] = {
            "user_id": user_id,
            "department": department,
            "role": role
        }
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "CONNECTED",
            "message": "Connected to NoticePulse Real-time Push Alert Stream",
            "active_clients": len(self.active_connections)
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.client_meta:
            del self.client_meta[websocket]
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_urgent(self, notice: dict):
        """Broadcast urgent notice alert with highest priority flag."""
        message = {
            "type": "URGENT_NOTICE_ALERT",
            "priority": "urgent",
            "timestamp": notice.get("created_at"),
            "notice": notice
        }
        await self.broadcast(message)

    async def broadcast_notice_update(self, notice: dict, event_type: str = "NOTICE_UPDATED"):
        """Broadcast general notice creation, update, or deletion."""
        message = {
            "type": event_type,
            "notice": notice
        }
        await self.broadcast(message)

    async def broadcast_read_receipt(self, notice_id: int, read_count: int, total_members: int, user_name: str, department: str):
        """Broadcast real-time read counter increment to admin viewers."""
        message = {
            "type": "NOTICE_READ_RECEIPT",
            "notice_id": notice_id,
            "read_count": read_count,
            "total_members": total_members,
            "reader": {
                "name": user_name,
                "department": department
            }
        }
        await self.broadcast(message)

# Global singleton connection manager
ws_manager = ConnectionManager()
