/**
 * Discovery Uttarakhand - Phase 7 Agent API Client
 * Frontend client for POST /api/agent/chat
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function sendAgentMessage({ message, tripId, sessionId, chatId, pageContext }) {
  try {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const body = { message };
    if (tripId) body.tripId = tripId;
    if (sessionId) body.sessionId = sessionId;
    if (chatId) body.chatId = chatId;
    if (pageContext) body.pageContext = pageContext;

    const response = await fetch(`${API_BASE}/agent/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to reach AI Copilot",
        sessionId: null
      };
    }

    return data;
  } catch (err) {
    console.error("[agentApi] Network error:", err);
    return {
      success: false,
      message: "Network error - could not reach AI Copilot. Please check your connection.",
      sessionId: null
    };
  }
}

export async function streamAgentMessage({ message, tripId, sessionId, chatId, pageContext, onUpdate, signal }) {
  try {
    const token = localStorage.getItem("token");
    const headers = { 
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const body = { message };
    if (tripId) body.tripId = tripId;
    if (sessionId) body.sessionId = sessionId;
    if (chatId) body.chatId = chatId;
    if (pageContext) body.pageContext = pageContext;

    const response = await fetch(`${API_BASE}/agent/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errText = await response.text();
        const errJson = JSON.parse(errText);
        errorMsg = errJson.message || errText;
      } catch (_) {}
      if (onUpdate) onUpdate({ type: 'error', message: errorMsg });
      return;
    }

    if (!response.body) {
      throw new Error("ReadableStream not available. Fetch environment may not support streaming.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; 

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (onUpdate) onUpdate(data);
          } catch (e) {
            console.error("[agentApi] Error parsing SSE chunk:", e.message);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log("[agentApi] Streaming aborted.");
      if (onUpdate) onUpdate({ type: 'aborted' });
      return;
    }
    console.error("[agentApi] Network error during stream:", err);
    if (onUpdate) onUpdate({ type: 'error', message: "Network error - could not reach AI Copilot." });
  }
}