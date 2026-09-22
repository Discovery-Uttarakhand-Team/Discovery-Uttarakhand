import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import puppeteer from 'puppeteer';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/discovery_uttarakhand');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const deepanshu = await User.findOne({ name: { $regex: 'deepanshu', $options: 'i' } }).lean();
  console.log('Deepanshu user:', deepanshu?._id, deepanshu?.name);

  const Destination = mongoose.model('Destination', new mongoose.Schema({}, { strict: false }));
  const Favorite = mongoose.model('Favorite', new mongoose.Schema({}, { strict: false }));
  const favs = await Favorite.find({ user: deepanshu._id }).lean();
  
  for (const f of favs) {
    const dest = await Destination.findById(f.item).lean();
    console.log(`Fav ${f._id} -> Dest: ${dest?.name}, district: ${dest?.district}, location:`, dest?.location);
  }

  // Generate JWT token for Deepanshu
  const token = jwt.sign(
    { id: deepanshu._id, role: deepanshu.role },
    process.env.JWT_SECRET || 'your_generated_secret',
    { expiresIn: '30d' }
  );
  console.log('Generated token for Deepanshu');

  await mongoose.disconnect();

  // Launch Puppeteer and test /profile and /trip-planner as Deepanshu
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[BROWSER CONSOLE ERROR]:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('[BROWSER PAGE ERROR]:', err.message);
    errors.push(err.message);
  });

  // Set token in localStorage before navigation
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate((tok) => {
    localStorage.setItem('token', tok);
  }, token);

  console.log('\n--- 1. Testing /profile as Deepanshu ---');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const profileHasError = await page.evaluate(() => {
    return document.body.innerText.includes('Something went wrong');
  });
  console.log('Profile page "Something went wrong" detected:', profileHasError);
  if (profileHasError) {
    console.log('PAGE TEXT SAMPLE:\n', (await page.evaluate(() => document.body.innerText)).slice(0, 500));
  }

  console.log('\n--- 2. Testing /trip-planner as Deepanshu ---');
  await page.goto('http://localhost:5173/trip-planner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const tripPlannerHasError = await page.evaluate(() => {
    return document.body.innerText.includes('Something went wrong');
  });
  console.log('TripPlanner page "Something went wrong" detected:', tripPlannerHasError);
  if (tripPlannerHasError) {
    console.log('PAGE TEXT SAMPLE:\n', (await page.evaluate(() => document.body.innerText)).slice(0, 500));
  }

  console.log('\nTotal errors collected:', errors.length);
  await browser.close();
}

run().catch(console.error);

