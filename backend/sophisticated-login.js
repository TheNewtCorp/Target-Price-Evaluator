const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

puppeteer.use(StealthPlugin());

async function waitWithHumanDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function humanMouseMovement(page) {
  const viewport = await page.viewport();

  // Move mouse in a realistic pattern
  const moves = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < moves; i++) {
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;
    await page.mouse.move(x, y);
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));
  }
}

async function waitForCloudflareChallengeComplete(page, timeout = 90000) {
  console.log('🔍 Waiting for Cloudflare Turnstile challenge to complete...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check if challenge token is populated with substantial content
      const challengeToken = await page.evaluate(() => {
        const tokenInput = document.querySelector('input[name="challengeToken"]');
        return tokenInput ? tokenInput.value : null;
      });

      // Based on HAR analysis, successful token is 1000+ characters
      if (challengeToken && challengeToken.length > 1000) {
        console.log('✅ Turnstile challenge token populated successfully');
        console.log(`📝 Token length: ${challengeToken.length} characters`);
        console.log(`📝 Token preview: ${challengeToken.substring(0, 100)}...`);
        return true;
      }

      // Look for active Turnstile elements
      const turnstileInfo = await page.evaluate(() => {
        const turnstileFrames = document.querySelectorAll('iframe[src*="turnstile"]');
        const turnstileContainers = document.querySelectorAll('[data-sitekey]');
        const cfTurnstile = document.querySelectorAll('.cf-turnstile');

        return {
          iframeCount: turnstileFrames.length,
          containerCount: turnstileContainers.length,
          cfTurnstileCount: cfTurnstile.length,
          sitekey: turnstileContainers.length > 0 ? turnstileContainers[0].getAttribute('data-sitekey') : null,
        };
      });

      if (turnstileInfo.iframeCount > 0 || turnstileInfo.containerCount > 0) {
        console.log('🔄 Turnstile challenge detected, waiting...', turnstileInfo);
      }

      // Small human-like mouse movement to appear active
      await humanMouseMovement(page);
      await waitWithHumanDelay(2000, 4000);
    } catch (error) {
      console.log('⚠️ Error checking challenge status:', error.message);
    }
  }

  console.log('⚠️ Timeout waiting for Turnstile challenge to complete');
  return false;
}

