/**
 * Discovery Uttarakhand - Phase 7 Agent Session Store
 * In-memory store for conversational sessions with TTL.
 * Tracks: conversation history, candidate allowlists, pending confirmations.
 * Sessions expire after 30 minutes. NOT persisted to MongoDB (Phase 7 scope).
 */
import crypto from "crypto";

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_TURNS = 20;
const SUMMARY_THRESHOLD = 8;
const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

const sessions = new Map();

function _evict() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL_MS) sessions.delete(id);
  }
}

export function createSession({ userId = null, tripId = null } = {}) {
  _evict();
  const sessionId = crypto.randomUUID();
  const record = {
    sessionId,
    userId,
    tripId,
    history: [],
    contextEntities: {
      destination: null,
      destinationId: null,
      origin: null,
      startDate: null,
      endDate: null,
      duration: null,
      durationMin: null,
      durationMax: null,
      travelers: null,
      budget: null,
      transport: null,
      interests: [],
      tripTypes: [],
      pace: null,
      activeTripId: null,
      lastIntent: null,
      planningState: null,
      lastReferencedEntity: null
    },
    allowlist: {
      destinations: new Set(),
      stays: new Set(),
      activities: new Set(),
      guides: new Set(),
      transports: new Set(),
      rentals: new Set(),
      listings: new Set()
    },
    pendingConfirmation: null,
    lastActivity: Date.now(),
    historySummary: null
  };
  sessions.set(sessionId, record);
  return sessionId;
}

export function updateContextEntities(session, entities = {}) {
  if (!session) return;
  if (!session.contextEntities) {
    session.contextEntities = {
      destination: null,
      destinationId: null,
      origin: null,
      startDate: null,
      endDate: null,
      duration: null,
      travelers: null,
      budget: null,
      transport: null,
      interests: [],
      tripTypes: [],
      pace: null,
      activeTripId: null,
      lastIntent: null,
      lastReferencedEntity: null
    };
  }
  for (const [key, val] of Object.entries(entities)) {
    if (val !== undefined && val !== null && val !== "") {
      session.contextEntities[key] = val;
      if (key === "durationDays") session.contextEntities.duration = val;
      if (key === "duration") session.contextEntities.durationDays = val;
    }
  }
  session.lastActivity = Date.now();
}

export function getContextEntities(session) {
  return session?.contextEntities || {};
}

export function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() - session.lastActivity > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  session.lastActivity = Date.now();
  return session;
}

export function getOrCreateSession({ sessionId, userId = null, tripId = null } = {}) {
  if (sessionId) {
    const existing = getSession(sessionId);
    if (existing) {
      if (userId && !existing.userId) existing.userId = userId;
      if (tripId && !existing.tripId) existing.tripId = tripId;
      return existing;
    }
  }
  const newId = createSession({ userId, tripId });
  return getSession(newId);
}

function _summarizeTurns(turns, existingSummary) {
  const lines = turns.map(t => `${t.role === "user" ? "User" : "Agent"}: ${String(t.content).slice(0, 200)}`);
  const newSummary = lines.join("\n");
  if (existingSummary) return `${existingSummary}\n---\n${newSummary}`.slice(-3000);
  return newSummary;
}

export function addTurn(session, { role, content }) {
  session.history.push({ role, content, timestamp: Date.now() });
  if (session.history.length > MAX_TURNS) session.history = session.history.slice(-MAX_TURNS);
  if (session.history.length > SUMMARY_THRESHOLD) {
    const old = session.history.slice(0, session.history.length - SUMMARY_THRESHOLD);
    session.historySummary = _summarizeTurns(old, session.historySummary);
    session.history = session.history.slice(session.history.length - SUMMARY_THRESHOLD);
  }
  session.lastActivity = Date.now();
}

export function mergeAllowlist(session, additions = {}) {
  for (const [key, ids] of Object.entries(additions)) {
    if (!session.allowlist[key]) session.allowlist[key] = new Set();
    if (Array.isArray(ids)) ids.forEach(id => session.allowlist[key].add(String(id)));
    else if (ids instanceof Set) ids.forEach(id => session.allowlist[key].add(String(id)));
  }
}

export function isAllowlisted(session, id) {
  if (!id) return false;
  const strId = String(id);
  for (const set of Object.values(session.allowlist)) {
    if (set.has(strId)) return true;
  }
  return false;
}

export function setPendingConfirmation(session, { actionType, payload, tripId, userId }) {
  session.pendingConfirmation = {
    actionType,
    payload,
    tripId: tripId || session.tripId,
    userId: userId || session.userId,
    expiresAt: Date.now() + CONFIRMATION_TTL_MS
  };
  session.lastActivity = Date.now();
}

export function consumeConfirmation(session, { userId, tripId }) {
  const conf = session.pendingConfirmation;
  if (!conf) return { ok: false, reason: "No pending confirmation in this session." };
  if (Date.now() > conf.expiresAt) {
    session.pendingConfirmation = null;
    return { ok: false, reason: "Confirmation expired. Please request the change again." };
  }
  if (conf.userId && conf.userId !== String(userId)) return { ok: false, reason: "Confirmation user mismatch." };
  if (conf.tripId && tripId && conf.tripId !== String(tripId)) return { ok: false, reason: "Confirmation trip mismatch." };
  const result = { ok: true, confirmation: { ...conf } };
  session.pendingConfirmation = null;
  return result;
}

export function clearPendingConfirmation(session) {
  session.pendingConfirmation = null;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

export function _getSessionCount() { return sessions.size; }
export function _clearAllSessions() { sessions.clear(); }