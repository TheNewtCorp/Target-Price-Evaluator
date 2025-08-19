const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configure stealth plugin
puppeteer.use(StealthPlugin());

async function humanDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function humanMouseMovement(page) {
  const viewport = await page.viewport();
  const x = Math.floor(Math.random() * viewport.width);
  const y = Math.floor(Math.random() * viewport.height);
  await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
}

async function waitForChallengeTokenPopulation(page, timeout = 60000) {
  console.log('🔍 Monitoring challengeToken field...');

  const startTime = Date.now();
  let lastLength = 0;

  while (Date.now() - startTime < timeout) {
    try {
      const tokenLength = await page.evaluate(() => {
        const field = document.querySelector('input[name="challengeToken"]');
        return field ? field.value.length : -1;
      });

      if (tokenLength > lastLength) {
        console.log(`📈 challengeToken length: ${tokenLength} characters`);
        lastLength = tokenLength;
      }

      // Consider token populated if it has significant content
      if (tokenLength > 500) {
        console.log('✅ challengeToken populated successfully!');
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log('⚠️ Error checking token:', error.message);
    }
  }

  console.log(`❌ challengeToken not populated after ${timeout / 1000} seconds`);
  return false;
}

async function handlePopupsAndDialogs(page) {
  console.log('🔍 Looking for popups and dialogs...');

  // Wait a moment for any popups to appear
  await humanDelay(2000, 4000);

  // Look for various types of popup buttons
  const popupSelectors = [
    'button:has-text("OK")',
    'button:has-text("Accept")',
    'button:has-text("Continue")',
    'button:has-text("Agree")',
    'button[data-testid*="accept"]',
    'button[data-testid*="ok"]',
    'button[class*="accept"]',
    'button[class*="confirm"]',
    '.modal button',
    '.popup button',
    '.dialog button',
  ];

  for (const selector of popupSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.isIntersectingViewport();
        if (isVisible) {
          const text = await button.evaluate((el) => el.textContent?.trim() || '');
          console.log(`🎯 Found visible popup button: "${text}" with selector: ${selector}`);

          await humanMouseMovement(page);
          await humanDelay(500, 1500);
          await button.click();
          console.log('✅ Clicked popup button');

          // Wait for any effects of clicking the button
          await humanDelay(2000, 4000);
          return true;
        }
      }
    } catch (error) {
      // Continue checking other selectors
      continue;
    }
  }

  // Also check for any modal overlays that might need clicking
  try {
    const modals = await page.$$('.modal, .popup, .dialog, [role="dialog"]');
    for (const modal of modals) {
      const isVisible = await modal.isIntersectingViewport();
      if (isVisible) {
        console.log('🔍 Found modal/dialog, looking for buttons inside...');
        const buttons = await modal.$$('button');
        for (const button of buttons) {
          const text = await button.evaluate((el) => el.textContent?.trim() || '');
          if (text.match(/ok|accept|continue|agree/i)) {
            console.log(`🎯 Clicking modal button: "${text}"`);
            await humanMouseMovement(page);
            await button.click();
            await humanDelay(2000, 4000);
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Error checking modals:', error.message);
  }

  console.log('ℹ️ No popups found or already handled');
  return false;
}

async function analyzePageState(page) {
  const state = await page.evaluate(() => {
    const challengeToken = document.querySelector('input[name="challengeToken"]');
    const emailField = document.querySelector('input[name="email"]');
    const passwordField = document.querySelector('input[name="password"]');

    // Look for any visible popups or modals
    const modals = document.querySelectorAll('.modal, .popup, .dialog, [role="dialog"]');
    const visibleModals = Array.from(modals).filter((modal) => {
      const style = window.getComputedStyle(modal);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    // Look for buttons that might be popup controls
    const buttons = document.querySelectorAll('button');
    const buttonTexts = Array.from(buttons)
      .map((btn) => ({
        text: btn.textContent?.trim() || '',
        visible: btn.offsetParent !== null,
        classes: btn.className,
      }))
      .filter((b) => b.text);

    return {
      title: document.title,
      url: window.location.href,
      challengeTokenLength: challengeToken ? challengeToken.value.length : -1,
      hasEmailField: !!emailField,
      hasPasswordField: !!passwordField,
      visibleModals: visibleModals.length,
      buttons: buttonTexts.slice(0, 10), // Limit to first 10 buttons
      bodyText: document.body.textContent?.substring(0, 500) || '',
    };
  });

  console.log('📊 Page Analysis:');
  console.log(`   Title: ${state.title}`);
  console.log(`   URL: ${state.url}`);
  console.log(`   Challenge Token: ${state.challengeTokenLength} characters`);
  console.log(`   Has Email Field: ${state.hasEmailField}`);
  console.log(`   Has Password Field: ${state.hasPasswordField}`);
  console.log(`   Visible Modals: ${state.visibleModals}`);
  console.log(`   Buttons Found: ${state.buttons.length}`);

  if (state.buttons.length > 0) {
    console.log('   Button Texts:');
    state.buttons.forEach((btn, i) => {
      if (btn.visible) {
        console.log(`     ${i + 1}. "${btn.text}" (visible)`);
      }
    });
  }

  return state;
}

async function loginToChrono24() {
  console.log('🚀 Starting Chrono24 login with popup handling...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1366,768',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set user agent to match your successful session
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete navigator.__proto__.webdriver;
    });

    console.log('📍 Navigating to login page...');
    await page.goto('https://www.chrono24.com/login.htm', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Initial page analysis
    await analyzePageState(page);

    // Handle any popups that might appear
    console.log('🎯 Step 1: Handle popups and dialogs');
    await handlePopupsAndDialogs(page);

    // Check if challengeToken got populated after popup handling
    await humanDelay(1000, 2000);
    let state = await analyzePageState(page);

    if (state.challengeTokenLength > 500) {
      console.log('✅ Challenge token populated after popup handling!');
    } else {
      console.log('⏳ Challenge token not yet populated, continuing to monitor...');

      // Continue monitoring for token population
      const tokenPopulated = await waitForChallengeTokenPopulation(page, 45000);

      if (!tokenPopulated) {
        console.log('❌ Challenge token never populated, attempting login anyway...');
      }
    }

    // Final state check before login
    state = await analyzePageState(page);

    if (state.hasEmailField && state.hasPasswordField) {
      console.log('🎯 Step 2: Fill in credentials');

      const email = process.env.CHRONO24_EMAIL;
      const password = process.env.CHRONO24_PASSWORD;

      if (!email || !password) {
        throw new Error('Email or password not found in environment variables');
      }

      // Human-like typing
      await page.type('input[name="email"]', email, { delay: Math.random() * 100 + 50 });
      await humanDelay(500, 1500);
      await page.type('input[name="password"]', password, { delay: Math.random() * 100 + 50 });

      console.log('🎯 Step 3: Submit login form');
      await humanMouseMovement(page);
      await humanDelay(1000, 2000);

      // Find and click login button
      const loginButton = await page.$(
        'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      );
      if (loginButton) {
        await loginButton.click();
        console.log('✅ Login form submitted');
      } else {
        // Try form submission
        await page.keyboard.press('Enter');
        console.log('✅ Login submitted via Enter key');
      }

      // Wait for navigation or response
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        console.log('✅ Navigation completed');
      } catch (error) {
        console.log('⚠️ No navigation detected, checking current state...');
      }

      // Final analysis
      const finalState = await analyzePageState(page);

      if (finalState.url.includes('collection') || finalState.title.toLowerCase().includes('collection')) {
        console.log('🎉 LOGIN SUCCESSFUL! Redirected to collection page');
      } else if (finalState.url === 'https://www.chrono24.com/login.htm') {
        console.log('❌ Still on login page - login likely failed');
      } else {
        console.log('🤔 Unexpected page state after login');
      }
    } else {
      console.log('❌ Login form fields not found');
    }

    // Keep browser open for inspection
    console.log('🔍 Keeping browser open for 30 seconds for inspection...');
    await new Promise((resolve) => setTimeout(resolve, 30000));
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.log('🔍 Taking screenshot for debugging...');

    try {
      const page = browser.pages().then((pages) => pages[0]);
      if (page) {
        await page.screenshot({
          path: 'login-error.png',
          fullPage: true,
        });
        console.log('📸 Screenshot saved as login-error.png');
      }
    } catch (screenshotError) {
      console.log('Failed to take screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the login process
loginToChrono24().catch(console.error);
