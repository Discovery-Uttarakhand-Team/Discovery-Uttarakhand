import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import Destination from '../models/Destination.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Activity from '../models/Activity.js';
import Stay from '../models/Stay.js';
import Rental from '../models/Rental.js';
import Guide from '../models/Guide.js';
import User from '../models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_COUNTS = {
  destinations: 105,
  spiritual: 56,
  culture: 30,
  activities: 28,
  stays: 51,
  rentals: 9,
  guides: 190
};

const collections = [
  { name: 'destinations', model: Destination, expectedCount: EXPECTED_COUNTS.destinations },
  { name: 'spiritual', model: Spiritual, expectedCount: EXPECTED_COUNTS.spiritual },
  { name: 'culture', model: Culture, expectedCount: EXPECTED_COUNTS.culture },
  { name: 'activities', model: Activity, expectedCount: EXPECTED_COUNTS.activities },
  { name: 'stays', model: Stay, expectedCount: EXPECTED_COUNTS.stays },
  { name: 'rentals', model: Rental, expectedCount: EXPECTED_COUNTS.rentals },
  { name: 'guides', model: Guide, expectedCount: EXPECTED_COUNTS.guides }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discovery_uttarakhand');
    console.log('MongoDB connected for seeding.');

    const isFresh = process.argv.includes('--fresh');

    if (isFresh) {
      console.log('Running with --fresh flag. Dropping 7 content collections ONLY...');
      for (const col of collections) {
        try {
          await col.model.collection.drop();
          console.log(`Dropped ${col.name} collection.`);
        } catch (error) {
          if (error.code === 26) {
            console.log(`Collection ${col.name} does not exist. Skipping drop.`);
          } else {
            console.error(`Error dropping ${col.name}:`, error.message);
          }
        }
      }
    }

    // Process each collection
    for (const col of collections) {
      let seedPath = path.join(__dirname, '..', 'seed');
      try {
        await fs.access(seedPath);
      } catch {
        seedPath = path.join(__dirname, '..', '..', 'data-set', 'seed');
      }
      const filePath = path.join(seedPath, `${col.name}.json`);
      const fileData = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileData);

      if (data.length !== col.expectedCount) {
        throw new Error(`CRITICAL FAILURE: ${col.name} JSON has ${data.length} records, but expected exactly ${col.expectedCount}. Aborting.`);
      }

      console.log(`Seeding ${col.name}...`);
      
      const validSlugs = data.map(doc => doc.slug);
      await col.model.deleteMany({ slug: { $nin: validSlugs } });

      const bulkOps = data.map(doc => ({
        updateOne: {
          filter: { slug: doc.slug },
          update: { $set: doc },
          upsert: true
        }
      }));

      const result = await col.model.bulkWrite(bulkOps);
      console.log(`-> ${col.name}: Matched ${result.matchedCount}, Modified ${result.modifiedCount}, Upserted ${result.upsertedCount}`);
    }

    // Verify distinct counts
    console.log('\n--- VERIFYING COUNTS ---');
    for (const col of collections) {
      const count = await col.model.countDocuments();
      if (count !== col.expectedCount) {
         throw new Error(`CRITICAL FAILURE: ${col.name} database count is ${count}, but expected ${col.expectedCount}.`);
      }
      const distinctSlugs = await col.model.distinct('slug');
      if (distinctSlugs.length !== col.expectedCount) {
         throw new Error(`CRITICAL FAILURE: ${col.name} has ${distinctSlugs.length} distinct slugs but ${count} total documents. Duplicates found!`);
      }
      console.log(`[OK] ${col.name} count matches expected (${col.expectedCount}) and slugs are unique.`);
    }

    // Admin Bootstrap
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        // Model pre-save hook handles hashing
        const adminUser = new User({
          name: 'Admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin'
        });
        await adminUser.save();
        console.log(`Admin user created: ${adminEmail}`);
      } else {
        console.log(`Admin user ${adminEmail} already exists.`);
      }
    } else {
      console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not found in env. Admin bootstrap skipped.');
    }

    // Spot-check Log
    console.log('\n--- PROVENANCE SPOT-CHECK ---');
    const destCheck = await Destination.findOne();
    if (destCheck) {
      console.log(`Destination [${destCheck.slug}]:\n  Source: ${destCheck.sourceName} (${destCheck.sourceUrl})\n  Image: ${destCheck.coverImage?.url}\n  Attribution: ${destCheck.coverImage?.attribution}`);
    }

    const stayCheck = await Stay.findOne();
    if (stayCheck) {
      console.log(`Stay [${stayCheck.slug}]:\n  Source: ${stayCheck.sourceName} (${stayCheck.sourceUrl})\n  Image 0: ${stayCheck.images[0]?.url}\n  Attribution: ${stayCheck.images[0]?.attribution}`);
    }

    const guideCheck = await Guide.findOne();
    if (guideCheck) {
       console.log(`Guide [${guideCheck.slug}]:\n  Source: ${guideCheck.sourceName} (${guideCheck.sourceUrl})`);
    }

    console.log('\nSeed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\nSeed script failed!', error);
    process.exit(1);
  }
}

seedDatabase();
