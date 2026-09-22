import fs from 'fs';
import path from 'path';

// --- HELPERS ---
const slugify = (text) => text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (array) => array.sort(() => Math.random() - 0.5);

const uttarakhandCities = ['Rishikesh', 'Haridwar', 'Dehradun', 'Mussoorie', 'Nainital', 'Haldwani', 'Almora', 'Ranikhet', 'Mukteshwar', 'Bhimtal', 'Ramnagar', 'Kotdwar', 'Pauri', 'Srinagar', 'Rudraprayag', 'Joshimath', 'Chamoli', 'Auli', 'Chopta', 'Munsiyari', 'Pithoragarh', 'Lansdowne', 'Kanatal', 'Dhanaulti', 'Tehri'];

// --- RENTALS (50 items) ---
const rentalNames = [
  'Honda Activa 6G', 'Royal Enfield Classic 350', 'Royal Enfield Himalayan', 'Mahindra Bolero Camper', 'TVS Jupiter',
  'Royal Enfield Meteor 350', 'Toyota Innova Crysta', 'Tata Yodha', 'Honda Activa 5G', 'Royal Enfield Bullet 350',
  'Hyundai i20', 'Tata Intra V10', 'Suzuki Access 125', 'Maruti Suzuki Ertiga', 'Maruti Suzuki Swift', 'Mahindra Scorpio',
  'TVS Ntorq 125', 'KTM Duke 200', 'Bajaj Pulsar 150', 'Mahindra Thar', 'Hero Splendor Plus', 'Hero HF Deluxe',
  'Honda Shine', 'TVS Apache RTR 160', 'Yamaha MT 15', 'Yamaha R15 V4', 'Hero Xpulse 200', 'Mahindra XUV700',
  'Tata Nexon', 'Hyundai Creta', 'Maruti Suzuki Dzire', 'Toyota Fortuner', 'Tempo Traveller 12 Seater', 'Maruti Alto 800',
  'Maruti WagonR', 'Mahindra Marazzo', 'Tata Harrier', 'Renault Duster', 'Honda City', 'Toyota Etios',
  'Royal Enfield Interceptor 650', 'Suzuki Burgman Street', 'Vespa ZX 125', 'Yamaha Fascino', 'Mahindra Xylo',
  'Tata Safari', 'Maruti Suzuki Celerio', 'Maruti Suzuki Baleno', 'Kia Seltos', 'MG Hector'
];

const getRentalType = (name) => {
  if (name.includes('Activa') || name.includes('Jupiter') || name.includes('Access') || name.includes('Ntorq') || name.includes('Burgman') || name.includes('Vespa') || name.includes('Fascino')) return 'Scooty';
  if (name.includes('Royal Enfield') || name.includes('KTM') || name.includes('Pulsar') || name.includes('Splendor') || name.includes('Deluxe') || name.includes('Shine') || name.includes('Apache') || name.includes('Yamaha') || name.includes('Xpulse')) return 'Bike';
  if (name.includes('Innova') || name.includes('Scorpio') || name.includes('Thar') || name.includes('XUV700') || name.includes('Nexon') || name.includes('Creta') || name.includes('Fortuner') || name.includes('Marazzo') || name.includes('Harrier') || name.includes('Duster') || name.includes('Safari') || name.includes('Seltos') || name.includes('Hector') || name.includes('Xylo')) return 'SUV';
  if (name.includes('Bolero') || name.includes('Yodha') || name.includes('Intra')) return 'Pickup';
  if (name.includes('Tempo')) return 'Tempo Traveller';
  return 'Car';
};

const getRentalPrice = (type) => {
  if (type === 'Scooty') return randomInt(400, 700);
  if (type === 'Bike') return randomInt(800, 1800);
  if (type === 'Car') return randomInt(1500, 2500);
  if (type === 'SUV') return randomInt(2500, 4500);
  if (type === 'Pickup') return randomInt(2000, 3000);
  if (type === 'Tempo Traveller') return randomInt(4000, 6000);
  return 1000;
};

