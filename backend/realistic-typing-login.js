const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Human-like typing simulation
async function humanType(page, selector, text, options = {}) {
  const { minDelay = 50, maxDelay = 150, mistakes = true, mistakeChance = 0.05 } = options;

  console.log(`⌨️  Typing "${text}" into ${selector}`);

  await page.focus(selector);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Random typing delay
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Occasionally make a "mistake" for more human-like behavior
    if (mistakes && Math.random() < mistakeChance && i > 0) {
      // Type wrong character then backspace
      await page.keyboard.type('x');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await page.keyboard.press('Backspace');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await page.keyboard.type(char);

    // Occasionally pause (thinking)
    if (Math.random() < 0.1) {
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
    }
  }

  console.log(`✅ Finished typing "${text}"`);
}

async function realisticLoginAttempt() {
  console.log('🔍 Starting realistic login attempt with human typing...');

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

    // Enhanced token monitoring
    await page.evaluateOnNewDocument(() => {
      window.tokenLog = [];
      window.logToken = function (event, value) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = `[${timestamp}] ${event}: "${value}" (${value ? value.length : 0} chars)`;
        window.tokenLog.push(entry);
        console.log(`🔍 ${entry}`);
      };
    });

    console.log('🔗 Navigating to collection page to trigger login redirect...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('📍 Current URL:', page.url());

    // Setup comprehensive token monitoring
    await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"]');
      if (tokenField) {
        window.logToken('INITIAL', tokenField.value);

        // Monitor all possible changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              window.logToken('ATTR_CHANGED', tokenField.value);
            }
          });
        });
        observer.observe(tokenField, { attributes: true, attributeFilter: ['value'] });

        // Property interceptor
        let currentValue = tokenField.value;
        Object.defineProperty(tokenField, 'value', {
          get: function () {
            return this._monitored || currentValue;
          },
          set: function (val) {
            window.logToken('PROP_SET', val);
            this._monitored = val;
            currentValue = val;
            this.setAttribute('value', val);
          },
        });

        // Periodic check
        setInterval(() => {
          const attrVal = tokenField.getAttribute('value') || '';
          const propVal = tokenField._monitored || currentValue || '';
          if (attrVal.length > 10 || propVal.length > 10) {
            window.logToken('PERIODIC_CHECK', attrVal.length > propVal.length ? attrVal : propVal);
          }
        }, 2000);
      }
    });

    // Wait for page to fully load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('👀 Looking for cookie consent popup...');

    // Handle cookie consent with realistic timing
    try {
      await page.waitForSelector(
        '[data-testid="uc-accept-all-button"], .uc-btn-accept-all, button:contains("Accept"), button:contains("OK")',
        { timeout: 5000 },
      );
      console.log('🍪 Found cookie consent button');

      // Human-like delay before clicking
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      await page.click(
        '[data-testid="uc-accept-all-button"], .uc-btn-accept-all, button:contains("Accept"), button:contains("OK")',
      );
      console.log('✅ Clicked cookie consent');

      // Wait for potential token update after consent
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const tokenAfterConsent = await page.evaluate(() => {
        const field = document.querySelector('input[name="challengeToken"]');
        return field ? field.value : 'NOT FOUND';
      });
      console.log(`🔍 Token after consent: ${tokenAfterConsent.length} chars`);
    } catch (error) {
      console.log('ℹ️  No cookie consent popup found');
    }

    // Check current token status
    let tokenStatus = await page.evaluate(() => {
      const field = document.querySelector('input[name="challengeToken"]');
      return {
        exists: !!field,
        value: field ? field.value : 'NOT FOUND',
        length: field ? field.value.length : 0,
      };
    });
    console.log('🔍 Token before login:', tokenStatus);

    // Load credentials
    require('dotenv').config();
    const email = process.env.CHRONO24_EMAIL;
    const password = process.env.CHRONO24_PASSWORD;

    if (!email || !password) {
      throw new Error('Missing CHRONO24_EMAIL or CHRONO24_PASSWORD in .env file');
    }

    console.log('📧 Starting realistic email typing...');

    // Human-like typing for email
    await humanType(page, 'input[name="email"]', email, {
      minDelay: 80,
      maxDelay: 180,
      mistakes: true,
      mistakeChance: 0.03,
    });

    // Check token after email
    tokenStatus = await page.evaluate(() => {
      const field = document.querySelector('input[name="challengeToken"]');
      return {
        value: field ? field.value : 'NOT FOUND',
        length: field ? field.value.length : 0,
      };
    });
    console.log('🔍 Token after email:', tokenStatus);

    // Human pause between email and password
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    console.log('🔒 Starting realistic password typing...');

    // Human-like typing for password
    await humanType(page, 'input[name="password"]', password, {
      minDelay: 70,
      maxDelay: 160,
      mistakes: false, // Less likely to make mistakes on password
      mistakeChance: 0.01,
    });

    // Check token after password
    tokenStatus = await page.evaluate(() => {
      const field = document.querySelector('input[name="challengeToken"]');
      return {
        value: field ? field.value : 'NOT FOUND',
        length: field ? field.value.length : 0,
      };
    });
    console.log('🔍 Token after password:', tokenStatus);

    // Human-like pause before clicking login
    console.log('⏳ Pausing before login (human-like)...');
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

    console.log('🔘 Clicking login button...');

    // Click login button
    await page.click('button[name="login"], input[type="submit"][name="login"], button[type="submit"]');

    console.log('⏳ Waiting for login response...');

    // Monitor token changes during and after login submission
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      tokenStatus = await page.evaluate(() => {
        const field = document.querySelector('input[name="challengeToken"]');
        return {
          url: window.location.href,
          title: document.title,
          tokenExists: !!field,
          tokenValue: field ? field.value : 'NOT FOUND',
          tokenLength: field ? field.value.length : 0,
        };
      });

      console.log(`⏱️  ${i + 1}s - URL: ${tokenStatus.url.substring(0, 80)}...`);
      console.log(`⏱️  ${i + 1}s - Token: ${tokenStatus.tokenLength} chars`);

      // Check if we're redirected (successful login)
      if (!tokenStatus.url.includes('login.htm')) {
        console.log('🎉 Redirected away from login page!');
        break;
      }

      // Check for significant token change
      if (tokenStatus.tokenLength > 100) {
        console.log('🎯 Challenge token populated!');
        console.log(`🎯 Token value: ${tokenStatus.tokenValue.substring(0, 200)}...`);
        break;
      }
    }

    // Get final token logs
    const tokenLogs = await page.evaluate(() => window.tokenLog || []);

    console.log('\n📋 Complete token monitoring log:');
    tokenLogs.forEach((log) => console.log(`   ${log}`));

    console.log('\n📊 Final status:');
    const finalStatus = await page.evaluate(() => {
      const field = document.querySelector('input[name="challengeToken"]');
      return {
        currentUrl: window.location.href,
        pageTitle: document.title,
        tokenExists: !!field,
        tokenValue: field ? field.value.substring(0, 200) + '...' : 'NOT FOUND',
        tokenLength: field ? field.value.length : 0,
        hasErrorMessages: document.querySelectorAll('.error, .alert, [class*="error"]').length > 0,
      };
    });

    console.log('Final Analysis:', finalStatus);

    // Keep browser open for inspection
    console.log('\n💡 Browser will stay open for inspection. Press any key to close...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit();
    });
  } catch (error) {
    console.error('💥 Error during realistic login:', error);
  } finally {
    // Browser will be closed by keypress
  }
}

// Run the realistic login attempt
if (require.main === module) {
  realisticLoginAttempt();
}
