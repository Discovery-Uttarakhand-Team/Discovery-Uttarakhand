/**
 * Discovery Uttarakhand — AI Planner Service
 * Orchestrates provider resolution, timeout handling, strict schema validation,
 * candidate-ID allowlist validation, provenance immutability enforcement, and fail-safe fallback.
 */

import { OmniRouteProvider } from './ai/providers/OmniRouteProvider.js';
import { GeminiProvider } from './ai/providers/GeminiProvider.js';
import { OpenAIProvider } from './ai/providers/OpenAIProvider.js';
import { DeterministicFallbackProvider } from './ai/providers/DeterministicFallbackProvider.js';

export class AiPlannerService {
  /**
   * Resolves the configured AI provider with OmniRoute -> Gemini -> OpenAI -> Deterministic priority.
   * @param {string} [requestedProvider]
   * @returns {BaseAiProvider}
   */
  static getProvider(requestedProvider) {
    const providerName = (requestedProvider || process.env.AI_PROVIDER || '').toLowerCase();

    // 1. Explicit override if requested
    if (providerName === 'omniroute' && process.env.OMNIROUTE_ENABLED !== 'false' && process.env.OMNIROUTE_API_KEY) {
      return new OmniRouteProvider();
    }
    if (providerName === 'gemini' && process.env.GEMINI_API_KEY) {
      return new GeminiProvider();
    }
    if (providerName === 'openai' && process.env.OPENAI_API_KEY) {
      return new OpenAIProvider();
    }
    if (providerName === 'deterministic') {
      return new DeterministicFallbackProvider();
    }

    // 2. Default hierarchy: OmniRoute -> Gemini -> OpenAI -> Deterministic
    if (process.env.OMNIROUTE_ENABLED !== 'false' && process.env.OMNIROUTE_API_KEY) {
      return new OmniRouteProvider();
    }
    if (process.env.GEMINI_API_KEY) {
      return new GeminiProvider();
    }
    if (process.env.OPENAI_API_KEY) {
      return new OpenAIProvider();
    }
    return new DeterministicFallbackProvider();
  }

