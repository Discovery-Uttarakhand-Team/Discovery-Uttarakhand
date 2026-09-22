import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { destinations } from '../src/data/destinations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getWikiImages(query, count) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=800`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query?.pages;
        if (!pages) return [];
        const images = [];
        for (let id in pages) {
            if (pages[id].thumbnail?.source && !pages[id].thumbnail.source.endsWith('.svg') && !pages[id].thumbnail.source.endsWith('.png')) {
                images.push(pages[id].thumbnail.source);
            }
        }
        return images.slice(0, count);
    } catch (e) {
        return [];
    }
}

async function downloadWikiImage(url, filepath) {
    if (fs.existsSync(filepath)) return true;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(filepath, Buffer.from(buffer));
        return true;
    } catch(e) {
        return false;
    }
}

async function downloadPollinationImage(prompt, filepath) {
    if (fs.existsSync(filepath)) return true;
    let retries = 3;
    while(retries > 0) {
        try {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));
            await delay(1000); // 1s delay
            return true;
        } catch (e) {
            retries--;
            await delay(2000);
        }
    }
    return false;
}

async function processImage(filepath, name, type, index, wikiImages, wikiIdxObj) {
    if (fs.existsSync(filepath)) {
        return { success: true, skipped: true };
    }
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Try Wiki first
    if (wikiIdxObj.idx < wikiImages.length) {
        const url = wikiImages[wikiIdxObj.idx++];
        const ok = await downloadWikiImage(url, filepath);
        if (ok) return { success: true, method: 'wiki' };
    }

    // Fallback to Pollination
    const prompt = type === 'cover' 
        ? `Photorealistic landscape view of ${name}, Uttarakhand, India, tourism photography`
        : `Photorealistic scenery of ${name} Uttarakhand India, beautiful destination ${index}, travel photography`;
        
    const ok = await downloadPollinationImage(prompt, filepath);
    return { success: ok, method: ok ? 'pollination' : 'failed' };
}

async function run() {
    console.log(`Starting bulk download for ${destinations.length} destinations...`);
    
    let totalCovers = 0;
    let totalGalleries = 0;
    let failed = 0;

    // We will process destinations sequentially to respect rate limits,
    // but within each destination we can process images in parallel (up to 5).
    // Or we process destinations in batches of 1 (since 1 dest = 5 images) which is max 5 concurrent requests!
    
    for (const d of destinations) {
        console.log(`Processing: ${d.name} (${d.slug})`);
        
        let wikiImages = await getWikiImages(`${d.name} Uttarakhand`, 10);
        if (wikiImages.length < 5) {
            const more = await getWikiImages(`${d.name} India`, 10);
            wikiImages = [...new Set([...wikiImages, ...more])];
        }
        
        const wikiIdxObj = { idx: 0 };
        const tasks = [];
        
        // 1 Cover
        const coverPath = path.join(__dirname, '..', 'public', d.coverImage);
        tasks.push(processImage(coverPath, d.name, 'cover', 0, wikiImages, wikiIdxObj));
        
        // 4 Galleries
        for (let i = 0; i < 4; i++) {
            const gPath = path.join(__dirname, '..', 'public', d.gallery[i]);
            tasks.push(processImage(gPath, d.name, 'gallery', i+1, wikiImages, wikiIdxObj));
        }
        
        // Execute up to 5 concurrently
        const results = await Promise.all(tasks);
        
        if (results[0].success) totalCovers++;
        else failed++;
        
        for (let i = 1; i <= 4; i++) {
            if (results[i].success) totalGalleries++;
            else failed++;
        }
    }
    
    console.log(`\n--- FINAL REPORT ---`);
    console.log(`Total destinations: ${destinations.length}`);
    const dirs = new Set(destinations.map(d => path.join(__dirname, '..', 'public', 'assets', 'destinations', d.slug)));
    let existingDirs = 0;
    for (const dir of dirs) {
        if (fs.existsSync(dir)) existingDirs++;
    }
    console.log(`Destination folders: ${existingDirs}/${destinations.length}`);
    console.log(`Cover images: ${totalCovers}/${destinations.length}`);
    console.log(`Gallery images: ${totalGalleries}/${destinations.length * 4}`);
    console.log(`Total images: ${totalCovers + totalGalleries}/${destinations.length * 5}`);
    console.log(`Failed images: ${failed}`);
    console.log(`Missing images: ${failed}`);
}

run();