async function sophisticatedChrono24Login() {
  console.log('🚀 Starting sophisticated Chrono24 login automation...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-component-updates',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Remove automation-related properties
      delete navigator.__proto__.webdriver;

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      return originalQuery.call(window.navigator.permissions, { name: 'notifications' });
    });

    // Set user agent matching successful manual session
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    // Set additional headers matching HAR file
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

    console.log('📍 Step 1: Navigate to collection page (matching manual flow)...');

    // Navigate exactly like the successful manual session
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('⏱️ Current URL after navigation:', page.url());

    // Wait for natural loading and potential redirects
    await waitWithHumanDelay(2000, 4000);

    // Simulate human reading/thinking time
    await humanMouseMovement(page);
    await waitWithHumanDelay(1000, 2000);

    // Check if redirected to login
    if (!page.url().includes('/auth/login.htm')) {
      console.log('❌ Not redirected to login page. Current URL:', page.url());
      await page.screenshot({ path: 'debug-no-redirect-new.png', fullPage: true });
      return false;
    }

    console.log('✅ Successfully redirected to login page');

    console.log('📍 Step 2: Wait for page to fully load and Turnstile to initialize...');

    // Wait for login form to be fully loaded
    await page.waitForSelector('#email', { visible: true, timeout: 15000 });
    await page.waitForSelector('#password', { visible: true, timeout: 15000 });

    // Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });

    console.log('📍 Step 3: Wait for Cloudflare Turnstile challenge completion...');

    // Wait for Turnstile challenge to complete - this is crucial
    const challengeCompleted = await waitForCloudflareChallengeComplete(page, 90000);

    if (!challengeCompleted) {
      console.log('❌ Turnstile challenge did not complete within timeout');
      await page.screenshot({ path: 'debug-turnstile-timeout.png', fullPage: true });

      // Check page state
      const pageState = await page.evaluate(() => {
        const body = document.body.innerText.toLowerCase();
        return {
          hasBlocked: body.includes('blocked') || body.includes('access denied'),
          hasBot: body.includes('bot') || body.includes('automated'),
          title: document.title,
          challengeTokenValue: document.querySelector('input[name="challengeToken"]')?.value || 'NOT FOUND',
        };
      });

      console.log('🔍 Page state after Turnstile timeout:', pageState);
      return false;
    }

    console.log('📍 Step 4: Fill login form with human-like behavior...');

    // Human-like interaction with email field
    await humanMouseMovement(page);
    await page.hover('#email');
    await waitWithHumanDelay(500, 1000);
    await page.click('#email');
    await waitWithHumanDelay(300, 600);

    // Type email with human-like delays
    await page.type('#email', process.env.CHRONO24_EMAIL, {
      delay: Math.floor(Math.random() * 50) + 80,
    });

    console.log('✅ Email field filled');

    // Wait between fields like a human
    await waitWithHumanDelay(800, 1500);
    await humanMouseMovement(page);

    // Human-like interaction with password field
    await page.hover('#password');
    await waitWithHumanDelay(400, 800);
    await page.click('#password');
    await waitWithHumanDelay(300, 600);

    // Type password with human-like delays
    await page.type('#password', process.env.CHRONO24_PASSWORD, {
      delay: Math.floor(Math.random() * 50) + 90,
    });

    console.log('✅ Password field filled');

    // Human thinking time before submission
    await waitWithHumanDelay(1000, 2000);
    await humanMouseMovement(page);

    console.log('📍 Step 5: Final verification and form submission...');

    // Final check that challenge token is still valid
    const finalChallenge = await page.evaluate(() => {
      const tokenInput = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!tokenInput,
        value: tokenInput ? tokenInput.value : null,
        length: tokenInput ? tokenInput.value.length : 0,
      };
    });

    console.log('🔍 Final challenge token check:', finalChallenge);

    if (finalChallenge.length < 1000) {
      console.log('❌ Challenge token appears invalid or too short for submission');
      return false;
    }

    // Take screenshot before submission
    await page.screenshot({ path: 'debug-before-final-submit.png', fullPage: true });

    // Submit form
    const loginButton = await page.$('button[name="login"]');
    if (!loginButton) {
      console.log('❌ Could not find login button');
      return false;
    }

    await page.hover('button[name="login"]');
    await waitWithHumanDelay(500, 1000);
    await loginButton.click();
    console.log('✅ Login form submitted');

    console.log('📍 Step 6: Wait for login response...');

    // Wait for navigation or response
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 20000,
      });

      const finalUrl = page.url();
      console.log('🎯 Final URL after login:', finalUrl);

      if (
        finalUrl.includes('/user/watch-collection/') ||
        finalUrl.includes('/dashboard') ||
        finalUrl.includes('/account') ||
        (finalUrl.includes('watchCollectionItemOrigin') && !finalUrl.includes('/auth/'))
      ) {
        console.log('🎉 SUCCESS! Login appears successful!');
        await page.screenshot({ path: 'success-sophisticated-login.png', fullPage: true });
        return true;
      } else {
        console.log('❌ Login failed or unexpected redirect');
        console.log('🔍 Final URL:', finalUrl);
        await page.screenshot({ path: 'failure-sophisticated-login.png', fullPage: true });
        return false;
      }
    } catch (navigationError) {
      console.log('⏱️ Navigation timeout, checking final state...');

      const finalState = await page.evaluate(() => {
        const url = window.location.href;
        const body = document.body.innerText.toLowerCase();

        return {
          url: url,
          isLoginPage: url.includes('/auth/login'),
          hasErrorMessages: body.includes('error') || body.includes('invalid') || body.includes('incorrect'),
          hasSuccessIndicators: body.includes('welcome') || body.includes('dashboard') || body.includes('my account'),
          title: document.title,
        };
      });

      console.log('🔍 Final state analysis:', finalState);
      await page.screenshot({ path: 'debug-final-state.png', fullPage: true });

      return !finalState.isLoginPage;
    }
  } catch (error) {
    console.error('💥 Error during sophisticated login:', error);

    try {
      await page.screenshot({ path: 'error-sophisticated.png', fullPage: true });
    } catch (screenshotError) {
      console.log('📸 Could not take error screenshot');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the sophisticated login
if (require.main === module) {
  (async () => {
    const success = await sophisticatedChrono24Login();

    if (success) {
      console.log('\n🎉 ========================================');
      console.log('🎉 SOPHISTICATED LOGIN SUCCESSFUL!');
      console.log('🎉 ========================================\n');
    } else {
      console.log('\n❌ ========================================');
      console.log('❌ SOPHISTICATED LOGIN FAILED!');
      console.log('❌ ========================================\n');
    }

    process.exit(success ? 0 : 1);
  })();
}

module.exports = { sophisticatedChrono24Login };
