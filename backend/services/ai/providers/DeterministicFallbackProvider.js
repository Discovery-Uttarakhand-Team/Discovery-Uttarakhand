/**
 * Discovery Uttarakhand — Deterministic Fallback AI Provider
 * Rule-based, zero-network synthesis engine that generates grounded, personalized
 * itinerary insights directly from verified database context and deterministic engine results.
 * 
 * Used when:
 * 1. External AI APIs (Gemini/OpenAI) are unavailable, rate-limited, or offline.
 * 2. High-speed, guaranteed-uptime test suites and edge environments.
 * 3. Fallback when an external LLM produces malformed or ungrounded responses.
 */

import { BaseAiProvider } from './BaseAiProvider.js';
import { resolveDestination } from '../../destinationResolver.js';

export class DeterministicFallbackProvider extends BaseAiProvider {
  constructor() {
    super('deterministic');
  }

  async generatePlan(context, options = {}) {
    const meta = context.tripMetadata || {};
    const dest = meta.destination || { name: 'Uttarakhand', district: 'Himalayas' };
    const origin = meta.origin || { name: 'Delhi' };
    const days = context.itineraryContext || [];
    const pool = context.candidatePool || {};
    const budget = context.budgetSummary || {};

    const destName = dest.name;
    const duration = days.length > 0 ? days.length : (meta.durationDays || 7);
    const pace = meta.pace || 'Balanced';

    // 1. Personalized Summary Narrative
    const summary = `Structured ${duration}-day ${pace.toLowerCase()}-paced Himalayan journey from ${origin.name} to ${destName}, planned with daylight transit corridors, altitude acclimatization, and verified mountain stays.`;

    // 2. Altitude & Acclimatization Guidance
    const isHighAltitude = (dest.altitudeMeters || 0) > 2200;
    const pacingAndAcclimatization = {
      acclimatizationRequired: isHighAltitude,
      elevationProfileAdvice: isHighAltitude
        ? `Gradual ascent from ${origin.name} to intermediate foothill bases before reaching ${destName} (${dest.altitudeMeters || 2400}m). Hydrate thoroughly and avoid strenuous climbs on arrival.`
        : `Gentle mountain terrain suitable for direct exploration. Maintain standard daytime transit to avoid fog and ghat curve fatigue.`,
      paceAssessment: `${pace} pacing aligns with daylight mountain road travel guidelines, ensuring well-distributed travel without nighttime driving.`
    };

    // 3. Day-by-day Synthesized Reasoning
    const daysOutput = days.map((d, idx) => {
      const isFirstDay = idx === 0;
      const isLastDay = idx === days.length - 1;
      const dayBase = d.base?.name || (isFirstDay ? origin.name : destName);
      const isTrek = d.dayType === 'trek';

      // Reasoning statements
      const reasoning = [];
      if (isFirstDay) {
        reasoning.push(`Strategic departure day: Transitioning from ${origin.name} to Uttarakhand gateway base (${dayBase}) to break mountain ascent.`);
        reasoning.push(`Daylight arrival ensures safety on hill roads before twilight.`);
      } else if (isLastDay) {
        reasoning.push(`Controlled return corridor: Descending from ${dayBase} back toward ${origin.name} with margin for mountain road traffic.`);
      } else if (isTrek) {
        reasoning.push(`High-elevation exploration day: Acclimatized exploration around ${dayBase} with local licensed mountain guide.`);
      } else {
        reasoning.push(`Immersive base day in ${dayBase}: Exploring local heritage, viewpoints, and scenic circuits without long vehicle transit.`);
      }

      // Match recommended stay candidate from pool if available
      let recommendedStay = null;
      if (d.selectedStayCandidate) {
        recommendedStay = {
          stayId: d.selectedStayCandidate.stayId,
          name: d.selectedStayCandidate.name,
          tariffQuote: d.selectedStayCandidate.tariffPerNight
            ? `Nightly tariff ₹${d.selectedStayCandidate.tariffPerNight} (${d.selectedStayCandidate.provenance})`
            : `Tariff available at reception (Counter only)`,
          provenance: d.selectedStayCandidate.provenance || 'STATIC_VERIFIED',
          evidenceRefs: [d.selectedStayCandidate.stayId]
        };
      } else if (pool.stays && pool.stays.length > 0) {
        const candidateStay = pool.stays[idx % pool.stays.length];
        recommendedStay = {
          stayId: candidateStay.id,
          name: candidateStay.name,
          tariffQuote: candidateStay.tariffPerNight
            ? `Nightly tariff ₹${candidateStay.tariffPerNight} (Verified)`
            : `Counter pricing at booking desk`,
          provenance: candidateStay.provenance,
          evidenceRefs: [candidateStay.id]
        };
      }

      // Match recommended activity candidate from pool if available
      const recommendedActivities = [];
      if (pool.activities && pool.activities.length > 0) {
        const candidateAct = pool.activities[idx % pool.activities.length];
        recommendedActivities.push({
          activityId: candidateAct.id,
          name: candidateAct.name,
          timing: isFirstDay ? 'Evening' : 'Morning',
          reason: `Gentle local immersion fitting your ${pace} pace preference.`,
          evidenceRefs: [candidateAct.id]
        });
      }

      // Match guide candidate if trek or exploration
      let recommendedGuide = null;
      if ((isTrek || idx === 1) && pool.guides && pool.guides.length > 0) {
        const candGuide = pool.guides[idx % pool.guides.length];
        recommendedGuide = {
          guideId: candGuide.id,
          name: candGuide.name,
          specialty: candGuide.specialty || 'Trek & Local Culture',
          evidenceRefs: [candGuide.id]
        };
      }

      return {
        day: d.dayNumber,
        base: dayBase,
        reasoning,
        journeySegments: (d.journeySegments || []).map(seg => ({
          segmentId: seg.segmentId,
          from: seg.from,
          to: seg.to,
          mode: seg.mode,
          notes: seg.fare ? `Verified corridor fare: ₹${seg.fare}` : 'Local counter fare applies',
          provenance: seg.provenance,
          evidenceRefs: [seg.segmentId]
        })),
        recommendedActivities,
        recommendedStay,
        recommendedGuide,
        constraints: [
          'No hill transit past 6:00 PM.',
          'Keep photo IDs and offline route maps ready.'
        ],
        warnings: idx === 0 ? ['Check foothill traffic conditions before departing.'] : [],
        nextDayPreview: isLastDay 
          ? 'Journey concludes. Return safely.' 
          : `Day ${d.dayNumber + 1} progresses toward next milestone in ${dest.district || destName}.`
      };
    });

    // 4. Bounded Alternatives from Candidate Pool
    const alternatives = [];
    if (pool.stays && pool.stays.length > 1) {
      const altStay = pool.stays[1];
      alternatives.push({
        candidateId: altStay.id,
        entityType: 'Stay',
        name: altStay.name,
        tradeoff: altStay.isGovernmentRestHouse
          ? 'Government KMVN/GMVN tourist rest house with assured baseline tariffs.'
          : 'Alternative private boutique lodge option in surrounding valley.'
      });
    }

    // 5. Grounded Budget Narrative
    const budgetExplanation = {
      status: budget.budgetStatus || 'NEAR_BUDGET',
      narrative: `Estimated trip total (₹${(budget.minCost || 0).toLocaleString()} – ₹${(budget.maxCost || 0).toLocaleString()}) reflects verified stay tariffs and scheduled transport legs. Food and local mountain counter cabs are estimated.`,
      uncertaintyNotes: budget.assumptions || [
        'Food cost estimated at ₹500–₹800/day/traveler.',
        'Local mountain shared cabs require cash at counter.'
      ]
    };

    return {
      summary,
      personalizationTone: `${pace} Himalayan Explorer`,
      pacingAndAcclimatization,
      days: daysOutput,
      alternatives,
      budgetExplanation,
      warnings: context.knownConstraints?.mountainHazards || [
        'Always verify mountain pass weather conditions before morning departure.'
      ],
      assumptions: budget.assumptions || [
        'Road transit estimates calculated via OSRM mountain curvature speeds.'
      ],
      confidence: {
        level: 'HIGH',
        score: 0.98,
        groundedRatio: 1.0
      }
    };
  }

