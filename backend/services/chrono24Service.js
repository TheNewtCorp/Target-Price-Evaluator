const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const UserAgent = require('user-agents');
require('dotenv').config();

const cookieManager = require('./cookieManager');
const humanBehavior = require('./humanBehavior');
const priceCalculator = require('../utils/priceCalculator');
const logger = require('../utils/logger');

class Chrono24Service {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.lastActivity = Date.now();
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MS) || 300000; // 5 minutes
  }

  async initialize() {
    if (this.browser && !this.browser.isConnected()) {
      await this.cleanup();
    }

    if (!this.browser) {
      logger.info('Initializing Puppeteer browser');

      const launchOptions = {
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--window-size=1366,768',
          '--user-agent=' + new UserAgent().toString(),
        ],
        defaultViewport: {
          width: 1366,
          height: 768,
        },
        ignoreDefaultArgs: ['--enable-automation'],
      };

      // Set Chrome executable path based on environment
      if (process.env.CHROME_EXECUTABLE_PATH) {
        // Use custom path if specified in environment
        launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
      } else if (process.env.NODE_ENV === 'production') {
        // Production/Docker environment (Render.com)
        launchOptions.executablePath = '/usr/bin/google-chrome-stable';
      }
      // For development, let Puppeteer auto-detect Chrome (including installed Chrome)

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // Set up the page with human-like characteristics
      await this.setupPage();
    }
  }

  async setupPage() {
    // Remove webdriver property
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Override the plugins property to use a custom getter
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Override the languages property to use a custom getter
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Set realistic viewport
    await this.page.setViewport({
      width: 1366,
      height: 768,
      hasTouch: false,
      isLandscape: true,
    });

    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    });

    // Load existing cookies if available
    await cookieManager.loadCookies(this.page);

    logger.info('Page setup completed with anti-bot measures');
  }

  async ensureLoggedIn() {
    if (this.isLoggedIn && Date.now() - this.lastActivity < this.sessionTimeout) {
      this.lastActivity = Date.now();
      return true;
    }

    logger.info('Checking authentication status via collection page');

    try {
      // Try to restore session from cookies first
      const cookies = await cookieManager.loadCookies();
      if (cookies && cookies.length > 0) {
        await this.page.setCookie(...cookies);
        logger.info('Loaded existing cookies');
      }

      // Follow the correct workflow: Try collection page first, only login if redirected
      const collectionUrl =
        'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection';

      await this.page.goto(collectionUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a moment for potential redirect
      await humanBehavior.randomDelay(2000, 3000);

      const currentUrl = this.page.url();
      logger.info(`After collection page navigation, current URL: ${currentUrl}`);

      // Check if we're already authenticated (stayed on collection page)
      if (currentUrl.includes('/user/watch-collection/')) {
        logger.info('Already authenticated - collection page loaded successfully');
        this.isLoggedIn = true;
        this.lastActivity = Date.now();
        return true;
      }

      // Check if we're redirected to login page
      if (currentUrl.includes('/auth/login')) {
        logger.info('Redirected to login page, authentication required');

        // Handle cookie consent modal if present
        await this.handleCookieConsent();

        // Handle CAPTCHA if present
        await this.handleTurnstileCaptcha();

        // Wait for login form
        await this.page.waitForSelector('#email', { timeout: 10000 });
        await this.page.waitForSelector('#password', { timeout: 10000 });

        // Validate credentials before attempting login
        const email = process.env.CHRONO24_EMAIL;
        const password = process.env.CHRONO24_PASSWORD;

        logger.info(`Email loaded: ${email ? 'Yes' : 'No'}`);
        logger.info(`Password loaded: ${password ? 'Yes' : 'No'}`);

        if (!email || !password) {
          throw new Error('CHRONO24_EMAIL and CHRONO24_PASSWORD environment variables must be set');
        }

        // Simulate human-like typing for email
        await humanBehavior.humanType(this.page, '#email', email);
        await humanBehavior.randomDelay(500, 1500);

        // Simulate human-like typing for password
        await humanBehavior.humanType(this.page, '#password', password);
        await humanBehavior.randomDelay(1000, 2000);

        // Check "Stay logged in" checkbox
        const stayLoggedInSelector = '#userLogInPermanently';
        try {
          await this.page.waitForSelector(stayLoggedInSelector, { timeout: 3000 });
          await humanBehavior.humanClick(this.page, stayLoggedInSelector);
          await humanBehavior.randomDelay(500, 1000);
        } catch (e) {
          logger.warn('Could not find or check "Stay logged in" checkbox');
        }

        // Submit the form
        const submitSelector = '.js-login-button';
        await this.page.waitForSelector(submitSelector, { timeout: 5000 });

        // Add small mouse movement before clicking login
        await humanBehavior.randomMouseMove(this.page);
        await humanBehavior.humanClick(this.page, submitSelector);

        // Wait for initial page response (shorter delay)
        await humanBehavior.randomDelay(2000, 3000);

        // Check if CAPTCHA appeared after form submission
        await this.handleTurnstileCaptcha();

        // Wait for login to complete and redirect back to collection page
        await humanBehavior.randomDelay(3000, 5000);

        // Check for successful login by waiting for redirect to original target
        try {
          await this.page.waitForFunction(
            () => {
              const url = window.location.href;
              return (
                url.includes('/user/watch-collection/') ||
                url.includes('/user/') ||
                url.includes('/dashboard') ||
                url.includes('/profile') ||
                !url.includes('/auth/login')
              );
            },
            { timeout: 15000 },
          );

          // Double-check by verifying we're not still on login page
          const finalUrl = this.page.url();
          if (finalUrl.includes('/auth/login')) {
            // We're still on login page, check for error messages
            const errorMessages = await this.page.$$eval(
              '.alert-error, .error-message, .js-error, .alert-danger',
              (elements) => elements.map((el) => el.textContent.trim()).filter((text) => text),
            );
            if (errorMessages.length > 0) {
              throw new Error(`Login failed with errors: ${errorMessages.join(', ')}`);
            } else {
              throw new Error('Login failed - still on login page after form submission');
            }
          }

          logger.info('Successfully logged into Chrono24');

          // Save cookies for future use
          await cookieManager.saveCookies(this.page);

          this.isLoggedIn = true;
          this.lastActivity = Date.now();
          return true;
        } catch (e) {
          // Get current URL for debugging
          const currentUrl = this.page.url();
          const pageTitle = await this.page.title();

          // Check for specific error indicators
          let errorDetails = '';
          try {
            const errorElements = await this.page.$$(
              '.alert-error, .error-message, .js-error, .alert-danger, .captcha-error, .js-captcha-error',
            );
            if (errorElements.length > 0) {
              const errors = await Promise.all(
                errorElements.map((el) => this.page.evaluate((element) => element.textContent, el)),
              );
              errorDetails = ` Errors: ${errors.join(', ')}`;

              // Check if it's a CAPTCHA-related error
              const captchaKeywords = ['captcha', 'verification', 'challenge', 'robot', 'human'];
              const hasCaptchaError = errors.some((error) =>
                captchaKeywords.some((keyword) => error.toLowerCase().includes(keyword)),
              );

              if (hasCaptchaError) {
                logger.warn('CAPTCHA-related error detected, retrying CAPTCHA handling...');
                await this.handleTurnstileCaptcha();
                await humanBehavior.randomDelay(3000, 5000);

                // Check if we're now successfully logged in
                const retryUrl = this.page.url();
                if (!retryUrl.includes('/auth/login')) {
                  logger.info('Successfully logged in after CAPTCHA retry');
                  await cookieManager.saveCookies(this.page);
                  this.isLoggedIn = true;
                  this.lastActivity = Date.now();
                  return true;
                }
              }
            }
          } catch (errorCheckError) {
            // Ignore error checking errors
          }

          throw new Error(
            `Login failed - did not redirect to expected page after login. Current URL: ${currentUrl}, Title: ${pageTitle}${errorDetails}`,
          );
        }
      } else {
        throw new Error(`Unexpected redirect: ${currentUrl}`);
      }
    } catch (error) {
      logger.error('Authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async evaluateWatch(refNumber) {
    await this.initialize();
    await this.ensureLoggedIn();

    logger.info(`Starting watch evaluation for: ${refNumber}`);

    try {
      // Navigate to the watch collection page
      const collectionUrl =
        'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection';

      await this.page.goto(collectionUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await humanBehavior.randomDelay(2000, 4000);

      // Wait for search input
      const searchSelector = 'input[placeholder*="Brand, model, reference number"]';
      await this.page.waitForSelector(searchSelector, { timeout: 15000 });

      // Clear and enter search term
      await this.page.click(searchSelector);
      await humanBehavior.randomDelay(500, 1000);

      // Clear existing content
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await humanBehavior.randomDelay(100, 300);

      // Type the reference number
      await humanBehavior.humanType(this.page, searchSelector, refNumber, false);
      await humanBehavior.randomDelay(1000, 2000);

      // Click search button
      const searchButtonSelector = 'button[type="button"] i.i-search';
      await this.page.waitForSelector(searchButtonSelector, { timeout: 5000 });
      await humanBehavior.humanClick(this.page, searchButtonSelector);

      // Wait for results to load
      await humanBehavior.randomDelay(3000, 5000);

      // Wait for and click the first result
      const firstResultSelector = '.watch-list-item:first-child';
      await this.page.waitForSelector(firstResultSelector, { timeout: 15000 });

      await humanBehavior.randomMouseMove(this.page);
      await humanBehavior.humanClick(this.page, firstResultSelector);

      // Wait for the details page to load
      await humanBehavior.randomDelay(2000, 4000);

      // First, record initial prices (before selecting "Worn")
      let initialPrices = null;
      try {
        const initialPriceContainer = '.price-container .h4';
        await this.page.waitForSelector(initialPriceContainer, { timeout: 10000 });
        initialPrices = await this.extractPriceRange();
        logger.info('Initial prices recorded:', initialPrices);
      } catch (e) {
        logger.warn('Could not extract initial prices');
      }

      // Find and click the "Worn" radio button
      const wornRadioSelector = 'input[type="radio"][value="worn"]';
      await this.page.waitForSelector(wornRadioSelector, { timeout: 10000 });

      await humanBehavior.randomDelay(1000, 2000);
      await humanBehavior.humanClick(this.page, wornRadioSelector);

      // Wait for prices to update after selecting "Worn"
      await humanBehavior.randomDelay(2000, 4000);

      // Verify the radio button was selected and prices changed
      let attempts = 0;
      const maxAttempts = 5;
      let finalPrices = null;

      while (attempts < maxAttempts) {
        try {
          // Check if radio button is selected
          const isSelected = await this.page.$eval(wornRadioSelector, (el) => el.checked);

          if (isSelected) {
            // Extract updated prices
            finalPrices = await this.extractPriceRange();

            // Verify prices have changed (if we had initial prices)
            if (
              !initialPrices ||
              finalPrices.minPrice !== initialPrices.minPrice ||
              finalPrices.maxPrice !== initialPrices.maxPrice
            ) {
              logger.info('Worn condition selected and prices updated:', finalPrices);
              break;
            }
          }

          // If not selected or prices haven't changed, try clicking again
          await humanBehavior.randomDelay(1000, 2000);
          await humanBehavior.humanClick(this.page, wornRadioSelector);
          await humanBehavior.randomDelay(2000, 3000);
        } catch (e) {
          logger.warn(`Attempt ${attempts + 1} failed to verify worn condition:`, e.message);
        }

        attempts++;
      }

      if (!finalPrices) {
        finalPrices = await this.extractPriceRange();
      }

      // Calculate target price (80% of minimum price)
      const result = priceCalculator.calculateTargetPrice(refNumber, finalPrices.minPrice, finalPrices.maxPrice);

      this.lastActivity = Date.now();
      logger.info(`Evaluation completed for ${refNumber}:`, result);

      return result;
    } catch (error) {
      logger.error(`Evaluation failed for ${refNumber}:`, error.message);
      throw error;
    }
  }

  async extractPriceRange() {
    try {
      // Wait for price container
      await this.page.waitForSelector('.price-container', { timeout: 5000 });

      // Extract price range
      const priceData = await this.page.evaluate(() => {
        const priceContainer = document.querySelector('.price-container .h4');
        if (!priceContainer) {
          throw new Error('Price container not found');
        }

        const priceText = priceContainer.textContent;
        const priceSpans = priceContainer.querySelectorAll('span');

        if (priceSpans.length >= 2) {
          const price1Text = priceSpans[0].textContent.replace(/[^0-9]/g, '');
          const price2Text = priceSpans[1].textContent.replace(/[^0-9]/g, '');

          const price1 = parseInt(price1Text);
          const price2 = parseInt(price2Text);

          return {
            minPrice: Math.min(price1, price2),
            maxPrice: Math.max(price1, price2),
            rawText: priceText,
          };
        } else {
          // Single price case
          const singlePrice = parseInt(priceText.replace(/[^0-9]/g, ''));
          return {
            minPrice: singlePrice,
            maxPrice: singlePrice,
            rawText: priceText,
          };
        }
      });

      return priceData;
    } catch (error) {
      logger.error('Failed to extract price range:', error.message);
      throw new Error(`Could not extract price information: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      await this.initialize();

      const testUrl = 'https://www.chrono24.com';
      await this.page.goto(testUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const title = await this.page.title();

      return {
        status: 'connected',
        url: testUrl,
        title: title,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async handleCookieConsent() {
    try {
      logger.info('Checking for cookie consent modal');

      // Wait briefly for the modal to appear
      await humanBehavior.randomDelay(1000, 2000);

      // Look for the cookie consent modal
      const consentModalSelector = '.js-modal-content, .gdpr-layer-content';
      const acceptButtonSelector = '.js-cookie-accept-all';

      const consentModal = await this.page.$(consentModalSelector);
      if (consentModal) {
        logger.info('Cookie consent modal detected, accepting');

        // Check if the accept button is present and visible
        const acceptButton = await this.page.$(acceptButtonSelector);
        if (acceptButton) {
          const isVisible = await acceptButton.isIntersectingViewport();
          if (isVisible) {
            // Add human-like behavior before clicking
            await humanBehavior.randomDelay(500, 1000);
            await humanBehavior.randomMouseMove(this.page);
            await humanBehavior.humanClick(this.page, acceptButtonSelector);
            logger.info('Cookie consent accepted');

            // Wait for modal to disappear
            await this.page
              .waitForSelector(consentModalSelector, {
                hidden: true,
                timeout: 5000,
              })
              .catch(() => {
                logger.warn('Cookie consent modal may not have closed properly');
              });
          } else {
            logger.warn('Cookie consent accept button not visible');
          }
        } else {
          logger.warn('Cookie consent accept button not found');
        }
      } else {
        logger.info('No cookie consent modal detected');
      }
    } catch (error) {
      logger.warn(`Error handling cookie consent: ${error.message}`);
    }
  }

  async handleTurnstileCaptcha() {
    try {
      logger.info('Checking for Cloudflare Turnstile CAPTCHA');

      // Wait briefly for CAPTCHA to load
      await humanBehavior.randomDelay(2000, 3000);

      // Look for Turnstile iframe
      const turnstileSelectors = [
        'iframe[src*="challenges.cloudflare.com"]',
        'iframe[src*="turnstile"]',
        '.cf-turnstile iframe',
        '[data-sitekey] iframe',
      ];

      let turnstileFrame = null;
      for (const selector of turnstileSelectors) {
        turnstileFrame = await this.page.$(selector);
        if (turnstileFrame) {
          logger.info(`Found Turnstile iframe with selector: ${selector}`);
          break;
        }
      }

      if (!turnstileFrame) {
        logger.info('No Turnstile CAPTCHA detected');
        return;
      }

      logger.info('Turnstile CAPTCHA detected, attempting to solve');

      // Try to interact with the Turnstile checkbox
      try {
        const frame = await turnstileFrame.contentFrame();
        if (frame) {
          // Wait for the checkbox to be available
          await frame.waitForSelector('input[type="checkbox"], .cb-i, [role="checkbox"]', {
            timeout: 10000,
          });

          // Add human-like delay
          await humanBehavior.randomDelay(1000, 3000);

          // Try multiple selectors for the checkbox
          const checkboxSelectors = [
            'input[type="checkbox"]',
            '.cb-i',
            '[role="checkbox"]',
            'label',
            '.ctp-checkbox-container',
          ];

          let clicked = false;
          for (const selector of checkboxSelectors) {
            try {
              const checkbox = await frame.$(selector);
              if (checkbox) {
                const isVisible = await checkbox.isIntersectingViewport();
                if (isVisible) {
                  await checkbox.click();
                  logger.info(`Clicked Turnstile checkbox with selector: ${selector}`);
                  clicked = true;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }

          if (clicked) {
            // Wait for CAPTCHA to be solved
            logger.info('Waiting for Turnstile to complete verification...');
            await humanBehavior.randomDelay(3000, 7000);

            // Check if verification completed by looking for success indicators
            try {
              await frame.waitForSelector('.cb-i.cb-i-m-h', { timeout: 15000 }); // success indicator
              logger.info('Turnstile CAPTCHA appears to be solved');
            } catch (e) {
              logger.warn('Could not verify Turnstile completion, continuing anyway');
            }
          } else {
            logger.warn('Could not click Turnstile checkbox');
          }
        } else {
          logger.warn('Could not access Turnstile iframe content');
        }
      } catch (error) {
        logger.warn(`Error interacting with Turnstile: ${error.message}`);
      }
    } catch (error) {
      logger.warn(`Error handling Turnstile CAPTCHA: ${error.message}`);
    }
  }

  async cleanup() {
    logger.info('Cleaning up browser resources');

    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
    } catch (e) {
      logger.warn('Error closing page:', e.message);
    }

    try {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
      }
    } catch (e) {
      logger.warn('Error closing browser:', e.message);
    }

    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }
}

module.exports = new Chrono24Service();
