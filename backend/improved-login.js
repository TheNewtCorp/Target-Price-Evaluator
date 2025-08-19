const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

puppeteer.use(StealthPlugin());

async function humanBehavior(page) {
  // More human-like mouse movements and delays
  const viewport = await page.viewport();

  // Random small movements
  const randomMoves = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < randomMoves; i++) {
    await page.mouse.move(Math.random() * viewport.width, Math.random() * viewport.height);
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
  }

  // Random scroll behavior
  await page.evaluate(() => {
    window.scrollBy(0, Math.random() * 200 - 100);
  });

  await new Promise((resolve) => setTimeout(resolve, Math.random() * 300 + 200));
}

async function waitForTurnstileChallenge(page, timeout = 60000) {
  console.log('🔍 Checking for Cloudflare Turnstile challenge...');

  try {
    // Look for the challenge token input field and wait for it to be populated
    const challengeTokenSelector = 'input[name="challengeToken"]';

    await page.waitForSelector(challengeTokenSelector, { timeout: 10000 });
    console.log('✅ Found challenge token field');

    // Wait for the challenge token to be populated (not empty)
    await page.waitForFunction(
      (selector) => {
        const tokenInput = document.querySelector(selector);
        return tokenInput && tokenInput.value && tokenInput.value.trim() !== '' && tokenInput.value.length > 50;
      },
      { timeout },
      challengeTokenSelector,
    );

    const challengeToken = await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      return input ? input.value : null;
    }, challengeTokenSelector);

    console.log('✅ Challenge token populated:', challengeToken.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.log('⚠️ No challenge token found or timeout waiting for population');
    return false;
  }
}

