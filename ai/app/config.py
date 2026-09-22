"""
Discovery Uttarakhand - AI Runtime Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = ROOT_DIR.parent

class Settings(BaseSettings):
    AI_PORT: int = 8000
    AI_HOST: str = "127.0.0.1"
    NODE_BACKEND_URL: str = "http://127.0.0.1:5000"
    # SECURITY: No default value — must be set via environment variable.
    # Matches backend INTERNAL_AGENT_SECRET in backend/.env
    INTERNAL_API_SECRET: str = ""

    # LLM Providers
    AI_PROVIDER: str = "auto"  # auto / omniroute / groq / gemini / openai / deterministic
    
    # OmniRoute Gateway
    OMNIROUTE_BASE_URL: str = "http://127.0.0.1:20128/v1"
    OMNIROUTE_API_KEY: str = "omniroute-local"
    OMNIROUTE_MODEL: str = "openai/gpt-oss-120b"
    OMNIROUTE_ENABLED: bool = True
    
    # Direct Groq
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    
    # Direct Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    
    # Direct OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Paths
    SEED_DIR: Path = PROJECT_ROOT / "backend" / "seed"
    
    class Config:
        env_file = [
            PROJECT_ROOT / "backend" / ".env",
            ROOT_DIR / ".env"
        ]
        extra = "ignore"

settings = Settings()
