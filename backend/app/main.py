# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from app.api.endpoints import agent, tracker, resumes, auth

app = FastAPI(
    title="LinkerAI API",
    description="AI-powered job application automation with multi-user isolation.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(agent.router,   prefix="/api",         tags=["Agent"])
app.include_router(tracker.router, prefix="/api/tracker", tags=["Tracker"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir):
    # Mount assets folder
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Catch-all route to serve the SPA frontend
    @app.get("/{fallback_path:path}")
    def serve_frontend(fallback_path: str):
        if fallback_path.startswith("api"):
            return None
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
