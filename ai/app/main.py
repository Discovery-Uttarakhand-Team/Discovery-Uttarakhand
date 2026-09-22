"""
Discovery Uttarakhand - Python AI Runtime Main Application
FastAPI + LangGraph + RAG Service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .config import settings

app = FastAPI(
    title="Discovery Uttarakhand AI Runtime",
    description="Production-grade LangGraph Agentic AI Travel Copilot for Uttarakhand",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "service": "Discovery Uttarakhand AI Runtime",
        "version": "3.0.0",
        "engine": "FastAPI + LangGraph + RAG",
        "status": "online"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Discovery Uttarakhand AI Runtime",
        "version": "3.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.AI_HOST, port=settings.AI_PORT)
