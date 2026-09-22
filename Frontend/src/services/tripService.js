export const PRESET_ITINERARIES = [
  {
    id: 'char-dham-circuit',
    title: 'Sacred Char Dham Yatra',
    idealFor: 'Pilgrims & Spiritual Explorers',
    duration: '10-12 Days',
    destinations: ['haridwar', 'rishikesh', 'yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    days: [
      { day: 1, title: 'Arrival in Haridwar / Rishikesh', desc: 'Evening Ganga Aarti at Har Ki Pauri or Triveni Ghat.', stay: 'Rishikesh' },
      { day: 2, title: 'Rishikesh to Barkot', desc: 'Scenic Himalayan drive along the Yamuna valley.', stay: 'Barkot' },
      { day: 3, title: 'Barkot to Yamunotri Dham', desc: 'Holy trek to Yamunotri temple, darshan and holy dip in Surya Kund.', stay: 'Barkot' },
      { day: 4, title: 'Barkot to Uttarkashi', desc: 'Visit Kashi Vishwanath temple on the banks of Bhagirathi.', stay: 'Uttarkashi' },
      { day: 5, title: 'Uttarkashi to Gangotri Dham', desc: 'Drive through Harshil valley and offer prayers at Gangotri shrine.', stay: 'Uttarkashi' },
      { day: 6, title: 'Uttarkashi to Guptkashi', desc: 'Traverse Garhwal mountain routes with vistas of Mandakini river.', stay: 'Guptkashi' },
      { day: 7, title: 'Guptkashi to Kedarnath Dham', desc: 'Ascend to the revered Kedarnath Jyotirlinga peak.', stay: 'Kedarnath' },
      { day: 8, title: 'Kedarnath to Chopta / Pipalkoti', desc: 'Trek down and journey towards Chopta meadows.', stay: 'Chopta' },
      { day: 9, title: 'Chopta to Badrinath Dham', desc: 'Travel to Badrinath via Joshimath; evening temple darshan.', stay: 'Badrinath' },
      { day: 10, title: 'Badrinath to Mana & Return', desc: 'Visit India’s first village Mana, then drive back via Devprayag.', stay: 'Rishikesh' }
    ]
  },
  {
    id: 'kumaon-lakes-loop',
    title: 'Kumaon Lakes & Hill Panorama',
    idealFor: 'Families & Nature Lovers',
    duration: '5-6 Days',
    destinations: ['nainital', 'bhimtal', 'mukteshwar', 'almora', 'kausani'],
    days: [
      { day: 1, title: 'Arrival in Nainital', desc: 'Boating on Naini Lake and visit Naina Devi Temple.', stay: 'Nainital' },
      { day: 2, title: 'Lake Tour (Bhimtal & Naukuchiatal)', desc: 'Explore the 9-cornered lake and island aquarium.', stay: 'Bhimtal' },
      { day: 3, title: 'Bhimtal to Mukteshwar', desc: 'Orchard walks and sunset view of Trishul & Nanda Devi peaks.', stay: 'Mukteshwar' },
      { day: 4, title: 'Mukteshwar to Almora & Kasar Devi', desc: 'Experience the Van Allen cosmic belt and Kumaoni heritage.', stay: 'Almora' },
      { day: 5, title: 'Almora to Kausani', desc: '300 km panoramic Himalayan views of snow-capped peaks.', stay: 'Kausani' }
    ]
  },
  {
    id: 'rishikesh-adventure-gateway',
    title: 'Rishikesh & Garhwal Adventure',
    idealFor: 'Adrenaline & Yoga Seekers',
    duration: '3-4 Days',
    destinations: ['rishikesh', 'dehradun', 'mussoorie'],
    days: [
      { day: 1, title: 'Yoga & River Rafting in Rishikesh', desc: 'Grade III/IV rapids on the Ganges and Beatles Ashram visit.', stay: 'Rishikesh' },
      { day: 2, title: 'Bungee Jumping & Camping', desc: 'India’s highest jump at Mohan Chatti followed by riverside camping.', stay: 'Rishikesh' },
      { day: 3, title: 'Dehradun & Mussoorie Queen of Hills', desc: 'Kempty Falls and scenic stroll along the Mall Road.', stay: 'Mussoorie' }
    ]
  }
];

export const buildTripFromIds = (ids = [], allDestinations = []) => {
  const destMap = new Map();
  allDestinations.forEach((d) => {
    destMap.set(d._id?.toLowerCase(), d);
    if (d.id) destMap.set(String(d.id).toLowerCase(), d);
    if (d.slug) destMap.set(d.slug?.toLowerCase(), d);
    if (d.name) destMap.set(d.name?.toLowerCase().trim(), d);
  });

  return ids.map((id) => {
    const key = String(id).toLowerCase().trim();
    if (destMap.has(key)) {
      return destMap.get(key);
    }
    // Fallback object if not in dataset
    return {
      id,
      _id: id,
      name: String(id).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      district: 'Uttarakhand',
      category: 'destination',
      shortDesc: 'A scenic destination in Uttarakhand.'
    };
  });
};