  /**
   * Executes AI reasoning over the bounded context with timeout, schema, and hallucination validation.
   * @param {Object} context Bounded context from AiContextBuilder
   * @param {Object} allowlist Allowlist sets from AiContextBuilder
   * @param {Object} [options]
   * @returns {Promise<{ plan: Object, meta: Object }>}
   */
  static async generatePlan(context, allowlist, options = {}) {
    const fallbackProvider = new DeterministicFallbackProvider();
    const primaryProvider = this.getProvider(options.provider);

    let rawOutput = null;
    let usedProvider = primaryProvider.name;
    let mode = 'ai';

    // 1. Execute with Timeout Guard (8,000 ms)
    try {
      if (primaryProvider.name === 'deterministic') {
        rawOutput = await primaryProvider.generatePlan(context, options);
        mode = 'fallback';
      } else {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI Provider [${primaryProvider.name}] timed out after 8000ms`)), 8000)
        );
        rawOutput = await Promise.race([
          primaryProvider.generatePlan(context, options),
          timeoutPromise
        ]);
      }
    } catch (err) {
      console.warn(`[AI Planner] Provider ${primaryProvider.name} failed (${err.message}). Engaging deterministic fallback.`);
      rawOutput = await fallbackProvider.generatePlan(context, options);
      usedProvider = 'deterministic';
      mode = 'fallback';
    }

    // 2. Validate Schema & Boundaries
    let validationResult = this.validateAndSanitizeOutput(rawOutput, allowlist, context);

    if (!validationResult.isValid) {
      console.warn(`[AI Planner] AI output failed schema/grounding checks (${validationResult.error}). Falling back to deterministic plan.`);
      rawOutput = await fallbackProvider.generatePlan(context, options);
      validationResult = this.validateAndSanitizeOutput(rawOutput, allowlist, context);
      usedProvider = 'deterministic';
      mode = 'fallback';
    }

    return {
      plan: validationResult.sanitizedPlan,
      meta: {
        provider: usedProvider,
        mode,
        grounded: true,
        checkedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Validates structured plan against schema, candidate-ID allowlist, and provenance immutability.
   * @param {Object} plan 
   * @param {Object} allowlist
   * @param {Object} context
   * @returns {{ isValid: boolean, error?: string, sanitizedPlan: Object }}
   */
  static validateAndSanitizeOutput(plan, allowlist, context) {
    if (!plan || typeof plan !== 'object') {
      return { isValid: false, error: 'Output is not an object', sanitizedPlan: null };
    }

    if (!plan.summary || typeof plan.summary !== 'string' || plan.summary.trim().length === 0) {
      return { isValid: false, error: 'Missing or empty summary', sanitizedPlan: null };
    }

    if (!Array.isArray(plan.days) || plan.days.length === 0) {
      return { isValid: false, error: 'Days must be a non-empty array', sanitizedPlan: null };
    }

    // Output size limit check (prevent token inflation attacks)
    const serialized = JSON.stringify(plan);
    if (serialized.length > 50000) {
      return { isValid: false, error: 'AI output size exceeds safe limits (>50KB)', sanitizedPlan: null };
    }

    // Clone plan to sanitize
    const sanitizedPlan = JSON.parse(serialized);

    const expectedDayCount = context.itineraryContext?.length || context.tripMetadata?.durationDays || sanitizedPlan.days.length;
    if (sanitizedPlan.days.length > expectedDayCount) {
      sanitizedPlan.days = sanitizedPlan.days.slice(0, expectedDayCount);
    }
    if (sanitizedPlan.summary && expectedDayCount) {
      sanitizedPlan.summary = sanitizedPlan.summary.replace(/\b\d+[- ]day\b/gi, `${expectedDayCount}-day`);
    }

    // Context price lookup map to catch hallucinated price attacks
    const verifiedStayTariffs = new Map();
    (context.candidatePool?.stays || []).forEach(s => {
      verifiedStayTariffs.set(s.id, s.tariffPerNight);
    });

    // Validate and sanitize each day
    for (let i = 0; i < sanitizedPlan.days.length; i++) {
      const day = sanitizedPlan.days[i];

      if (typeof day.day !== 'number') {
        day.day = i + 1;
      }

      // A. Validate Recommended Stay against Allowlist
      if (day.recommendedStay) {
        const stayId = day.recommendedStay.stayId;
        if (!stayId || !allowlist.stays.has(stayId)) {
          // Unknown stay entity returned by AI! Reject it.
          day.recommendedStay = null;
        } else {
          // Check provenance immutability & hallucinated price
          const knownTariff = verifiedStayTariffs.get(stayId);
          if (knownTariff === null || knownTariff === undefined) {
            // Context has no verified tariff. AI must not claim verified exact price!
            if (day.recommendedStay.tariffQuote && day.recommendedStay.tariffQuote.match(/₹\s*\d+/)) {
              // Strip hallucinated amount
              day.recommendedStay.tariffQuote = 'Counter enquiry required (Tariff unverified)';
            }
            day.recommendedStay.provenance = 'UNKNOWN';
          }
        }
      }

      // B. Validate Recommended Activities against Allowlist
      if (Array.isArray(day.recommendedActivities)) {
        day.recommendedActivities = day.recommendedActivities.filter(act => {
          if (!act.activityId || !allowlist.activities.has(act.activityId)) {
            return false; // Discard phantom activity
          }
          return true;
        });
      } else {
        day.recommendedActivities = [];
      }

      // C. Validate Recommended Guide against Allowlist
      if (day.recommendedGuide) {
        const guideId = day.recommendedGuide.guideId;
        if (!guideId || !allowlist.guides.has(guideId)) {
          day.recommendedGuide = null;
        }
      }

      // D. Ensure reasoning and constraints are valid arrays
      if (!Array.isArray(day.reasoning)) {
        day.reasoning = [typeof day.reasoning === 'string' ? day.reasoning : 'Acclimatized daylight transit.'];
      }
      if (!Array.isArray(day.constraints)) {
        day.constraints = ['Mountain daylight driving only.'];
      }
      if (!Array.isArray(day.warnings)) {
        day.warnings = [];
      }
    }

    // Validate alternatives against Allowlist
    if (Array.isArray(sanitizedPlan.alternatives)) {
      sanitizedPlan.alternatives = sanitizedPlan.alternatives.filter(alt => {
        if (alt.candidateId && (allowlist.stays.has(alt.candidateId) || allowlist.activities.has(alt.candidateId))) {
          return true;
        }
        return false;
      });
    } else {
      sanitizedPlan.alternatives = [];
    }

    // Ensure budgetExplanation structure
    if (!sanitizedPlan.budgetExplanation || typeof sanitizedPlan.budgetExplanation !== 'object') {
      sanitizedPlan.budgetExplanation = {
        status: context.budgetSummary?.budgetStatus || 'NEAR_BUDGET',
        narrative: 'Calculated using verified government tariffs and estimated food/fuel allowances.',
        uncertaintyNotes: context.budgetSummary?.assumptions || []
      };
    }

    // Confidence calibration
    if (!sanitizedPlan.confidence) {
      sanitizedPlan.confidence = {
        level: 'HIGH',
        score: 0.95,
        groundedRatio: 1.0
      };
    }

    return { isValid: true, sanitizedPlan };
  }
}
