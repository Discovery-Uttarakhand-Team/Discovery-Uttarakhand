import https from 'https';
import mongoose from 'mongoose';

async function testUploadWikimediaUrls() {
  await mongoose.connect('mongodb://localhost:27017/discovery_uttarakhand');

  const dests = await mongoose.connection.db.collection('destinations').find({}).toArray();

  let ok = 0;
  let broken = 0;
  const brokenList = [];

  console.log('Testing destinations cover images...');
  for (const d of dests) {
    const url = d.coverImage?.url;
    if (!url) continue;

    await new Promise(resolve => {
      try {
        const parsed = new URL(url);
        const req = https.get({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://en.wikipedia.org/'
          }
        }, res => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            ok++;
          } else {
            broken++;
            brokenList.push({ name: d.name, slug: d.slug, status: res.statusCode, url });
            console.log(`BROKEN [${res.statusCode}]: ${d.name} -> ${url}`);
          }
          resolve();
        });
        req.on('error', err => {
          broken++;
          brokenList.push({ name: d.name, slug: d.slug, err: err.message, url });
          console.log(`ERROR: ${d.name} -> ${err.message}`);
          resolve();
        });
      } catch (e) {
        broken++;
        resolve();
      }
    });
  }

  console.log(`\nResults: ${ok} OK, ${broken} BROKEN out of ${dests.length}`);
  await mongoose.disconnect();
}

testUploadWikimediaUrls().catch(console.error);