const rentals = shuffle(rentalNames).map((name, i) => {
  const city = randomItem(uttarakhandCities);
  const type = getRentalType(name);
  const slug = slugify(`${city}-${name}`);
  return {
    id: i + 1,
    name: name,
    slug: slug,
    city: city,
    location: `${city} Main Market`,
    type: type,
    category: type,
    rating: parseFloat(randomFloat(4.0, 4.9)),
    pricePerDay: getRentalPrice(type),
    unit: '/day',
    description: `Rent a well-maintained ${name} in ${city}. Perfect for navigating the mountain roads and exploring local attractions.`,
    features: ['Fully Serviced', 'Roadside Assistance', 'Clean'],
    image: `/assets/rentals/${slug}/cover.jpg`,
    available: true
  };
});

// --- STAYS (50 items) ---
const stayAdjectives = ['Pine', 'Himalayan', 'Riverside', 'Mountain', 'Valley', 'Sunrise', 'Sunset', 'Forest', 'Eco', 'Heritage', 'Boutique', 'Cozy', 'Hidden', 'Tranquil', 'Serene', 'Royal', 'Grand', 'Cloud', 'Peak', 'Nature'];
const stayTypes = ['Retreat', 'Homestay', 'Resort', 'Cottages', 'Camp', 'Guest House', 'Lodge', 'Villas', 'Inn', 'Hotel'];

const getStayPrice = (type) => {
  if (type === 'Resort' || type === 'Villas' || type === 'Boutique' || type === 'Heritage') return randomInt(4000, 12000);
  if (type === 'Camp' || type === 'Homestay' || type === 'Guest House') return randomInt(1000, 3000);
  return randomInt(2000, 5000);
};

const stays = Array.from({ length: 50 }, (_, i) => {
  const city = randomItem(uttarakhandCities);
  const adj = randomItem(stayAdjectives);
  const type = randomItem(stayTypes);
  const name = `${adj} ${type} ${city}`;
  const slug = slugify(name);
  return {
    id: i + 1,
    name: `${adj} ${type}`,
    slug: slug,
    location: city,
    type: type,
    rating: parseFloat(randomFloat(4.1, 4.9)),
    pricePerNight: getStayPrice(type),
    unit: '/night',
    description: `Experience the beauty of ${city} with a stay at ${adj} ${type}. Enjoy breathtaking views and warm hospitality.`,
    amenities: shuffle(['wifi', 'parking', 'food', 'nature', 'lake-view', 'ac', 'pool', 'spa']).slice(0, randomInt(3, 6)),
    image: `/assets/stays/${slug}/cover.jpg`,
    available: true
  };
});

// --- SPIRITUAL (50 items) ---
const spiritualPlaces = [
  'Kedarnath Temple', 'Badrinath Temple', 'Gangotri Temple', 'Yamunotri Temple', 'Jageshwar Dham', 'Patal Bhuvaneshwar', 'Dhari Devi Temple', 'Neelkanth Mahadev', 'Hemkund Sahib', 'Tungnath Temple', 'Rudranath Temple', 'Madhyamaheshwar Temple', 'Kalpeshwar Temple', 'Baijnath Temple', 'Kainchi Dham', 'Mansa Devi Temple', 'Chandi Devi Temple', 'Surkanda Devi Temple', 'Kasar Devi Temple', 'Bagnath Temple', 'Gopinath Temple', 'Tapkeshwar Temple', 'Mahasu Devta Temple', 'Naina Devi Temple', 'Chitai Golu Devta Temple', 'Koteshwar Mahadev', 'Kamleshwar Mahadev', 'Kalimath Temple', 'Triyuginarayan Temple', 'Kunjapuri Devi Temple', 'Chandrabadni Temple', 'Jhula Devi Temple', 'Haat Kalika Temple', 'Dunagiri Temple', 'Bhavishya Badri', 'Vridha Badri', 'Yogadhyan Badri', 'Adhi Badri', 'Purnagiri Temple', 'Nanda Devi Temple', 'Maha Rudreshwar', 'Katarmal Sun Temple', 'Baleshwar Temple', 'Kranteshwar Mahadev', 'Bhadraj Temple', 'Bineshwar Mahadev', 'Golu Devta Ghorakhal', 'Brahma Kapal', 'Gaurikund', 'Devprayag Sangam'
];

