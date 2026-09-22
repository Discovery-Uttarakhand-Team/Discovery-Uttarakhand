/* eslint-disable no-eval, no-unassigned-vars */
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_USER_AGENT = 'Antigravity/1.0 (test-script)';
const DELAY_MS = 200; // Small delay between requests to avoid rate limits

// Read data
const readData = (filename) => {
  const filePath = path.join(process.cwd(), 'src', 'data', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple regex to extract the array
  const match = content.match(/export const \w+\s*=\s*(\[[\s\S]*\]);/);
  if (match) {
    // using eval to parse the array structure (safe here since we just generated it)
    let data;
    eval(`data = ${match[1]}`);
    return data;
  }
  return [];
};

const rentals = readData('rentals.js');
const stays = readData('stays.js');
const spirituals = readData('spiritual.js');
const cultures = readData('culture.js');

const allItems = [
  ...rentals.map(i => ({ ...i, folderCategory: 'rentals' })),
  ...stays.map(i => ({ ...i, folderCategory: 'stays' })),
  ...spirituals.map(i => ({ ...i, folderCategory: 'spiritual' })),
  ...cultures.map(i => ({ ...i, folderCategory: 'cultural' }))
];

let stats = { total: allItems.length, found: 0, failed: 0, fallbacks: 0, skipped: 0, folders: 0 };

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWikimediaImage = async (query) => {
  return new Promise((resolve) => {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
    https.get(searchUrl, { headers: { 'User-Agent': API_USER_AGENT } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const pages = parsed.query?.pages;
          if (pages) {
            const firstPageId = Object.keys(pages)[0];
            const imageUrl = pages[firstPageId]?.imageinfo?.[0]?.url;
            resolve(imageUrl);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': API_USER_AGENT } }, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        response.resume();
        reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const fallbackPath = path.join(process.cwd(), 'public', 'assets', 'fallback.svg');

const processItem = async (item, index) => {
  const dirPath = path.join(process.cwd(), 'public', 'assets', item.folderCategory, item.slug);
  const destPath = path.join(dirPath, 'cover.jpg');

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    stats.folders++;
  }

  if (fs.existsSync(destPath)) {
    console.log(`[${index + 1}/${allItems.length}] Skipped ${item.name} - Image already exists.`);
    stats.skipped++;
    return;
  }

  // Construct search query
  let searchQuery = `${item.name} Uttarakhand India`;
  if (item.folderCategory === 'rentals' || item.folderCategory === 'stays') {
    searchQuery = `${item.location} Uttarakhand`; // Generic location image for cars/hotels
  }

  const imageUrl = await fetchWikimediaImage(searchQuery);

  if (imageUrl) {
    try {
      await downloadImage(imageUrl, destPath);
      console.log(`[${index + 1}/${allItems.length}] Downloaded image for ${item.name}`);
      stats.found++;
    } catch (err) {
      console.log(`[${index + 1}/${allItems.length}] Failed downloading ${item.name}: ${err.message}`);
      if (fs.existsSync(fallbackPath)) {
        fs.copyFileSync(fallbackPath, destPath);
        stats.fallbacks++;
      } else {
        stats.failed++;
      }
    }
  } else {
    console.log(`[${index + 1}/${allItems.length}] No image found for ${item.name}, using fallback.`);
    if (fs.existsSync(fallbackPath)) {
      fs.copyFileSync(fallbackPath, destPath);
      stats.fallbacks++;
    } else {
      stats.failed++;
    }
  }
};

const run = async () => {
  console.log('Starting image download script...');
  for (let i = 0; i < allItems.length; i++) {
    await processItem(allItems[i], i);
    await sleep(DELAY_MS);
  }

  console.log('\n================================');
  console.log('TOTAL CARDS:', stats.total);
  console.log('IMAGES FOUND:', stats.found);
  console.log('IMAGES SKIPPED:', stats.skipped);
  console.log('IMAGES FAILED:', stats.failed);
  console.log('FALLBACKS USED:', stats.fallbacks);
  console.log('FOLDERS CREATED:', stats.folders);
  console.log('================================\n');
};

run();
