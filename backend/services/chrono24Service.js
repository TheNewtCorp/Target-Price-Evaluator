const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const UserAgent = require('user-agents');

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

    logger.info('Attempting to log into Chrono24');

    try {
      // Navigate to login page
      await this.page.goto('https://www.chrono24.com/auth/login.htm?userRegisterOrigin=Direct', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await humanBehavior.randomDelay(2000, 4000);

      // Check if already logged in
      try {
        await this.page.waitForSelector('a[href*="/user/"]', { timeout: 5000 });
        logger.info('Already logged in to Chrono24');
        this.isLoggedIn = true;
        this.lastActivity = Date.now();
        return true;
      } catch (e) {
        // Not logged in, proceed with login
      }

      // Wait for login form
      await this.page.waitForSelector('#email', { timeout: 10000 });
      await this.page.waitForSelector('#password', { timeout: 10000 });

      // Simulate human-like typing for email
      await humanBehavior.humanType(this.page, '#email', process.env.CHRONO24_EMAIL);
      await humanBehavior.randomDelay(500, 1500);

      // Simulate human-like typing for password
      await humanBehavior.humanType(this.page, '#password', process.env.CHRONO24_PASSWORD);
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

      // Wait for login to complete
      await humanBehavior.randomDelay(3000, 5000);

      // Check for successful login
      try {
        await this.page.waitForSelector('a[href*="/user/"]', { timeout: 10000 });
        logger.info('Successfully logged into Chrono24');

        // Save cookies for future use
        await cookieManager.saveCookies(this.page);

        this.isLoggedIn = true;
        this.lastActivity = Date.now();
        return true;
      } catch (e) {
        throw new Error('Login failed - could not find user profile elements');
      }
    } catch (error) {
      logger.error('Login failed:', error.message);
      throw new Error(`Login failed: ${error.message}`);
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
