"""
Discovery Uttarakhand - Latency-Aware Provider Resolver
Resolves healthy provider with 30s caching:
OmniRoute (gateway) -> Direct Groq -> Gemini -> Fallback
"""
import time
from typing import Optional
from .base import BaseProvider
from .omniroute import OmniRouteProvider
from .groq import GroqProvider
from .gemini import GeminiProvider
from .fallback import DeterministicFallbackProvider
from ..config import settings

CACHED_PROVIDER: Optional[BaseProvider] = None
CACHED_TIMESTAMP: float = 0.0
CACHE_TTL_SECONDS: float = 30.0

async def resolve_provider(force_refresh: bool = False) -> BaseProvider:
    global CACHED_PROVIDER, CACHED_TIMESTAMP
    now = time.time()
    
    if not force_refresh and CACHED_PROVIDER is not None and (now - CACHED_TIMESTAMP < CACHE_TTL_SECONDS):
        return CACHED_PROVIDER

    explicit = (settings.AI_PROVIDER or "auto").lower()

    # 1. Explicit override check (if healthy, use it; otherwise fall through to cascade)
    if explicit == "omniroute":
        p = OmniRouteProvider()
        if await p.is_healthy():
            CACHED_PROVIDER, CACHED_TIMESTAMP = p, now
            return p
        print("[ProviderResolver] Explicit provider 'omniroute' unhealthy, cascading to fallback...")
    elif explicit == "groq":
        p = GroqProvider()
        if await p.is_healthy():
            CACHED_PROVIDER, CACHED_TIMESTAMP = p, now
            return p
        print("[ProviderResolver] Explicit provider 'groq' unhealthy, cascading to fallback...")
    elif explicit == "gemini":
        p = GeminiProvider()
        if await p.is_healthy():
            CACHED_PROVIDER, CACHED_TIMESTAMP = p, now
            return p
        print("[ProviderResolver] Explicit provider 'gemini' unhealthy, cascading to fallback...")
    elif explicit == "deterministic":
        p = DeterministicFallbackProvider()
        CACHED_PROVIDER, CACHED_TIMESTAMP = p, now
        return p

    # 2. Priority cascade: OmniRoute -> Groq -> Gemini -> Fallback
    if settings.OMNIROUTE_ENABLED:
        try:
            omni = OmniRouteProvider()
            if await omni.is_healthy():
                print("[ProviderResolver] Selected OmniRoute gateway")
                CACHED_PROVIDER, CACHED_TIMESTAMP = omni, now
                return omni
        except Exception as e:
            print(f"[ProviderResolver] OmniRoute check failed: {e}")

    if settings.GROQ_API_KEY:
        try:
            groq = GroqProvider()
            if await groq.is_healthy():
                print("[ProviderResolver] Selected Direct Groq provider")
                CACHED_PROVIDER, CACHED_TIMESTAMP = groq, now
                return groq
        except Exception as e:
            print(f"[ProviderResolver] Groq check failed: {e}")

    if settings.GEMINI_API_KEY:
        try:
            gemini = GeminiProvider()
            if await gemini.is_healthy():
                print("[ProviderResolver] Selected Gemini provider")
                CACHED_PROVIDER, CACHED_TIMESTAMP = gemini, now
                return gemini
        except Exception as e:
            print(f"[ProviderResolver] Gemini check failed: {e}")

    print("[ProviderResolver] Selected Deterministic Fallback provider")
    fallback = DeterministicFallbackProvider()
    CACHED_PROVIDER, CACHED_TIMESTAMP = fallback, now
    return fallback
