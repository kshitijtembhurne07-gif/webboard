import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
import models
from seed import seed_database
from auth import decode_access_token
from websocket_manager import ws_manager
from routes import auth, notices, timetable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NoticePulseAPI")

# Lifespan event to create tables and auto-seed database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables and checking seed state...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    logger.info("NoticePulse API shutting down...")

app = FastAPI(
    title="NoticePulse API",
    description="Smart Notice Board with Urgency-Based Push Alerts & Department Tagging",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST Routers
app.include_router(auth.router)
app.include_router(notices.router)
app.include_router(timetable.router)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "ok", "active_ws_clients": len(ws_manager.active_connections)}

# If frontend dist folder is built, serve production static assets and SPA fallback
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("ws"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": "NoticePulse API",
            "status": "online",
            "version": "1.0.0",
            "realtime_ws": "/ws/notices"
        }


# WebSocket Endpoint for instant push alerts and live updates
@app.websocket("/ws/notices")
async def websocket_notices_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    user_id = None
    role = None
    department = None

    if token:
        payload = decode_access_token(token)
        if payload:
            user_id = int(payload.get("sub"))
            role = payload.get("role")
            db = SessionLocal()
            try:
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    department = user.department
            finally:
                db.close()

    await ws_manager.connect(websocket, user_id=user_id, department=department, role=role)

    try:
        while True:
            # Keep connection alive and accept client heartbeat or actions
            data = await websocket.receive_text()
            # If client sends ping or echo
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
