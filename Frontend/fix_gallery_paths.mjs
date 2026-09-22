import fs from 'fs';
import path from 'path';

const destFile = './src/data/destinations.js';
let destContent = fs.readFileSync(destFile, 'utf-8');

// We can just regex replace the gallery array since the formatting is consistent, 
// or better, parse it if possible. Since it's a JS file, we'll use a regex that matches "gallery": [...]
// But wait, it's safer to just run an AST transform or simple regex if it's structured well.
// Let's use a regex that replaces the "gallery": [ ... ] block with the new structured paths.
const regex = /"gallery":\s*\[[\s\S]*?\],/g;
// Wait, we need the slug to generate the paths!
// Let's match the whole object block or just use a more careful approach.

// Let's rewrite destinations.js using a small script that `import`s it, modifies the array, and writes it back?
// No, writing it back as a string from JSON would lose functions/comments if there are any.
// Since we have a strict structure, let's just do a regex replace on each block.

const slugRegex = /"slug":\s*"([^"]+)"/;
let modified = destContent;

const blocks = modified.split(/(?=\s*{\s*"id":)/);
for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const slugMatch = block.match(slugRegex);
    if (slugMatch) {
        const slug = slugMatch[1];
        const newGallery = `"gallery": [
      "/assets/destinations/${slug}/gallery-1.jpg",
      "/assets/destinations/${slug}/gallery-2.jpg",
      "/assets/destinations/${slug}/gallery-3.jpg",
      "/assets/destinations/${slug}/gallery-4.jpg"
    ],`;
        blocks[i] = block.replace(/"gallery":\s*\[[\s\S]*?\],/, newGallery);
    }
}

fs.writeFileSync(destFile, blocks.join(''));
console.log('Fixed gallery paths in destinations.js');
