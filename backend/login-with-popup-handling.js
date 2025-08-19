const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function loginWithPopupHandling() {
  console.log('🔍 Starting login with popup handling...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    console.log('🔗 Navigating to collection page to trigger redirect...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('📍 Current URL:', page.url());

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Look for and handle any popups/overlays
    console.log('🔍 Looking for popups/overlays...');

    const popupSelectors = [
      // Cookie consent
      'button[data-testid="uc-accept-all-button"]',
      'button:contains("Accept all")',
      'button:contains("OK")',
      'button:contains("Accept")',
      'button:contains("Continue")',
      // Common popup button patterns
      '[data-cy="accept-button"]',
      '[data-cy="continue-button"]',
      '.cookie-consent button',
      '.modal button',
      '.overlay button',
      '.popup button',
      // Generic close/accept buttons
      'button[aria-label*="accept"]',
      'button[aria-label*="close"]',
      'button[class*="accept"]',
      'button[class*="continue"]',
      'button[class*="ok"]',
    ];

    for (const selector of popupSelectors) {
      try {
        console.log(`🔍 Checking for popup selector: ${selector}`);
        const button = await page.$(selector);
        if (button) {
          const isVisible = await button.isIntersectingViewport();
          if (isVisible) {
            console.log(`✅ Found visible popup button: ${selector}`);
            await button.click();
            console.log('🔘 Clicked popup button');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            break;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Also try to find buttons by text content
    console.log('🔍 Looking for buttons by text content...');
    const buttonTexts = ['OK', 'Accept', 'Continue', 'Accept all', 'Agree', 'Got it'];

    for (const text of buttonTexts) {
      try {
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const buttonText = await page.evaluate((el) => el.textContent?.trim(), button);
          if (buttonText && buttonText.toLowerCase().includes(text.toLowerCase())) {
            const isVisible = await button.isIntersectingViewport();
            if (isVisible) {
              console.log(`✅ Found button with text: "${buttonText}"`);
              await button.click();
              console.log(`🔘 Clicked button: "${buttonText}"`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              break;
            }
          }
        }
      } catch (error) {
        // Continue
      }
    }

    // Wait a bit more for any dynamic content after popup handling
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if we're still on login page
    const currentUrl = page.url();
    console.log('📍 URL after popup handling:', currentUrl);

    if (!currentUrl.includes('login')) {
      console.log('❌ Not on login page after popup handling. Current page:');
      console.log('Title:', await page.title());
      return;
    }

    // Now check for login form elements
    console.log('🔍 Looking for login form elements...');
    const emailField = await page.$('input[name="email"], input[type="email"], input[id*="email"]');
    const passwordField = await page.$('input[name="password"], input[type="password"], input[id*="password"]');

    if (!emailField || !passwordField) {
      console.log('❌ Login form fields not found');
      console.log('Email field found:', !!emailField);
      console.log('Password field found:', !!passwordField);

      // List all form elements for debugging
      const allInputs = await page.$$eval('input', (inputs) =>
        inputs.map((input) => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
        })),
      );
      console.log('All input elements:', allInputs);
      return;
    }

    console.log('✅ Found login form fields');

    // Check challengeToken before typing
    const tokenBefore = await page.evaluate(() => {
      const token = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!token,
        value: token ? token.value : 'NOT FOUND',
        length: token ? token.value.length : 0,
      };
    });

    console.log('🎯 Challenge token BEFORE typing:', tokenBefore);

    // Simulate realistic human typing
    console.log('⌨️ Starting realistic typing simulation...');

    // Focus and type email
    await emailField.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const email = process.env.CHRONO24_EMAIL;
    if (!email) {
      console.log('❌ No email found in environment variables');
      return;
    }

    console.log('📧 Typing email...');
    for (const char of email) {
      await page.type('input[name="email"]', char);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Focus and type password
    await passwordField.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const password = process.env.CHRONO24_PASSWORD;
    if (!password) {
      console.log('❌ No password found in environment variables');
      return;
    }

    console.log('🔐 Typing password...');
    for (const char of password) {
      await page.type('input[name="password"]', char);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 30));
    }

    console.log('✅ Finished typing credentials');

    // Check challengeToken after typing
    const tokenAfterTyping = await page.evaluate(() => {
      const token = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!token,
        value: token ? token.value : 'NOT FOUND',
        length: token ? token.value.length : 0,
      };
    });

    console.log('🎯 Challenge token AFTER typing:', tokenAfterTyping);

    // Wait a bit to see if token gets populated after typing
    console.log('⏳ Waiting 5 seconds to see if token gets populated...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const tokenAfterWaiting = await page.evaluate(() => {
      const token = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!token,
        value: token ? token.value : 'NOT FOUND',
        length: token ? token.value.length : 0,
      };
    });

    console.log('🎯 Challenge token AFTER waiting:', tokenAfterWaiting);

    // Try triggering various events that might populate the token
    console.log('🔄 Triggering validation events...');

    await page.evaluate(() => {
      const emailField = document.querySelector('input[name="email"]');
      const passwordField = document.querySelector('input[name="password"]');

      if (emailField) {
        // Trigger various events
        emailField.dispatchEvent(new Event('blur'));
        emailField.dispatchEvent(new Event('change'));
        emailField.dispatchEvent(new Event('input'));
      }

      if (passwordField) {
        passwordField.dispatchEvent(new Event('blur'));
        passwordField.dispatchEvent(new Event('change'));
        passwordField.dispatchEvent(new Event('input'));
      }

      // Trigger form validation
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('change'));
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const tokenAfterEvents = await page.evaluate(() => {
      const token = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!token,
        value: token ? token.value : 'NOT FOUND',
        length: token ? token.value.length : 0,
      };
    });

    console.log('🎯 Challenge token AFTER events:', tokenAfterEvents);

    // Take a screenshot for visual confirmation
    await page.screenshot({ path: 'after-typing.png', fullPage: true });
    console.log('📸 Screenshot saved: after-typing.png');

    console.log('\n📊 SUMMARY:');
    console.log(`Before typing: ${tokenBefore.length} chars`);
    console.log(`After typing: ${tokenAfterTyping.length} chars`);
    console.log(`After waiting: ${tokenAfterWaiting.length} chars`);
    console.log(`After events: ${tokenAfterEvents.length} chars`);

    if (tokenAfterEvents.length === 0) {
      console.log('❌ Challenge token never got populated during entire process');
    } else {
      console.log('✅ Challenge token was populated!');
    }

    // Keep browser open for manual inspection
    console.log('\n💡 Browser will stay open. Press any key to close...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit();
    });
  } catch (error) {
    console.error('💥 Error during login process:', error);
  } finally {
    // Browser will be closed by keypress
  }
}

// Load environment variables
require('dotenv').config();

// Run login test
if (require.main === module) {
  loginWithPopupHandling();
}
