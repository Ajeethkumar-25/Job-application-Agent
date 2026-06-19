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
