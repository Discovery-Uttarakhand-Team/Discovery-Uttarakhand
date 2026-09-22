import destinationsData from '../data/destinations.json';

export const PRESET_ITINERARIES = [
  {
    id: 'char-dham-10d',
    title: 'Sacred Char Dham Yatra (10 Days)',
    duration: '10 Days',
    idealFor: 'Pilgrimage & Spiritual Seekers',
    destinations: ['haridwar', 'yamunotri', 'gangotri', 'kedarnath', 'badrinath', 'rishikesh'],
    days: [
      { day: 1, title: 'Arrival in Haridwar', desc: 'Evening Ganga Aarti at Har Ki Pauri and temple visits.', stay: 'Haridwar' },
      { day: 2, title: 'Drive to Barkot', desc: 'Scenic journey through Yamuna valley.', stay: 'Barkot' },
      { day: 3, title: 'Yamunotri Dham Darshan', desc: 'Trek to temple and holy bath in Surya Kund hot springs.', stay: 'Barkot' },
      { day: 4, title: 'Drive to Uttarkashi', desc: 'Visit Kashi Vishwanath Temple and Bhagirathi riverside.', stay: 'Uttarkashi' },
      { day: 5, title: 'Gangotri Dham Darshan', desc: 'Drive through Harsil Valley to holy Gangotri shrine.', stay: 'Uttarkashi' },
      { day: 6, title: 'Uttarkashi to Guptkashi', desc: 'Traverse Garhwal hills overlooking Mandakini river.', stay: 'Guptkashi' },
      { day: 7, title: 'Kedarnath Dham Trek & Darshan', desc: 'Ascend to the ancient Shiva Jyotirlinga peak.', stay: 'Kedarnath' },
      { day: 8, title: 'Kedarnath to Chopta / Pipalkoti', desc: 'Morning darshan, descent and transfer through alpine bugyals.', stay: 'Chopta' },
      { day: 9, title: 'Badrinath Dham Darshan & Mana', desc: 'Darshan at Badrinath and explore Mana (First Village of India).', stay: 'Badrinath' },
      { day: 10, title: 'Return via Panch Prayag to Rishikesh', desc: 'Witness holy river confluences along NH-7.', stay: 'Rishikesh' }
    ]
  },
  {
    id: 'weekend-rishikesh-adventure',
    title: 'Rishikesh Thrill & Peace (3 Days)',
    duration: '3 Days',
    idealFor: 'Adventure & Wellness Lovers',
    destinations: ['rishikesh', 'tehri'],
    days: [
      { day: 1, title: 'River Rafting & Riverside Camps', desc: '16km rafting down Shivpuri rapids, cliff jumping, evening bonfire.', stay: 'Shivpuri' },
      { day: 2, title: 'Bungee Jump & Beatles Ashram', desc: 'India’s highest 83m bungee jump, explore ashram art, cafe hopping in Tapovan.', stay: 'Tapovan' },
      { day: 3, title: 'Tehri Lake Water Sports & Return', desc: 'Speed boating and jet skiing at Tehri lake with evening Ganga Aarti.', stay: 'Dehradun' }
    ]
  },
  {
    id: 'kumaon-lakes-peaks',
    title: 'Kumaon Lakes & Nanda Devi Panoramas (5 Days)',
    duration: '5 Days',
    idealFor: 'Families & Nature Photographers',
    destinations: ['nainital', 'kausani', 'munsiyari'],
    days: [
      { day: 1, title: 'Nainital Lake Tour', desc: 'Boating on Naini Lake, Naina Devi darshan, Mall road walk.', stay: 'Nainital' },
      { day: 2, title: 'Nainital to Kausani via Almora', desc: 'Scenic mountain drive, Almora heritage and Bal Mithai tasting.', stay: 'Kausani' },
      { day: 3, title: 'Sunrise over Trishul & Tea Gardens', desc: 'Witness golden dawn on 300km Himalayan crest, visit Gandhi Ashram.', stay: 'Kausani' },
      { day: 4, title: 'Drive to Munsiyari (Panchachuli)', desc: 'Cross Birthi Falls and reach base of majestic Panchachuli peaks.', stay: 'Munsiyari' },
      { day: 5, title: 'Khaliya Top Trek & Farewell', desc: 'Alpine meadow hike with breathtaking close-up snow peak views.', stay: 'Kathgodam' }
    ]
  }
];

export const getPresetItineraries = () => PRESET_ITINERARIES;

export const buildTripFromIds = (destinationIds) => {
  return destinationIds
    .map((id) => destinationsData.find((d) => d.id === id))
    .filter(Boolean);
};
