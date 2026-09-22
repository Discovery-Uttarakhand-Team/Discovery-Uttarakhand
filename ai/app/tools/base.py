"""
Discovery Uttarakhand - Tool Result Factory & Strict Contract
"""
import time
from typing import Any, List, Optional, Dict
from ..schemas.tool import ToolResult

def success_result(
    data: Any,
    provenance: str = "VERIFIED",
    evidence_refs: Optional[List[str]] = None,
    duration_ms: int = 0
) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "provenance": provenance,
        "evidenceRefs": evidence_refs or [],
        "status": "OK",
        "error": None,
        "durationMs": duration_ms
    }

def failure_result(
    error: str,
    status: str = "ERROR",
    provenance: str = "UNKNOWN",
    duration_ms: int = 0
) -> Dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "provenance": provenance,
        "evidenceRefs": [],
        "status": status,
        "error": error,
        "durationMs": duration_ms
    }