const spirituals = spiritualPlaces.map((name, i) => {
  const slug = slugify(name);
  const city = randomItem(uttarakhandCities);
  return {
    id: i + 1,
    name: name,
    slug: slug,
    label: randomItem(['DHAM', 'TEMPLE', 'SACRED SITE', 'SHRINE']),
    location: `${city}, Uttarakhand`,
    rating: parseFloat(randomFloat(4.5, 5.0)),
    description: `A highly revered sacred site located in the serene environment of ${city}. It holds immense spiritual significance for pilgrims.`,
    categories: ['Temples', 'Pilgrimage', 'Spiritual', 'Sacred Sites'].sort(() => Math.random() - 0.5).slice(0, 2),
    tags: ['Pilgrimage', 'Sacred', 'Heritage', 'Himalayan'].sort(() => Math.random() - 0.5).slice(0, 3),
    bestTime: randomItem(['May - June', 'September - November', 'All Year', 'May - November']),
    significance: `Dedicated to the divine presence, drawing thousands of devotees annually.`,
    highlights: ['Ancient Architecture', 'Spiritual Aura', 'Scenic Beauty'],
    image: `/assets/spiritual/${slug}/cover.jpg`,
    hasSecondaryButton: randomItem([true, false])
  };
});

// --- CULTURAL (50 items) ---
const culturalExperiences = [
  'Munsiyari Heritage Walk', 'Kumaoni Village Tour', 'Garhwali Village Experience', 'Jageshwar Heritage', 'Almora Heritage', 'Ranikhet Heritage', 'Pithoragarh Culture', 'Bageshwar Culture', 'Chamoli Traditions', 'Tehri Heritage', 'Mana Village Tour', 'Kausani Tea Estate', 'Pangot Birding Village', 'Marchula Village Walk', 'Chakrata Jaunsari Culture', 'Khirsu Village Stay', 'Lansdowne Cantonment Tour', 'Landour Heritage Walk', 'Kalap Village Experience', 'Sarmoli Village Homestay', 'Niti Valley Exploration', 'Malari Village Tour', 'Harsil Apple Orchards', 'Mori Village Culture', 'Barkot Traditions', 'Chopta Valley Culture', 'Gwaldam Heritage', 'Binsar Wildlife Village', 'Chaukori Heritage', 'Lohaghat Cultural Tour', 'Abbott Mount Heritage', 'Champawat Traditions', 'Munsiyari Woolen Craft', 'Almora Copper Craft', 'Aipan Art Workshop', 'Kumaoni Cuisine Class', 'Garhwali Food Trail', 'Jagar Music Performance', 'Choliya Dance Show', 'Ramman Festival Experience', 'Nanda Devi Raj Jat Lore', 'Kumbh Mela Heritage', 'Uttarayani Fair Experience', 'Bikhauti Mela Culture', 'Gauchar Mela Visit', 'Bagwal Fair Experience', 'Phool Dei Festival', 'Harela Festival Celebration', 'Ghee Sankranti Culture', 'Khatarua Festival'
];

const cultures = culturalExperiences.map((name, i) => {
  const slug = slugify(name);
  const city = randomItem(uttarakhandCities);
  return {
    id: i + 1,
    name: name,
    slug: slug,
    location: city,
    category: randomItem(['Village Tour', 'Heritage', 'Festival', 'Crafts', 'Cuisine']),
    rating: parseFloat(randomFloat(4.2, 4.9)),
    description: `Immerse yourself in the authentic traditions and heritage of Uttarakhand with this unique cultural experience in ${city}.`,
    highlights: ['Local Interaction', 'Authentic Traditions', 'Cultural Immersion'],
    bestTime: randomItem(['March - June', 'September - December', 'All Year']),
    image: `/assets/cultural/${slug}/cover.jpg`
  };
});


// Write files
const dataDir = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const writeExport = (filename, varName, data) => {
  const content = `export const ${varName} = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(path.join(dataDir, filename), content);
  console.log(`Generated ${filename} with ${data.length} items`);
};

writeExport('rentals.js', 'rentals', rentals);
writeExport('stays.js', 'stays', stays);
writeExport('spiritual.js', 'spirituals', spirituals);
writeExport('culture.js', 'cultures', cultures);

console.log('Data generation complete!');