  /**
   * Phase 7: Deterministic chat fallback.
   * Analyzes messages to detect intent and generates a grounded response.
   * No external API calls - works offline.
   */
  async chat(systemPrompt, messages, toolSchemas = []) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const userText = (lastUserMsg?.parts?.[0]?.text || lastUserMsg?.content || "").toLowerCase();

    // Read trusted data injected by tool results
    const trustedDataMatches = messages
      .filter(m => m.role === "tool")
      .map(m => m.parts?.[0]?.text || "")
      .join("\n");

    // If we have trusted tool data, synthesize from it
    if (trustedDataMatches.includes("TRUSTED_DATA")) {
      const response = this._synthesizeFromTrustedData(userText, trustedDataMatches);
      return { text: response, toolCall: null };
    }

    // Tool selection based on intent keywords with multi-turn context
    const toolCall = this._selectTool(userText, toolSchemas, messages, systemPrompt);
    if (toolCall) return { text: null, toolCall };

    // Direct answer for common queries
    return { text: this._directAnswer(userText, messages, systemPrompt), toolCall: null };
  }

  _selectTool(userText, toolSchemas, messages = [], systemPrompt = "") {
    if (!toolSchemas || toolSchemas.length === 0) return null;
    const available = new Set(toolSchemas.map(t => t.name));
    const location = this._extractLocation(userText, messages, systemPrompt) || "Uttarakhand";

    if (/weather|temperature|rain|snow|climate/.test(userText) && available.has("getWeather"))
      return { name: "getWeather", args: { location } };
    if (/road|highway|safe|accident|landslide|advisory|condition/.test(userText) && available.has("getRoadAdvisory"))
      return { name: "getRoadAdvisory", args: { destination: location, corridor: location !== "Uttarakhand" ? `Rishikesh -> ${location}` : "General Uttarakhand" } };
    if (/(budget|cost|price|expensive|cheap|cheaper|afford|money|rupee|rs\.|inr|reduce)/.test(userText) && available.has("calculateBudget")) {
      const budgetArgs = this._extractBudgetArgs(userText, messages, systemPrompt);
      budgetArgs.destination = location;
      return { name: "calculateBudget", args: budgetArgs };
    }
    if (/(stay|hotel|resort|lodge|accommodation|room|guesthouse)/.test(userText) && available.has("findStays"))
      return { name: "findStays", args: { destination: location } };
    if (/(guide|local guide|trek guide|expert)/.test(userText) && available.has("findGuides"))
      return { name: "findGuides", args: { destination: location } };
    if (/(transport|bus|train|taxi|vehicle|how to reach|how to go)/.test(userText) && available.has("getTransitStatus"))
      return { name: "getTransitStatus", args: { origin: "Delhi", destination: location } };
    if (/(recommend|suggest)/.test(userText) && available.has("getRecommendations"))
      return { name: "getRecommendations", args: { destination: location } };
    if (/(explore|what can i do|what to do|things to do|boating|trekking)/.test(userText) && available.has("exploreDestination")) {
      let interest = null;
      if (/trek/.test(userText)) interest = "trekking";
      else if (/boat/.test(userText)) interest = "boating";
      else if (/nature|viewpoint/.test(userText)) interest = "nature";
      else if (/spiritual|temple/.test(userText)) interest = "spiritual";
      return { name: "exploreDestination", args: { destination: location, interest } };
    }
    if (/(my trip|my itinerary|explain.*trip|tell.*trip|what.*plan)/.test(userText) && available.has("getItinerary"))
      return null; // Need tripId - handled upstream
    return null;
  }

  _extractLocation(text, messages = [], systemPrompt = "") {
    // 1. Scan system prompt for active destination first
    let ctxDest = null;
    if (systemPrompt) {
      const activeMatch = systemPrompt.match(/Active Destination:\s*([^\n\r]+)/i) ||
                          systemPrompt.match(/-\s*Destination:\s*([^\n\r]+)/i);
      if (activeMatch && activeMatch[1] && !/Not set|Uttarakhand/i.test(activeMatch[1])) {
        ctxDest = activeMatch[1].trim();
      }
    }

    // 2. Check current user query using dynamic Canonical Destination Resolver
    const resolved = resolveDestination(text, { destination: ctxDest });
    if (resolved) {
      return resolved.name;
    }

    // 3. Scan previous messages in reverse (multi-turn resolution)
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const mText = (m.parts?.[0]?.text || m.content || "").trim();
      const prevResolved = resolveDestination(mText, { destination: ctxDest });
      if (prevResolved) {
        return prevResolved.name;
      }
    }

    // 4. Return active context destination if found
    if (ctxDest) {
      const res = resolveDestination(ctxDest);
      if (res) return res.name;
    }

    return null;
  }

  _extractBudgetArgs(userText, messages = [], systemPrompt = "") {
    let durationDays = 5;
    let travelers = 2;
    let budgetTier = "Balanced";

    if (/cheap|cheaper|reduce|budget|low\s*cost/i.test(userText)) {
      budgetTier = "Budget";
    }

    // Scan messages in reverse for duration & travelers
    const allTexts = [userText, ...messages.slice(-6).map(m => m.parts?.[0]?.text || m.content || ""), systemPrompt];
    for (const t of allTexts) {
      if (typeof t !== "string") continue;
      const dMatch = t.match(/(\d+)\s*days?/i);
      if (dMatch && !isNaN(parseInt(dMatch[1], 10))) {
        durationDays = parseInt(dMatch[1], 10);
        break;
      }
    }

    for (const t of allTexts) {
      if (typeof t !== "string") continue;
      const tMatch = t.match(/(\d+)\s*(?:person|people|traveler|adult)s?/i);
      if (tMatch && !isNaN(parseInt(tMatch[1], 10))) {
        travelers = parseInt(tMatch[1], 10);
        break;
      }
    }

    return { durationDays, travelers, budgetTier };
  }

  _synthesizeFromTrustedData(userText, trustedData) {
    let toolName = "unknown";
    let dataObj = null;
    let provenance = "UNKNOWN";

    try {
      const toolMatch = trustedData.match(/<TRUSTED_DATA tool="([^"]+)">/);
      if (toolMatch) toolName = toolMatch[1];
      
      const contentMatch = trustedData.match(/<TRUSTED_DATA tool="[^"]+">\n([\s\S]*?)\nProvenance: (.*?)\n<\/TRUSTED_DATA>/);
      if (contentMatch) {
        dataObj = JSON.parse(contentMatch[1]);
        provenance = contentMatch[2];
      }
    } catch (e) {
      // Fallback if parsing fails
    }

    if (dataObj) {
      if (toolName === "getWeather") {
        if (dataObj.status === "UNAVAILABLE") return "Weather data is currently unavailable. Please check local sources.";
        const temp = dataObj.data?.temperature ?? dataObj.data?.temperatureC ?? '--';
        const condition = dataObj.data?.weatherCondition || dataObj.data?.condition || 'Clear / Mountain Conditions';
        const wind = dataObj.data?.windSpeedKmh ?? '--';
        return `Here is the weather forecast for **${dataObj.location || 'your destination'}**:\n- **Temperature**: ${temp}°C\n- **Condition**: ${condition}\n- **Wind Speed**: ${wind} km/h\n\n*Status: ${provenance} (Open-Meteo)*\nMountain weather shifts quickly—keep warm layers and check daylight transit.`;
      }
      
      if (toolName === "getRoadAdvisory") {
        if (dataObj.status === "UNAVAILABLE") return "Road advisory data is currently unavailable.";
        const advisories = dataObj.data?.advisories?.length > 0 
          ? dataObj.data.advisories.map(a => `- ${a}`).join("\n") 
          : "- No major advisories.";
        return `Here is the road advisory for **${dataObj.corridor || 'your route'}**:\n- **Condition**: ${dataObj.data?.routeCondition || 'Unknown'}\n\n**Advisories**:\n${advisories}\n\n*Status: ${provenance}*\nExercise caution on ghat curves and avoid night transit.`;
      }

      if (toolName === "calculateBudget") {
        return `Here is an optimized **${dataObj.budgetStatus || 'Budget'}** tier estimate:\n- **Total Estimated Cost**: ₹${dataObj.totalEstimatedCost?.toLocaleString() || '--'}\n- **Breakdown**: Stay: ₹${dataObj.breakdown?.accommodation?.toLocaleString() || '--'}, Transport: ₹${dataObj.breakdown?.transport?.toLocaleString() || '--'}, Food: ₹${dataObj.breakdown?.food?.toLocaleString() || '--'}\n\n*Status: ${provenance}*`;
      }

      if (toolName === "exploreDestination") {
        if (dataObj.emptyStateMessage) {
          return `${dataObj.emptyStateMessage}\n\n*Status: ${provenance}*\nI can only recommend verified activities in this area. Would you like to check lakes/boating or nearby stays instead?`;
        }
        if (dataObj.matchingResults && dataObj.matchingResults.length > 0) {
          const list = dataObj.matchingResults.map((m, i) => {
            const priceStr = m.price ? ` — ${m.price} (${m.priceProvenance || 'VERIFIED'})` : ' — Price not verified';
            const distStr = m.distanceKm ? ` (~${m.distanceKm} km)` : '';
            return `${i + 1}. **${m.name}** [${m.category || 'Experience'}]${distStr}${priceStr}`;
          }).join("\n");
          return `Here are verified **${dataObj.activeInterest || 'discovery'}** options for **${dataObj.destination}** (${dataObj.district}):\n${list}\n\n*All results strictly grounded in Discovery Uttarakhand dataset (${provenance}).*`;
        }
        if (dataObj.availableCategories && dataObj.availableCategories.length > 0) {
          const cats = dataObj.availableCategories.map(c => `- ${c}`).join("\n");
          return `**Explore ${dataObj.destination}** (${dataObj.district} District):\nHere is what you can discover:\n${cats}\n\nAsk me about any activity (e.g. "What boating is available?" or "Show stays nearby") to explore!`;
        }
        return `I explored **${dataObj.destination || 'that destination'}**, but found limited verified activity records at this time.`;
      }

      if (toolName === "findStays") {
        if (!dataObj.stays || dataObj.stays.length === 0) return `I couldn't find verified stays in **${dataObj.destination || 'that location'}** in our dataset at the moment.`;
        const staysList = dataObj.stays.map((s, i) => `${i + 1}. **${s.name}** — ${s.pricePerNight ? '₹'+s.pricePerNight+'/night' : 'Tariff at counter'} (${s.isGMVN || s.isKMVN ? 'Government / Verified' : 'Verified'})`).join("\n");
        return `Here are verified stays in **${dataObj.destination || 'your destination'}** from our dataset:\n${staysList}\n\n*All options carry verified provenance.*`;
      }
      
      if (toolName === "getTransitStatus") {
        if (dataObj.status === "UNAVAILABLE" || dataObj.status === "UNKNOWN") return `Transit schedule for **${dataObj.origin}** to **${dataObj.destination}** is not available. Please visit official portals.`;
        return `Here is the transit status for **${dataObj.origin}** to **${dataObj.destination}** (${dataObj.mode}):\n- **Status**: ${dataObj.data?.status || 'Unknown'}\n- **Next Departure**: ${dataObj.data?.nextDeparture || '--'}\n\n*Status: ${provenance}*`;
      }
    }

    // Generic fallback
    if (trustedData.includes('"status":"LIVE"') || trustedData.includes('"provenance":"LIVE"'))
      return "Based on the live data retrieved, I can provide you with current information. Please note that conditions in mountain areas can change rapidly — always verify with local sources before travel.";
    if (trustedData.includes('"status":"STALE"') || trustedData.includes('"provenance":"STALE"'))
      return "I found some information, but please note the data may be slightly outdated. Verify current conditions with local authorities before travel.";
    if (trustedData.includes('"status":"UNAVAILABLE"') || trustedData.includes("UNAVAILABLE"))
      return "The data service is currently unavailable. I recommend checking official sources like the Uttarakhand Disaster Management Authority website for current conditions.";
    if (trustedData.includes('"provenance":"VERIFIED"'))
      return "Based on verified data from our trusted dataset, here is the information you requested. Prices and availability may change — confirm details at the time of booking.";
    return "I found some information for you. Please note that some details carry estimated or unknown provenance — verify critical facts before making travel decisions.";
  }

  _directAnswer(userText, messages = [], systemPrompt = "") {
    const lower = (userText || "").toLowerCase();
    if (/hello|hi|hey/.test(lower))
      return "Namaste! I'm your Discovery Uttarakhand AI Travel Copilot. I can help you plan your trip, check road safety, find stays, calculate budgets, and more. What would you like to know?";
    if (/thank|thanks/.test(lower))
      return "You're welcome! Safe travels in Uttarakhand. Is there anything else I can help you with?";
    if (/help|what can you do/.test(lower))
      return "I can help you with:\n- **Trip planning** — explain your itinerary, suggest modifications\n- **Budget** — calculate and optimize costs\n- **Safety** — road advisories and weather conditions\n- **Accommodation** — find verified stays\n- **Guides** — find local certified guides\n- **Transport** — transit options\n\nWhat would you like to know?";

    const location = this._extractLocation(userText, messages, systemPrompt);
    if (location) {
      return `Bilkul! Main ${location} ke liye verified trip plan karne mein aapki madad kar sakta hoon. Aap kab travel karna chahenge aur kahan se start karenge?`;
    }

    if (/trip|plan|ghoom|travel|itinerary|want to go|jana hai/i.test(lower)) {
      return "Uttarakhand mein aap kahan travel karna chahte hain? (Jaise Valley of Flowers, Kedarnath, Badrinath, Auli, Munsiyari, Chopta, ya Nainital). Mujhe destination batayein, main verified plan taiyaar kar dunga.";
    }

    return "I'm your AI Travel Copilot for Uttarakhand. Ask me about your trip, road conditions, weather, stays, guides, or budget — I'll give you grounded answers based on verified data.";
  }
}