async function handleCookieConsent(page) {
  try {
    console.log('🍪 Looking for cookie consent...');

    // Wait a bit for cookie consent to appear
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Look for various cookie consent selectors
    const consentSelectors = [
      'button[data-consent="accept"]',
      '.js-accept-all',
      '[data-test="accept-all"]',
      'button:has-text("Accept all")',
      'button:has-text("Accept All")',
      '#acceptAllCookies',
      '.accept-all',
      '.accept-cookies',
    ];

    for (const selector of consentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log('✅ Found cookie consent button:', selector);
          await humanBehavior(page);
          await element.click();
          console.log('✅ Cookie consent accepted');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    console.log('ℹ️ No cookie consent found');
    return false;
  } catch (error) {
    console.log('⚠️ Error handling cookie consent:', error.message);
    return false;
  }
}

async function improvedChrono24Login() {
  console.log('🚀 Starting improved Chrono24 login automation...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling',
      '--disable-extensions-except-webstore',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-component-updates',
      '--window-size=1920,1080',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    // Set exact user agent from successful manual session
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    // Set additional headers to match manual session
    await page.setExtraHTTPHeaders({
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    });

    console.log('📍 Step 1: Navigate to collection page first (matching manual session)...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('⏱️ Current URL after collection page:', page.url());

    // Human behavior before interaction
    await humanBehavior(page);

    // Handle cookie consent if present
    await handleCookieConsent(page);

    // Check if we were redirected to login
    if (page.url().includes('/auth/login.htm')) {
      console.log('✅ Redirected to login page as expected');
    } else {
      console.log('❌ Not redirected to login, current URL:', page.url());
      await page.screenshot({ path: 'debug-no-redirect.png', fullPage: true });
      return;
    }

    console.log('📍 Step 2: Wait for Turnstile challenge to complete...');

    // Wait for page to fully load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Wait for challenge token to be populated
    await waitForTurnstileChallenge(page, 60000);

    console.log('📍 Step 3: Fill login form with human-like behavior...');

    // Ensure email and password fields are visible
    await page.waitForSelector('#email', { visible: true, timeout: 10000 });
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });

    // Human-like form filling with realistic delays
    await humanBehavior(page);
    await page.click('#email');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.type('#email', process.env.CHRONO24_EMAIL, { delay: 85 });

    await new Promise((resolve) => setTimeout(resolve, 800));
    await humanBehavior(page);

    await page.click('#password');
    await new Promise((resolve) => setTimeout(resolve, 400));
    await page.type('#password', process.env.CHRONO24_PASSWORD, { delay: 95 });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Wait for any final Turnstile processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify challenge token is still populated before submission
    const finalChallengeCheck = await page.evaluate(() => {
      const tokenInput = document.querySelector('input[name="challengeToken"]');
      return tokenInput ? tokenInput.value : null;
    });

    if (finalChallengeCheck && finalChallengeCheck.length > 50) {
      console.log('✅ Challenge token confirmed before submission:', finalChallengeCheck.substring(0, 50) + '...');
    } else {
      console.log('⚠️ Challenge token seems empty or short before submission');
    }

    console.log('📍 Step 4: Submit login form...');

    // Take screenshot before submission
    await page.screenshot({ path: 'debug-before-submit.png', fullPage: true });

    // Submit the form with proper selector
    const loginButton = await page.$('button[name="login"], input[name="login"], .js-login-button');
    if (loginButton) {
      await humanBehavior(page);
      await loginButton.click();
      console.log('✅ Login form submitted');
    } else {
      console.log('❌ Could not find login button');
      await page.screenshot({ path: 'debug-no-login-button.png', fullPage: true });
      return;
    }

    console.log('📍 Step 5: Wait for login response...');

    // Wait for navigation or error
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      const finalUrl = page.url();
      console.log('🎯 Final URL after login:', finalUrl);

      if (
        finalUrl.includes('/user/watch-collection/') ||
        finalUrl.includes('/dashboard') ||
        finalUrl.includes('/account')
      ) {
        console.log('🎉 SUCCESS! Login appears to have worked!');
        console.log('✅ Successfully redirected to:', finalUrl);

        // Take success screenshot
        await page.screenshot({ path: 'success-login.png', fullPage: true });

        // Verify we're logged in by looking for user elements
        const userElements = await page.evaluate(() => {
          const userMenu = document.querySelector('.user-menu, .js-user-menu, [data-user], .account-menu');
          const loginText = document.body.innerText.toLowerCase();
          return {
            hasUserMenu: !!userMenu,
            hasLoginIndicators:
              loginText.includes('my account') || loginText.includes('logout') || loginText.includes('dashboard'),
          };
        });

        console.log('👤 User login verification:', userElements);

        return true;
      } else if (finalUrl.includes('/auth/login')) {
        console.log('❌ Still on login page, login likely failed');

        // Check for error messages
        const errorMessages = await page.evaluate(() => {
          const errors = [];
          const errorSelectors = ['.error', '.alert-danger', '.error-message', '.login-error', '[class*="error"]'];
          errorSelectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
              if (el.textContent.trim()) {
                errors.push(el.textContent.trim());
              }
            });
          });
          return errors;
        });

        console.log('❌ Error messages found:', errorMessages);

        // Take failure screenshot
        await page.screenshot({ path: 'failure-still-login.png', fullPage: true });

        return false;
      } else {
        console.log('🤔 Unexpected redirect to:', finalUrl);
        await page.screenshot({ path: 'debug-unexpected-redirect.png', fullPage: true });
        return false;
      }
    } catch (navigationError) {
      console.log('⏱️ Navigation timeout, checking current state...');

      const currentUrl = page.url();
      console.log('🔍 Current URL after timeout:', currentUrl);

      // Check for CAPTCHA or blocking
      const pageAnalysis = await page.evaluate(() => {
        const turnstile = document.querySelector('[data-sitekey], .cf-turnstile, iframe[src*="turnstile"]');
        const blocked =
          document.body.innerText.toLowerCase().includes('blocked') ||
          document.body.innerText.toLowerCase().includes('access denied') ||
          document.title.toLowerCase().includes('blocked');

        const captcha =
          document.body.innerText.toLowerCase().includes('captcha') ||
          document.body.innerText.toLowerCase().includes('verify') ||
          !!document.querySelector('[id*="captcha"], [class*="captcha"]');

        return {
          hasTurnstile: !!turnstile,
          isBlocked: blocked,
          hasCaptcha: captcha,
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
        };
      });

      console.log('🔍 Page analysis after timeout:', pageAnalysis);

      await page.screenshot({ path: 'debug-navigation-timeout.png', fullPage: true });

      return false;
    }
  } catch (error) {
    console.error('💥 Error during login process:', error);

    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.log('📸 Could not take error screenshot:', screenshotError.message);
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the improved login
if (require.main === module) {
  (async () => {
    const success = await improvedChrono24Login();

    if (success) {
      console.log('\n🎉 ========================================');
      console.log('🎉 LOGIN AUTOMATION SUCCESSFUL!');
      console.log('🎉 ========================================\n');
    } else {
      console.log('\n❌ ========================================');
      console.log('❌ LOGIN AUTOMATION FAILED!');
      console.log('❌ ========================================\n');
    }

    process.exit(success ? 0 : 1);
  })();
}

module.exports = { improvedChrono24Login };
