import fs from 'fs';
import path from 'path';
import https from 'https';

const destinations = [
  "Nainital", "Bhimtal", "Sattal", "Naukuchiatal", "Mukteshwar",
  "Almora", "Ranikhet", "Kausani", "Binsar", "Jageshwar",
  "Munsiyari", "Pithoragarh", "Champawat", "Lohaghat", "Mussoorie",
  "Dhanaulti", "Kanatal", "Chakrata", "Lansdowne", "Rishikesh",
  "Haridwar", "Devprayag", "Tehri", "New Tehri", "Pauri",
  "Rudraprayag", "Chopta", "Tungnath", "Ukhimath", "Kedarnath",
  "Badrinath", "Joshimath", "Auli", "Mana Village", "Valley of Flowers",
  "Hemkund Sahib", "Gopeshwar", "Chamoli", "Nanda Devi", "Jim Corbett National Park",
  "Ramnagar", "Kempty Falls", "Landour", "Kirtinagar", "Karnaprayag",
  "Guptkashi", "Triyuginarayan Temple", "Dharchula", "Dayara Bugyal"
];

const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#F5F3EC"/>
  <path d="M0 600 L250 250 L400 450 L600 150 L800 500 L800 600 Z" fill="#14452F" opacity="0.1"/>
  <path d="M100 600 L300 350 L450 550 L650 300 L800 550 L800 600 Z" fill="#14452F" opacity="0.15"/>
  <path d="M200 600 L400 400 L550 550 L700 400 L800 600 Z" fill="#14452F" opacity="0.2"/>
  <g text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <text x="400" y="350" font-size="28" font-weight="bold" fill="#2C3E35" letter-spacing="2">PLACEHOLDER</text>
  </g>
</svg>`;

const toSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DiscoveryUttarakhand/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
      });
    }).on('error', reject);
  });
};

const downloadImage = (url, dest) => {
  return new Promise((resolve) => {
    if (!url) {
      fs.writeFileSync(dest, fallbackSvg);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        file.close();
        fs.unlink(dest, () => {});
        fs.writeFileSync(dest, fallbackSvg);
        resolve();
      }
    }).on('error', () => {
      fs.unlink(dest, () => {});
      fs.writeFileSync(dest, fallbackSvg);
      resolve();
    });
  });
};

const imageTypes = ['cover.jpg', 'lake.jpg', 'temple.jpg', 'culture.jpg', 'place-1.jpg', 'place-2.jpg'];

async function run() {
  const baseDir = path.join(process.cwd(), 'public', 'assets', 'destinations');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  for (const dest of destinations) {
    const slug = toSlug(dest);
    const destDir = path.join(baseDir, slug);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    console.log(`Fetching ${dest}...`);
    
    // Fetch Wikipedia page image
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(dest)}`;
    const data = await fetchJson(apiUrl);
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId]?.original?.source;

    // We'll use the main image for 'cover.jpg' and fallback SVGs for the rest to save time and API calls,
    // since Wikipedia rarely gives 5 clean landscape images easily without parsing HTML.
    for (const type of imageTypes) {
      const filePath = path.join(destDir, type);
      if (type === 'cover.jpg' && imageUrl) {
        await downloadImage(imageUrl, filePath);
      } else {
        // Just use fallback for others to guarantee files exist and don't break.
        fs.writeFileSync(filePath, fallbackSvg.replace('PLACEHOLDER', `${dest.toUpperCase()} ${type.split('.')[0].toUpperCase()}`));
      }
    }
  }
  console.log('Done fetching images!');
}

run();
