import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const dataFiles = [
        { file: 'destinations' },
        { file: 'rentals' },
        { file: 'stays' },
        { file: 'guides' },
        { file: 'culture' },
        { file: 'spiritual' }
    ];

    let missingFiles = [];
    let totalCards = 0;
    let totalImages = 0;
    
    for (const { file } of dataFiles) {
        const modulePath = path.join(__dirname, '..', 'src', 'data', `${file}.js`);
        const moduleData = await import(`file://${modulePath}`);
        const dataArray = Object.values(moduleData)[0];
        totalCards += dataArray.length;
        
        for (const item of dataArray) {
            const check = (imagePath) => {
                if (!imagePath) return;
                totalImages++;
                const fullPath = path.join(__dirname, '..', 'public', imagePath);
                if (!fs.existsSync(fullPath)) {
                    missingFiles.push(imagePath);
                }
            };
            
            if (item.coverImage) check(item.coverImage);
            if (item.image) check(item.image);
            if (item.gallery && Array.isArray(item.gallery)) {
                for (let img of item.gallery) check(img);
            }
        }
    }
    
    console.log(`TOTAL UNIQUE CARDS/DATA RECORDS: ${totalCards}`);
    console.log(`TOTAL IMAGES REQUIRED: ${totalImages}`);
    console.log(`MISSING IMAGES FOUND: ${missingFiles.length}`);
    if (missingFiles.length > 0) {
        console.log("Missing files list:");
        console.log(missingFiles.join('\n'));
    }
}

run();
