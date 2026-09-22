"""
Discovery Uttarakhand - Health Check API
Reports Python AI runtime status and provider health
"""
import asyncio
from fastapi import APIRouter
from ..llm.resolver import resolve_provider

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    prov_name = "deterministic"
    healthy = True
    try:
        provider = await asyncio.wait_for(resolve_provider(), timeout=1.5)
        prov_name = provider.name
        healthy = await asyncio.wait_for(provider.is_healthy(), timeout=1.5)
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "Discovery Uttarakhand AI Runtime",
        "runtime": "python_fastapi_langgraph",
        "provider": prov_name,
        "providerHealthy": healthy
    }
