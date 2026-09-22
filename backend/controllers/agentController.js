/**
 * Discovery Uttarakhand - Phase 7 Agent Controller
 * Handles POST /api/agent/chat
 * Input validation, auth, rate limiting, session management, delegation to AgentService
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import SavedTrip from "../models/SavedTrip.js";
import Chat from "../models/Chat.js";
import { getOrCreateSession, addTurn, updateContextEntities } from "../services/agentSessionStore.js";
import { runAgent } from "../services/agentService.js";
import { resolveDestination } from "../services/destinationResolver.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 20;

const ORIGIN_HUBS = [
  "Delhi", "New Delhi", "Noida", "Gurgaon", "Agra", "Chandigarh", "Jaipur", "Mumbai",
  "Lucknow", "Dehradun", "Haridwar", "Rishikesh", "Meerut", "Haldwani", "Bangalore",
  "Kolkata", "Pune", "Ahmedabad", "Hyderabad", "Chennai"
];

export function extractEntitiesFromText(text, sessionEntities = {}) {
  const entities = {};
  if (!text || typeof text !== "string") return entities;
  const clean = text.trim();

  // 1. Dynamic Canonical Destination extraction
  const resolved = resolveDestination(clean);
  if (resolved) {
    entities.destination = resolved.name;
    entities.destinationId = resolved.id || resolved.slug;
    if (resolved.district) entities.district = resolved.district;
    if (resolved.region) entities.region = resolved.region;
  }

  // 2. Origin extraction (e.g. "Delhi se", "main Dehradun se niklunga", "from Delhi", "start from Delhi", or standalone "Delhi")
  for (const hub of ORIGIN_HUBS) {
    if (new RegExp(`\\b${hub}\\b`, "i").test(clean)) {
      const isExplicitOrigin = new RegExp(`(?:from|start from|starting from)\\s+${hub}|${hub}\\s+se\\b`, "i").test(clean);
      if (isExplicitOrigin || clean.toLowerCase() === hub.toLowerCase() || (sessionEntities.destination && !resolved)) {
        entities.origin = hub;
        break;
      }
    }
  }

  if (!entities.origin) {
    const fromMatch = clean.match(/(?:from|start from|starting from)\s+([A-Za-z]+)/i);
    const seMatch = clean.match(/([A-Za-z]+)\s+se\b/i);
    const candidate = fromMatch ? fromMatch[1].trim() : (seMatch ? seMatch[1].trim() : null);
    if (candidate && !/^(main|hum|aap|wahan|yahan|kal|aaj|kahan|travel|please)$/i.test(candidate)) {
      const isDest = resolveDestination(candidate);
      if (!isDest || candidate.toLowerCase() === "delhi") {
        entities.origin = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
      }
    }
  }

  // 3. Date extraction & normalization (e.g. "15 October", "15 Oct", "tomorrow", "kal", "next month")
  const monthNames = {
    jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
    apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
    aug: "08", august: "08", sep: "09", sept: "09", september: "09", oct: "10", october: "10",
    nov: "11", november: "11", dec: "12", december: "12"
  };

  const dayMonthMatch = clean.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*(\d{4}))?/i) ||
                        clean.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\s*(?:st|nd|rd|th)?(?:\s*(\d{4}))?/i);
  if (dayMonthMatch) {
    const isMonthFirst = isNaN(parseInt(dayMonthMatch[1], 10));
    const day = (isMonthFirst ? dayMonthMatch[2] : dayMonthMatch[1]).padStart(2, "0");
    const mStr = (isMonthFirst ? dayMonthMatch[1] : dayMonthMatch[2]).toLowerCase();
    const monthKey = Object.keys(monthNames).find(k => mStr.startsWith(k));
    const month = monthNames[monthKey] || "10";
    const year = (isMonthFirst ? dayMonthMatch[3] : dayMonthMatch[3]) || "2026";
    entities.startDate = `${year}-${month}-${day}`;
  } else if (/kal|tomorrow/i.test(clean)) {
    const tmrw = new Date(Date.now() + 86400000);
    entities.startDate = tmrw.toISOString().split("T")[0];
  } else if (/next weekend/i.test(clean)) {
    const now = new Date();
    const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
    const nextSat = new Date(now.getTime() + daysUntilSat * 86400000);
    entities.startDate = nextSat.toISOString().split("T")[0];
  } else if (/next month/i.test(clean)) {
    entities.startDate = "2026-10-01";
  }

  // 4. Duration extraction (e.g., "3-4 days", "3–4 din", "3 to 4 days", "5 days", "5 din", "around 4 days")
  const rangeMatch = clean.match(/(\d+)\s*(?:-|–|to|se)\s*(\d+)\s*(?:days?|din)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    entities.durationMin = Math.min(min, max);
    entities.durationMax = Math.max(min, max);
    entities.duration = entities.durationMax;
    entities.durationDays = entities.duration;
  } else {
    const singleDurationMatch = clean.match(/(?:around|approx|about)?\s*(\d+)\s*(?:days?|din)/i);
    if (singleDurationMatch) {
      const d = parseInt(singleDurationMatch[1], 10);
      entities.duration = d;
      entities.durationDays = d;
      entities.durationMin = d;
      entities.durationMax = d;
    }
  }

  // 5. Travelers extraction (e.g., "2 people", "2 log", "2 logon", "hum dono", "me and my friend", "solo")
  const travelersMatch = clean.match(/(\d+)\s*(?:person|people|traveler|adult|log(?:on)?)\b/i);
  if (travelersMatch) {
    entities.travelers = parseInt(travelersMatch[1], 10);
  } else if (/hum dono|me and my friend|two of us/i.test(clean)) {
    entities.travelers = 2;
  } else if (/\bsolo\b|alone|single traveler/i.test(clean)) {
    entities.travelers = 1;
  }

  // 6. Budget extraction (e.g., "5000", "₹5000", "₹5,000", "5k", "5 K", "5000 rupees", "budget 5000", "around 35000 rs")
  const budgetKMatch = clean.match(/(?:budget\s*)?(\d+)\s*(?:k|hazar|thousand)\b/i);
  if (budgetKMatch) {
    entities.budget = parseInt(budgetKMatch[1], 10) * 1000;
  } else {
    const explicitBudgetMatch = clean.match(/(?:budget|cost|₹|rs\.?|inr)\s*[:=]?\s*([0-9,]+)/i) ||
                                clean.match(/([0-9,]+)\s*(?:rupees?|rs\.?|inr)\b/i);
    if (explicitBudgetMatch) {
      const num = parseInt(explicitBudgetMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(num) && num >= 500) {
        entities.budget = num;
      }
    } else {
      const standaloneMatch = clean.match(/\b([1-9]\d{3,6})\b/);
      if (standaloneMatch) {
        const num = parseInt(standaloneMatch[1], 10);
        if (!isNaN(num) && num >= 1000 && num !== 2026 && num !== 2027) {
          entities.budget = num;
        }
      }
    }
  }

  // Budget preference extraction
  if (/cheap|cheaper|low\s*cost/i.test(clean)) {
    entities.budgetTier = "Budget";
  } else if (/luxury|premium|high\s*end/i.test(clean)) {
    entities.budgetTier = "Luxury";
  } else if (/balanced|moderate|standard/i.test(clean)) {
    entities.budgetTier = "Balanced";
  }

  entities.intent = classifyIntent(clean, sessionEntities, entities);

  return entities;
}

export function classifyIntent(text, sessionEntities = {}, extractedEntities = {}) {
  const clean = (text || "").trim();
  const lower = clean.toLowerCase();
  const dest = extractedEntities.destination || sessionEntities.destination;

  // 1. Weather intent
  if (/weather|temperature|mausam|rain|snow|climate/i.test(clean) && !/plan|trip|jana|jaana|ghoom|itinerary/i.test(clean)) {
    return "WEATHER";
  }

  // 2. Route intent
  if (/(?:route|road|highway|kaise jaa?u|how to reach|show map|map dikhao)/i.test(lower) && !/budget|stay|hotel/i.test(lower)) {
    return "ROUTE";
  }

  // 3. Destination explore intent (only if not carrying planning parameters like duration / budget)
  const isExploreQuery = /(?:what can i do|things to do|explore|places to visit|kya kar sakta hoon|kya dekh sakta hoon)/i.test(lower);
  const hasPlanningParams = extractedEntities.duration || extractedEntities.budget || sessionEntities.duration || sessionEntities.budget;
  if (isExploreQuery && !hasPlanningParams) {
    return "DESTINATION_EXPLORE";
  }

  // 4. Trip planning intent
  const isPlanningLanguage = /(?:trip|plan|jana hai|jaana hai|want to go|ghoomna|travel|bana do|chalo|start|where i can go)/i.test(lower);
  if (isPlanningLanguage || dest || hasPlanningParams || extractedEntities.origin || sessionEntities.origin) {
    return "TRIP_PLANNING";
  }

  // 5. Stays query
  if (/^(stay|hotel|resort|lodge|accommodation|room|guesthouse)s?\b/i.test(clean)) {
    return "STAYS";
  }

  return "GENERAL_CHAT";
}

async function runPythonAgent({ message, chatId, tripContext, session, user, requestId, pageContext, onEvent }) {
  const pythonUrl = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';
  const internalSecret = process.env.INTERNAL_AGENT_SECRET || 'discovery_uttarakhand_internal_secret_9981';

  const body = {
    message,
    chatId: chatId || session?.sessionId || requestId,
    sessionId: session?.sessionId || null,
    tripContext: tripContext || {},
    userProfile: user ? { id: String(user._id), name: user.name, role: user.role } : null,
    history: session?.history || []
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${pythonUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Python AI HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.response) {
      throw new Error(data.error || 'Python AI returned unsuccessful response');
    }

    const pResp = data.response;
    if (onEvent && pResp.message) {
      onEvent({ type: 'delta', content: pResp.message });
    }

    const canonTools = pResp.toolsUsed || [];
    const canonToolCount = pResp.toolCount !== undefined ? pResp.toolCount : canonTools.length;
    const canonCitations = pResp.citations || [];
    const canonCitationCount = pResp.citationCount !== undefined ? pResp.citationCount : canonCitations.length;
    const canonProvider = pResp.meta?.provider || pResp.providerUsed || 'auto';
    const canonFallback = pResp.meta?.fallbackUsed || pResp.fallbackUsed || false;
    const canonConfidence = pResp.confidence || 'grounded';

    return {
      type: pResp.type || 'answer',
      message: pResp.message,
      toolsUsed: canonTools,
      toolCount: canonToolCount,
      citations: canonCitations,
      citationCount: canonCitationCount,
      suggestedActions: pResp.suggestedActions || [],
      uiActions: pResp.uiActions || [],
      structuredCards: pResp.structuredCards || {},
      confidence: canonConfidence,
      meta: {
        runtime: 'python_fastapi_langgraph',
        provider: canonProvider,
        providerUsed: canonProvider,
        fallbackUsed: canonFallback,
        threadId: data.chatId || chatId,
        toolsUsed: canonTools,
        toolCount: canonToolCount,
        citations: canonCitations,
        citationCount: canonCitationCount,
        confidence: canonConfidence
      }
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const agentChat = async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const { message, tripId, sessionId, chatId, pageContext } = req.body;

    // 1. Input validation
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "message is required." });
    }
    const sanitizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH).replace(/[<>]/g, "");

    // 2. Resolve user (optional auth — works for transient trips without login)
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).select("-password");
      } catch { /* invalid token - continue as anonymous */ }
    }

    // 3. Validate tripId ownership if provided
    let tripContext = null;
    let validatedTripId = null;
    if (tripId) {
      // If tripId is not a valid MongoDB ObjectId (e.g. temp local IDs like "trip_XXXX"),
      // silently ignore it and treat as a general no-trip-context conversation.
      if (!/^[0-9a-fA-F]{24}$/.test(tripId)) {
        console.log(`[AgentController] [${requestId}] Ignoring non-MongoDB tripId: ${String(tripId).slice(0, 20)}`);
        // validatedTripId and tripContext remain null — no hard rejection
      } else if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required to use AI Copilot with a saved trip." });
      } else {
        const trip = await SavedTrip.findById(tripId).populate("destinations").lean();
        if (!trip) {
          // Trip not found — silently ignore rather than error, allow general convo
          console.log(`[AgentController] [${requestId}] Trip ${tripId} not found, continuing without context.`);
        } else if (String(trip.user) !== String(user._id)) {
          return res.status(403).json({ success: false, message: "Access denied: You do not own this trip." });
        } else {
          validatedTripId = tripId;
          tripContext = {
            tripId: String(trip._id), title: trip.title, duration: trip.duration, travelers: trip.travelers,
            pace: trip.pace, budget: trip.budget, transport: trip.transport, interests: trip.interests || [],
            tripType: trip.tripType || [], status: trip.status,
            destinationNames: (trip.destinations || []).map(d => d.name || d),
            hasGeneratedItinerary: !!(trip.generatedItinerary && trip.generatedItinerary.length > 0),
            notes: trip.notes ? String(trip.notes).slice(0, 200) : null
          };
        }
      }
    }

    // 4. Get or create session
    const tContextStart = Date.now();
    const session = getOrCreateSession({
      sessionId,
      userId: user ? String(user._id) : null,
      tripId: validatedTripId
    });
    const tContext = Date.now() - tContextStart;

    // 5. Validate chatId ownership & resolve Chat document (Optimized)
    let chat = null;
    let needsHydration = (chatId && chatId !== "new" && session.history.length === 0);
    const tHistoryStart = Date.now();
    if (chatId && chatId !== "new") {
      if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({ success: false, message: "Invalid chatId format." });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: "Authentication required to access saved chat." });
      }
      
      // Only fetch the full messages array if we actually need to hydrate the session
      let existingChat;
      if (needsHydration) {
        // Fetch chat with only the last 8 messages using MongoDB slice
        existingChat = await Chat.findById(chatId, { userId: 1, messages: { $slice: -8 } });
      } else {
        // Just verify existence and ownership without loading massive history
        existingChat = await Chat.findById(chatId).select('userId');
      }

      if (!existingChat) {
        return res.status(404).json({ success: false, message: "Chat not found." });
      }
      if (String(existingChat.userId) !== String(user._id)) {
        return res.status(403).json({ success: false, message: "Access denied: You do not own this chat." });
      }
      chat = existingChat;
    } else if (user) {
      // New conversation for authenticated user
      const title = sanitizedMessage.length > 30 ? sanitizedMessage.substring(0, 30) + "..." : sanitizedMessage;
      chat = new Chat({
        userId: user._id,
        tripId: validatedTripId || null,
        title,
        messages: []
      });
      // Save it immediately so we have an ID for updateOne later
      await chat.save();
    }

    // 6. Multi-turn session hydration from persisted Chat history
    if (needsHydration && chat && Array.isArray(chat.messages) && chat.messages.length > 0) {
      for (const m of chat.messages) {
        session.history.push({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now()
        });
      }
    }
    const tHistory = Date.now() - tHistoryStart;

    // 7. Update session context entities from user message, pageContext & trip context
    const extractedEntities = extractEntitiesFromText(sanitizedMessage, session.contextEntities || {});

    // Seed from safe pageContext
    if (pageContext?.destinationName && !extractedEntities.destination && !session.contextEntities?.destination) {
      extractedEntities.destination = pageContext.destinationName;
      extractedEntities.destinationId = (pageContext.destinationSlug || pageContext.destinationName).toLowerCase();
    }
    if (pageContext?.plannerForm) {
      const pf = pageContext.plannerForm;
      if (pf.origin && !extractedEntities.origin && !session.contextEntities?.origin) {
        extractedEntities.origin = pf.origin;
      }
      if (pf.destination && !extractedEntities.destination && !session.contextEntities?.destination) {
        extractedEntities.destination = pf.destination;
        extractedEntities.destinationId = pf.destinationId || pf.destination.toLowerCase();
      }
      if (pf.startDate && !extractedEntities.startDate && !session.contextEntities?.startDate) {
        extractedEntities.startDate = pf.startDate;
      }
      if (pf.duration && !extractedEntities.duration && !session.contextEntities?.duration) {
        extractedEntities.duration = pf.duration;
        extractedEntities.durationDays = pf.duration;
      }
      if (pf.travelers && !extractedEntities.travelers && !session.contextEntities?.travelers) {
        extractedEntities.travelers = pf.travelers;
      }
      if (pf.budget && !extractedEntities.budget && !session.contextEntities?.budget) {
        extractedEntities.budget = pf.budget;
      }
    }

    if (tripContext?.destinationNames?.length > 0 && !extractedEntities.destination) {
      extractedEntities.destination = tripContext.destinationNames[0];
    }
    if (tripContext?.duration && !extractedEntities.duration) {
      const match = String(tripContext.duration).match(/(\d+)/);
      if (match) {
        extractedEntities.duration = parseInt(match[1], 10);
        extractedEntities.durationDays = extractedEntities.duration;
      }
    }
    if (tripContext?.travelers && !extractedEntities.travelers) {
      extractedEntities.travelers = tripContext.travelers;
    }
    updateContextEntities(session, extractedEntities);

    // 8. Run agent
    const tAgentStart = Date.now();
    const isSSE = req.headers.accept === 'text/event-stream';
    let onEvent = null;

    if (isSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      onEvent = (event) => {
        if (!event.requestId) event.requestId = requestId;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
    }

    let agentResponse;
    const aiRuntime = (process.env.AI_AGENT_RUNTIME || 'python').toLowerCase();

    if (aiRuntime === 'python') {
      try {
        agentResponse = await runPythonAgent({
          message: sanitizedMessage,
          chatId,
          tripContext,
          session,
          user,
          requestId,
          pageContext,
          onEvent
        });
      } catch (pythonErr) {
        console.warn(`[AgentController] Python runtime error [${requestId}]: ${pythonErr.message}. Falling back to Node agentService...`);
        agentResponse = await runAgent({
          message: sanitizedMessage,
          tripContext,
          session,
          user,
          requestId,
          pageContext,
          onEvent
        });
      }
    } else {
      agentResponse = await runAgent({
        message: sanitizedMessage,
        tripContext,
        session,
        user,
        requestId,
        pageContext,
        onEvent
      });
    }
    const tAgent = Date.now() - tAgentStart;

    // 9. Persist turns to Chat if user is authenticated (with safe failure handling)
    const tSaveStart = Date.now();
    if (chat) {
      const prov = agentResponse.confidence === "grounded" ? "GROUNDED" : (agentResponse.meta?.fallbackUsed ? "FALLBACK" : "GROUNDED");
      const newMessages = [
        {
          role: "user",
          content: sanitizedMessage,
          provenance: "USER"
        },
        {
          role: "assistant",
          content: agentResponse.message || "",
          provenance: prov,
          evidenceRefs: (agentResponse.citations || []).map(c => typeof c === "string" ? c : (c.title || c.source || JSON.stringify(c))),
          metadata: {
            type: agentResponse.type,
            toolsUsed: agentResponse.toolsUsed || [],
            toolCount: agentResponse.toolCount !== undefined ? agentResponse.toolCount : (agentResponse.toolsUsed || []).length,
            citations: agentResponse.citations || [],
            citationCount: agentResponse.citationCount !== undefined ? agentResponse.citationCount : (agentResponse.citations || []).length,
            suggestedActions: agentResponse.suggestedActions || [],
            structuredCards: agentResponse.structuredCards || {},
            confidence: agentResponse.confidence,
            meta: agentResponse.meta
          }
        }
      ];

      // Fire-and-forget persistence to not block the response
      Chat.updateOne(
        { _id: chat._id },
        { $push: { messages: { $each: newMessages } } }
      ).catch(persistErr => {
        console.error(`[AgentController] Warning: Chat persistence failed [${requestId}]:`, persistErr.message);
      });
    }
    const tSave = Date.now() - tSaveStart;

    // Retrieve internal agent timings if present
    const tLlm1 = agentResponse.meta?._trace?.tLlm1 || 0;
    const tTools = agentResponse.meta?._trace?.tTools || 0;
    const tLlm2 = agentResponse.meta?._trace?.tLlm2 || 0;
    const tTotal = tContext + tHistory + tAgent + tSave;

    console.log(`\n[AGENT TIMING]`);
    console.log(`context: ${tContext}ms`);
    console.log(`history: ${tHistory}ms`);
    console.log(`llm-1: ${tLlm1}ms`);
    console.log(`tools: ${tTools}ms`);
    console.log(`llm-2: ${tLlm2}ms`);
    console.log(`agent_core: ${tAgent}ms`);
    console.log(`save: ${tSave}ms`);
    console.log(`TOTAL: ${tTotal}ms\n`);

    if (isSSE) {
      // For SSE, do NOT send the chat object — it's stale (messages were persisted
      // via fire-and-forget updateOne, not yet in memory). Sending it would cause
      // chatStore to replace activeChat and wipe all the streamed content.
      // The frontend should keep the already-streamed content and just finalize metadata.
      res.write(`data: ${JSON.stringify({
        type: 'done',
        sessionId: session.sessionId,
        chatId: chat ? String(chat._id) : null,
        chat: null,
        response: agentResponse
      })}\n\n`);
      res.end();
      return;
    } else {
      return res.status(200).json({
        success: true,
        sessionId: session.sessionId,
        chatId: chat ? String(chat._id) : null,
        chat: chat ? chat.toObject() : null,
        response: agentResponse
      });
    }

  } catch (err) {
    console.error(`[AgentController] Error [${requestId}]:`, err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: "An error occurred while processing your request. Please try again." })}\n\n`);
      res.end();
    } else {
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing your request. Please try again.",
        sessionId: null
      });
    }
  }
};