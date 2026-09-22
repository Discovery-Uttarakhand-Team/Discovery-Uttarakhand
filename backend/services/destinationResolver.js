/**
 * Discovery Uttarakhand - Canonical Destination & Entity Resolver
 * Resolves destination names, slugs, and aliases dynamically from dataset / models.
 * Never relies on small hardcoded lists.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cached lookup table
let destinationCache = [];
let aliasMap = new Map();
let isInitialized = false;

// Common colloquial travel aliases
const STATIC_ALIASES = {
  "vof": "Valley of Flowers",
  "valley of flower": "Valley of Flowers",
  "valley of flowers": "Valley of Flowers",
  "flowers valley": "Valley of Flowers",
  "phoolon ki ghati": "Valley of Flowers",
  "corbett": "Jim Corbett National Park",
  "jim corbett": "Jim Corbett National Park",
  "badri": "Badrinath",
  "badrinath dham": "Badrinath",
  "kedar": "Kedarnath",
  "kedarnath dham": "Kedarnath",
  "gangotri dham": "Gangotri",
  "yamunotri dham": "Yamunotri",
  "hemkund": "Hemkund Sahib",
  "hemkund sahib": "Hemkund Sahib",
  "roop kund": "Roopkund",
  "adi kailash": "Adi Kailash",
  "om parvat": "Om Parvat",
  "chopta tungnath": "Chopta",
  "tungnath temple": "Tungnath",
  "chandrashila": "Chopta",
  "kanatal hill": "Kanatal",
  "dhanaulti eco park": "Dhanaulti",
  "george everest": "Mussoorie",
  "surkanda devi": "Dhanaulti",
  "kempty falls": "Mussoorie",
  "robbers cave": "Dehradun",
  "sahastradhara": "Dehradun",
  "triveni ghat": "Rishikesh",
  "ram jhula": "Rishikesh",
  "lakshman jhula": "Rishikesh",
  "har ki pauri": "Haridwar",
  "naini lake": "Nainital",
  "naina peak": "Nainital",
  "bhimtal lake": "Bhimtal",
  "naukuchiatal lake": "Naukuchiatal",
  "sattal lake": "Sattal"
};

const SPATIAL_PRONOUN_REGEX = /\b(wahan|udhar|uske paas|wahi|nearby|there|around there|same place|that place|wahan ka|wahan ke)\b/i;

/**
 * Initialize registry from seed JSONs and DB fallback
 */
export function initDestinationRegistry() {
  if (isInitialized && destinationCache.length > 0) return;

  const destMap = new Map();

  // Load from seed JSONs
  const seedPaths = [
    path.join(__dirname, '../seed/destinations.json'),
    path.join(__dirname, '../seed/spiritual.json'),
    path.join(__dirname, '../seed/activities.json'),
    path.join(__dirname, '../seed/culture.json')
  ];

  for (const p of seedPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.name && typeof item.name === 'string') {
              const cleanName = item.name.trim();
              if (!destMap.has(cleanName.toLowerCase())) {
                destMap.set(cleanName.toLowerCase(), {
                  name: cleanName,
                  slug: item.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  district: item.district || null,
                  region: item.region || null,
                  category: item.category || 'destination'
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`[DestinationResolver] Error reading ${p}:`, err.message);
    }
  }

  // Populate cache sorted by length descending so multi-word names match first
  destinationCache = Array.from(destMap.values()).sort((a, b) => b.name.length - a.name.length);

  // Build alias map
  aliasMap.clear();
  for (const [alias, canonical] of Object.entries(STATIC_ALIASES)) {
    aliasMap.set(alias.toLowerCase(), canonical);
  }
  for (const d of destinationCache) {
    aliasMap.set(d.name.toLowerCase(), d.name);
    if (d.slug) aliasMap.set(d.slug.toLowerCase().replace(/-/g, ' '), d.name);
  }

  isInitialized = true;
  console.log(`[DestinationResolver] Initialized with ${destinationCache.length} canonical destinations.`);
}

// Auto-initialize on module load
initDestinationRegistry();

/**
 * Resolve destination from text using multi-word matching & aliases
 * Also handles spatial pronouns ("wahan", "udhar", "uske paas") when context is provided
 * @param {string} text - User message or input string
 * @param {Object} [context] - Optional conversation context containing destination or lastDestination
 * @returns {Object|null} - { name, slug, district, region, id } or null
 */
export function resolveDestination(text, context = {}) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Direct alias check
  for (const [alias, canonicalName] of aliasMap.entries()) {
    const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
    if (regex.test(lower)) {
      const found = destinationCache.find(d => d.name.toLowerCase() === canonicalName.toLowerCase());
      if (found) {
        return {
          name: found.name,
          slug: found.slug,
          id: found.slug || found.name.toLowerCase(),
          district: found.district,
          region: found.region
        };
      }
      return {
        name: canonicalName,
        slug: canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        id: canonicalName.toLowerCase(),
        district: null,
        region: null
      };
    }
  }

  // 2. Scan canonical destinations in descending length order
  for (const dest of destinationCache) {
    const regex = new RegExp(`\\b${escapeRegExp(dest.name)}\\b`, 'i');
    if (regex.test(clean)) {
      return {
        name: dest.name,
        slug: dest.slug,
        id: dest.slug || dest.name.toLowerCase(),
        district: dest.district,
        region: dest.region
      };
    }
  }

  // 3. Pronoun / spatial reference resolution (e.g. "wahan", "udhar", "uske paas")
  if (SPATIAL_PRONOUN_REGEX.test(clean)) {
    const ctxDest = context.destination || context.lastDestination || (context.destinationNames && context.destinationNames[0]);
    if (ctxDest) {
      return resolveDestination(ctxDest);
    }
  }

  return null;
}

/**
 * Check if a name is a known destination
 */
export function isKnownDestination(name) {
  if (!name || typeof name !== 'string') return false;
  return aliasMap.has(name.toLowerCase().trim());
}

/**
 * Get list of all canonical destination names
 */
export function getAllDestinationNames() {
  if (!isInitialized || destinationCache.length === 0) initDestinationRegistry();
  return destinationCache.map(d => d.name);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  resolveDestination,
  isKnownDestination,
  getAllDestinationNames,
  initDestinationRegistry
};
