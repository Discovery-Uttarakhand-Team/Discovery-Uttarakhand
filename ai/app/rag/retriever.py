"""
Discovery Uttarakhand - Hybrid RAG Retriever
Matches user query and trip context against curated authoritative documents with evidence citation.
"""
import re
from typing import List, Dict, Any, Optional
from .documents import KNOWLEDGE_CORPUS

def retrieve_knowledge(
    query: str,
    destination: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 2
) -> List[Dict[str, Any]]:
    tokens = set(re.findall(r"\w+", (query or "").lower()))
    dest_lower = (destination or "").lower()
    
    scored = []
    for doc in KNOWLEDGE_CORPUS:
        score = 0
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()
        loc_lower = doc["location"].lower()
        
        # Location match bonus
        if dest_lower and (dest_lower in loc_lower or dest_lower in title_lower or dest_lower in content_lower):
            score += 10
            
        # Keyword matching
        for tok in tokens:
            if len(tok) < 3:
                continue
            if tok in title_lower:
                score += 3
            elif tok in loc_lower:
                score += 3
            elif tok in content_lower:
                score += 1
                
        if score > 0:
            scored.append((score, doc))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [s[1] for s in scored[:limit]]
    return results
