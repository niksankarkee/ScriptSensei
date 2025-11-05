"""
Video Processing Service - Main Application

FastAPI application for video generation from scripts
Port: 8012
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import socketio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api.videos import router as videos_router
from app.api.platforms import router as platforms_router
from app.api.jobs import router as jobs_router
from app.api.scenes import router as scenes_router
from app.api.libraries import router as libraries_router
from app.database import init_db
from app.queue import initialize_job_queue, shutdown_job_queue
from app.websocket import sio, get_socket_manager

# Initialize FastAPI app
app = FastAPI(
    title="ScriptSensei Video Processing Service",
    description="AI-powered video generation from scripts",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount Socket.IO to FastAPI
socket_app = socketio.ASGIApp(sio, app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",  # Frontend
        "http://localhost:3000",  # Alternative frontend port
        "http://localhost:8000",  # Kong API Gateway
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and job queue
@app.on_event("startup")
async def startup_event():
    """Initialize database and job queue on startup"""
    try:
        init_db()
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️  Database initialization failed: {e}")
        print("Service will continue but database operations may fail")

    try:
        await initialize_job_queue()
        print("✅ Background job queue started")
    except Exception as e:
        print(f"⚠️  Job queue initialization failed: {e}")
        print("Service will continue but background processing may fail")

    # Initialize Socket.IO manager
    try:
        get_socket_manager()
        print("✅ WebSocket manager initialized")
    except Exception as e:
        print(f"⚠️  WebSocket initialization failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await shutdown_job_queue()
        print("✅ Background job queue stopped")
    except Exception as e:
        print(f"⚠️  Job queue shutdown failed: {e}")

# Include routers
app.include_router(videos_router)
app.include_router(platforms_router)
app.include_router(jobs_router)
app.include_router(scenes_router)
app.include_router(libraries_router)


@app.get("/health")
async def health_check():
    """
    Health check endpoint

    Returns:
        Service health status
    """
    return {
        "status": "healthy",
        "service": "video-processing-service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/")
async def root():
    """
    Root endpoint

    Returns:
        Service information
    """
    return {
        "service": "ScriptSensei Video Processing Service",
        "version": "1.0.0",
        "description": "AI-powered video generation from scripts",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "videos": "/api/v1/videos",
            "platforms": "/api/v1/platforms",
            "voices": "/api/v1/voices",
            "jobs": "/api/v1/jobs"
        }
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8012))
    # Use socket_app instead of app to enable Socket.IO
    uvicorn.run(
        "app.main:socket_app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
