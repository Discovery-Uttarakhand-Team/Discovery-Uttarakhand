import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // 1. Screenshot Trip Planner
    console.log('Navigating to Trip Planner (/trip-planner)...');
    await page.goto('http://localhost:5173/trip-planner', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const plannerPath = path.resolve(
      'C:/Users/ak/.gemini/antigravity-ide/brain/8f58bd9b-b21c-41fb-8700-be50e824853f/trip_planner_rendered.png'
    );
    await page.screenshot({ path: plannerPath, fullPage: false });
    console.log('Saved verified Trip Planner screenshot to:', plannerPath);

    // 2. Screenshot Copilot with Budget Conflict
    console.log('Navigating to Copilot UI (/copilot)...');
    await page.goto('http://localhost:5173/copilot', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('textarea', { timeout: 10000 });
    console.log('Input found. Typing budget conflict message...');

    const promptText = 'Mujhe Nainital jana hai Haldwani se 2 log 2 din 2000 budget mein';
    await page.type('textarea', promptText);
    await new Promise(r => setTimeout(r, 400));

    // Submit message via send button or Enter
    const sendBtn = await page.$('.send-btn');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    console.log('Submitted. Waiting for AI response and structured cards...');

    await page.waitForSelector('.chat-bubble.assistant', { timeout: 25000 });
    await new Promise(r => setTimeout(r, 6000));

    const copilotPath = path.resolve(
      'C:/Users/ak/.gemini/antigravity-ide/brain/8f58bd9b-b21c-41fb-8700-be50e824853f/copilot_budget_conflict_verified.png'
    );
    await page.screenshot({ path: copilotPath, fullPage: false });
    console.log('Saved verified Copilot screenshot to:', copilotPath);

  } catch (err) {
    console.error('Puppeteer error:', err.message);
  } finally {
    await browser.close();
  }
})();
