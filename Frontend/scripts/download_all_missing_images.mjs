import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = ms => new Promise(res => setTimeout(res, ms));

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

async function processImage(filepath, prompt, wikiImages, wikiIdxObj) {
    if (fs.existsSync(filepath)) return { success: true, method: 'existing' };
    
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Try Wiki first
    if (wikiImages && wikiIdxObj && wikiIdxObj.idx < wikiImages.length) {
        const url = wikiImages[wikiIdxObj.idx++];
        const ok = await downloadWikiImage(url, filepath);
        if (ok) return { success: true, method: 'wiki' };
    }

    // Fallback to Pollination
    const ok = await downloadPollinationImage(prompt, filepath);
    return { success: ok, method: ok ? 'pollination' : 'failed' };
}

async function run() {
    console.log('Starting missing image download process robustly...');
    
    const dataFiles = [
        { file: 'destinations', type: 'destination' },
        { file: 'rentals', type: 'rental' },
        { file: 'stays', type: 'stay' },
        { file: 'guides', type: 'guide' },
        { file: 'culture', type: 'culture' },
        { file: 'spiritual', type: 'spiritual' }
    ];

    let missingCount = 0;
    let downloadedCount = 0;
    let failedCount = 0;

    for (const { file, type } of dataFiles) {
        console.log(`Checking ${file}...`);
        const modulePath = path.join(__dirname, '..', 'src', 'data', `${file}.js`);
        const moduleData = await import(`file://${modulePath}`);
        const dataArray = Object.values(moduleData)[0];
        
        for (const item of dataArray) {
            const itemName = item.name || item.slug || 'Uttarakhand';
            
            // Only try wiki for destinations and culture to be safe
            let wikiImages = [];
            if (type === 'destination' || type === 'culture') {
                wikiImages = await getWikiImages(`${itemName} Uttarakhand`, 10);
                if (wikiImages.length < 5) {
                    const more = await getWikiImages(`${itemName} India`, 10);
                    wikiImages = [...new Set([...wikiImages, ...more])];
                }
            }
            const wikiIdxObj = { idx: 0 };
            
            const processAndTrack = async (imagePath, prompt) => {
                if (!imagePath) return;
                const fullPath = path.join(__dirname, '..', 'public', imagePath);
                if (!fs.existsSync(fullPath)) {
                    missingCount++;
                    console.log(`Downloading missing image: ${imagePath}`);
                    const result = await processImage(fullPath, prompt, wikiImages, wikiIdxObj);
                    if (result.success && result.method !== 'existing') {
                        downloadedCount++;
                    } else if (!result.success) {
                        failedCount++;
                        console.error(`Failed: ${imagePath}`);
                    }
                }
            };
            
            let coverPrompt = '';
            let galleryPromptBase = '';
            
            switch(type) {
                case 'destination':
                    coverPrompt = `Photorealistic beautiful landscape of ${itemName} Uttarakhand India`;
                    galleryPromptBase = `Beautiful scenic view of ${itemName} Uttarakhand India photography`;
                    break;
                case 'rental':
                    coverPrompt = `High quality photo of a ${itemName} vehicle rental in Uttarakhand`;
                    galleryPromptBase = coverPrompt;
                    break;
                case 'stay':
                    coverPrompt = `Beautiful high quality photo of ${itemName} hotel resort homestay in Uttarakhand India`;
                    galleryPromptBase = coverPrompt;
                    break;
                case 'guide':
                    coverPrompt = `Portrait photograph of a friendly Indian tour guide named ${itemName} from Uttarakhand outdoors`;
                    break;
                case 'culture':
                    coverPrompt = `Authentic cultural photography of ${itemName} tradition in Uttarakhand India`;
                    galleryPromptBase = coverPrompt;
                    break;
                case 'spiritual':
                    coverPrompt = `High quality photography of ${itemName} spiritual site temple in Uttarakhand India`;
                    galleryPromptBase = coverPrompt;
                    break;
            }

            const tasks = [];
            if (item.coverImage) tasks.push(processAndTrack(item.coverImage, coverPrompt));
            if (item.image) tasks.push(processAndTrack(item.image, coverPrompt));
            if (item.gallery && Array.isArray(item.gallery)) {
                for (let i = 0; i < item.gallery.length; i++) {
                    tasks.push(processAndTrack(item.gallery[i], `${galleryPromptBase} ${i + 1}`));
                }
            }
            
            if (tasks.length > 0) {
                await Promise.all(tasks);
            }
        }
    }

    console.log(`\n--- DOWNLOAD REPORT ---`);
    console.log(`Total missing initially: ${missingCount}`);
    console.log(`Successfully downloaded: ${downloadedCount}`);
    console.log(`Failed to download: ${failedCount}`);
}

run();
