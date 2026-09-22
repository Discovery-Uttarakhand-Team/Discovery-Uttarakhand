import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discovery_uttarakhand';

const patches = [
  { slug: 'bedni-bugyal',            coords: [79.5889, 30.1897] },
  { slug: 'darma-valley',            coords: [80.3667, 30.1333] },
  { slug: 'govind-pashu-vihar-national-park', coords: [78.3500, 31.0833] },
  { slug: 'johar-valley',            coords: [80.2500, 30.2167] },
  { slug: 'panwali-kantha-bugyal',   coords: [78.8200, 30.5200] },
  { slug: 'vasudhara-falls',         coords: [79.6417, 30.7833] },
];

async function patchCoords() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const col = db.collection('destinations');

  for (const p of patches) {
    // Use $set on the entire location object (not a nested null field)
    const result = await col.updateOne(
      { slug: p.slug },
      { $set: { location: { type: 'Point', coordinates: p.coords } } }
    );
    console.log(`${p.slug}: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log('All patches applied.');
}

patchCoords().catch(e => { console.error(e); process.exit(1); });
