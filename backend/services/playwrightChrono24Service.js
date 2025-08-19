const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const logger = require('../utils/logger');
const priceCalculator = require('../utils/priceCalculator');

class PlaywrightChrono24Service {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.lastActivity = Date.now();
  }

  async initialize() {
    if (this.browser && this.browser.isConnected()) {
      await this.cleanup();
    }

    logger.info('🎭 Initializing Playwright with advanced stealth');

    // Use Chromium with advanced anti-detection
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production' || process.env.HEADLESS === 'true', // Headless in production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Faster loading
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    // Create a new context with realistic device emulation
    this.context = await this.browser.newContext({
      // Emulate a real Windows desktop
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',

      // Realistic browser settings
      locale: 'en-US',
      timezoneId: 'America/New_York', // Florida timezone

      // Geolocation for Boca Raton, Florida
      geolocation: {
        latitude: 26.3683064,
        longitude: -80.1289321,
        accuracy: 100,
      },
      permissions: ['geolocation'],

      // Device characteristics
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',

      // Network settings
      offline: false,

      // Screen settings
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,

      // Extra HTTP headers to appear more legitimate
      extraHTTPHeaders: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Google Chrome";v="139", "Chromium";v="139", "Not;A=Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Create a new page
    this.page = await this.context.newPage();

    // Advanced stealth measures
    await this.page.addInitScript(() => {
      // Remove webdriver property
      delete Object.getPrototypeOf(navigator).webdriver;

      // Mock chrome runtime
      window.chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
      };

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock permissions API
      const originalQuery = window.navigator.permissions?.query;
      if (originalQuery) {
        window.navigator.permissions.query = (parameters) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
      }

      // Add realistic screen properties
      Object.defineProperties(screen, {
        availWidth: { get: () => 1920 },
        availHeight: { get: () => 1040 },
        width: { get: () => 1920 },
        height: { get: () => 1080 },
        colorDepth: { get: () => 24 },
        pixelDepth: { get: () => 24 },
      });

      // Mock connection
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 150,
          downlink: 10,
          saveData: false,
        }),
      });

      // Mock hardwareConcurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
      });

      // Mock memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      console.log('🎭 Advanced stealth measures activated');
    });

    logger.info('✅ Playwright browser initialized with Florida geolocation');
  }

  async handleCookieConsent() {
    try {
      logger.info('🍪 Looking for cookie consent popup...');

      // Wait for any modals to appear
      await this.page.waitForTimeout(2000);

      // Comprehensive cookie consent selectors
      const cookieSelectors = [
        '.js-cookie-accept-all', // Specific from HTML you provided
        'button:has-text("OK")',
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("Accept All")',
        'button:has-text("Agree")',
        'button:has-text("Continue")',
        '[data-test="cookie-accept"]',
        '#cookie-consent button',
        '.cookie-banner button',
        '[class*="consent"] button[class*="accept"]',
        '.wt-consent-layer-accept-all',
      ];

      let cookieHandled = false;

      for (const selector of cookieSelectors) {
        try {
          // Wait briefly for the element
          const element = await this.page.locator(selector).first();

          if (await element.isVisible({ timeout: 1000 })) {
            const buttonText = await element.textContent();
            logger.info(`🍪 Found cookie consent button: "${buttonText}"`);

            // Human-like interaction
            await element.hover();
            await this.page.waitForTimeout(200 + Math.random() * 300);
            await element.click();

            cookieHandled = true;
            logger.info('✅ Cookie consent handled successfully');
            break;
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      if (!cookieHandled) {
        logger.info('ℹ️ No cookie consent popup found or already handled');
      }

      // Wait after handling
      await this.page.waitForTimeout(2000);
    } catch (error) {
      logger.warn(`Cookie consent handling failed: ${error.message}`);
    }
  }

  async evaluateWatch(refNumber) {
    try {
      logger.info(`🔍 Starting watch evaluation for: ${refNumber}`);

      if (!this.page) {
        await this.initialize();
      }

      this.lastActivity = Date.now();

      // Navigate to valuation page
      logger.info('📍 Navigating to valuation page...');
      await this.page.goto('https://www.chrono24.com/info/valuation.htm', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Handle cookie consent
      await this.handleCookieConsent();

      // Take screenshot for debugging
      await this.page.screenshot({ path: 'playwright-valuation-debug.png', fullPage: true });
      logger.info('📸 Debug screenshot saved');

      // Enhanced page analysis
      const pageAnalysis = await this.page.evaluate(() => {
        // Find all possible search inputs
        const searchInputs = Array.from(
          document.querySelectorAll(
            'input[type="text"], input[type="search"], input[placeholder*="search"], input[placeholder*="reference"], input[placeholder*="model"], input[name*="search"], input[name*="product"], input[id*="search"], input[id*="product"]',
          ),
        );

        // Find all forms
        const forms = Array.from(document.querySelectorAll('form'));

        // Find all selects (for condition and delivery)
        const selects = Array.from(document.querySelectorAll('select'));

        return {
          url: window.location.href,
          title: document.title,
          searchInputs: searchInputs.map((input) => ({
            tagName: input.tagName,
            type: input.type,
            id: input.id,
            name: input.name,
            className: input.className,
            placeholder: input.placeholder,
            visible: input.offsetParent !== null,
            value: input.value,
          })),
          forms: forms.map((form, i) => ({
            index: i,
            id: form.id,
            className: form.className,
            action: form.action,
            method: form.method,
          })),
          selects: selects.map((select) => ({
            id: select.id,
            name: select.name,
            className: select.className,
            options: Array.from(select.options).map((opt) => ({
              value: opt.value,
              text: opt.text,
            })),
          })),
        };
      });

      logger.info('🔍 Page analysis:', JSON.stringify(pageAnalysis, null, 2));

      // Look for the actual search input - try multiple approaches
      let searchInput;
      const searchSelectors = [
        '#productSearch',
        'input[name="model"]',
        'input[placeholder*="Reference number"]',
        'input[placeholder*="reference"]',
        'input[placeholder*="model"]',
        'input[data-test="searchinput"]',
        '.wt-product-search-input',
      ];

      for (const selector of searchSelectors) {
        try {
          searchInput = this.page.locator(selector).first();
          if (await searchInput.isVisible({ timeout: 2000 })) {
            logger.info(`✅ Found search input with selector: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!searchInput || !(await searchInput.isVisible())) {
        throw new Error('Search input not found on valuation page');
      }

      // Fill the search input with human-like typing
      logger.info(`📝 Typing reference number: ${refNumber}`);
      await searchInput.click();
      await this.page.waitForTimeout(500);

      // Clear any existing value and type the reference number directly
      await searchInput.fill('');

      // Type the reference number character by character for better reliability
      logger.info(`� Typing reference number: ${refNumber}`);

      // Use slow typing to avoid detection and ensure accuracy
      for (let i = 0; i < refNumber.length; i++) {
        await searchInput.type(refNumber[i]);
        await this.page.waitForTimeout(50 + Math.random() * 100); // Random delay between characters
      }

      logger.info(`✅ Reference number typed: ${refNumber}`);

      // Wait for autocomplete dropdown
      logger.info('⏳ Waiting for search suggestions...');
      await this.page.waitForTimeout(2000);

      // Look for and click the first suggestion
      const suggestionSelectors = [
        '.productsearch-menu li:first-child',
        '.wt-product-search-result-list li:first-child',
        '[data-test="menu"] li:first-child',
        '.search-results li:first-child',
        '.dropdown-menu li:first-child',
      ];

      let suggestionClicked = false;
      for (const selector of suggestionSelectors) {
        try {
          const suggestion = this.page.locator(selector).first();
          if (await suggestion.isVisible({ timeout: 3000 })) {
            logger.info(`🎯 Clicking first suggestion with selector: ${selector}`);
            await suggestion.hover();
            await this.page.waitForTimeout(300);
            await suggestion.click();
            suggestionClicked = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!suggestionClicked) {
        logger.warn('⚠️ No suggestions found, continuing anyway');
      }

      // Wait for selection to process
      await this.page.waitForTimeout(2000);

      // Select condition: "Pre-owned" / "Used"
      logger.info('🔧 Selecting watch condition...');
      const conditionSelect = this.page.locator('#condition, select[name="condition"]').first();
      if (await conditionSelect.isVisible({ timeout: 5000 })) {
        await conditionSelect.selectOption({ value: 'Used' });
        logger.info('✅ Selected "Pre-owned" condition');
      }

      // Select scope of delivery: "Watch only"
      logger.info('📦 Selecting scope of delivery...');
      const deliverySelect = this.page.locator('#scopeOfDelivery, select[name="scopeOfDelivery"]').first();
      if (await deliverySelect.isVisible({ timeout: 5000 })) {
        await deliverySelect.selectOption({ value: 'WatchOnly' });
        logger.info('✅ Selected "Watch only" delivery scope');
      }

      // Submit the form
      logger.info('🚀 Submitting valuation form...');
      const submitButton = this.page
        .locator('#calculateStats, input[name="calculateStats"], button[type="submit"]')
        .first();
      if (await submitButton.isVisible({ timeout: 5000 })) {
        await submitButton.hover();
        await this.page.waitForTimeout(500);
        await submitButton.click();
        logger.info('✅ Form submitted');
      } else {
        throw new Error('Submit button not found');
      }

      // Wait for results page
      logger.info('⏳ Waiting for valuation results...');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);

      // Extract pricing information
      const pricingData = await this.page.evaluate(() => {
        // Look for the market value section
        const marketSection = document.querySelector('.market-value, [class*="market"], [class*="valuation"]');

        if (!marketSection) {
          return { error: 'Market value section not found' };
        }

        // Extract min, average, and max prices
        const priceElements = marketSection.querySelectorAll('[class*="price"], .h1, .h2');
        const prices = [];

        priceElements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.includes('$')) {
            // Extract number from price text like "$3,215" or "$2,886"
            const match = text.match(/\$[\d,]+/);
            if (match) {
              const price = parseInt(match[0].replace(/[$,]/g, ''));
              if (!isNaN(price)) {
                prices.push(price);
              }
            }
          }
        });

        // Try to find specific min/max/average elements using the actual HTML structure
        let minPrice = null,
          maxPrice = null,
          avgPrice = null;

        // Look for the value-range section which contains the structured pricing
        const valueRangeSection = marketSection.querySelector('.value-range, [class*="value-range"]');

        if (valueRangeSection) {
          // Extract min price from "text-left" div
          const minDiv = valueRangeSection.querySelector('.text-left, [class*="text-left"]');
          if (minDiv) {
            const minSpan = minDiv.querySelector('.h2, .h1, span');
            if (minSpan) {
              const minText = minSpan.textContent?.trim();
              const minMatch = minText?.match(/\$[\d,]+/);
              if (minMatch) {
                minPrice = parseInt(minMatch[0].replace(/[$,]/g, ''));
              }
            }
          }

          // Extract max price from "text-right" div
          const maxDiv = valueRangeSection.querySelector('.text-right, [class*="text-right"]');
          if (maxDiv) {
            const maxSpan = maxDiv.querySelector('.h2, .h1, span');
            if (maxSpan) {
              const maxText = maxSpan.textContent?.trim();
              const maxMatch = maxText?.match(/\$[\d,]+/);
              if (maxMatch) {
                maxPrice = parseInt(maxMatch[0].replace(/[$,]/g, ''));
              }
            }
          }

          // Extract average price from the middle div (no specific class, contains "Average")
          const allDivs = valueRangeSection.querySelectorAll('div');
          allDivs.forEach((div) => {
            const text = div.textContent?.toLowerCase();
            if (text && text.includes('average') && !avgPrice) {
              const avgSpan = div.querySelector('.h1, .h2, span');
              if (avgSpan) {
                const avgText = avgSpan.textContent?.trim();
                const avgMatch = avgText?.match(/\$[\d,]+/);
                if (avgMatch) {
                  avgPrice = parseInt(avgMatch[0].replace(/[$,]/g, ''));
                }
              }
            }
          });
        }

        // Fallback: if structured approach didn't work, try the old method
        if (!minPrice || !maxPrice || !avgPrice) {
          const allElements = Array.from(marketSection.querySelectorAll('*'));
          allElements.forEach((el) => {
            const text = el.textContent?.trim().toLowerCase();
            if (text && text.includes('$')) {
              const priceMatch = text.match(/\$[\d,]+/);
              if (priceMatch) {
                const price = parseInt(priceMatch[0].replace(/[$,]/g, ''));
                if (!isNaN(price)) {
                  if (text.includes('min') && !minPrice) {
                    minPrice = price;
                  } else if (text.includes('max') && !maxPrice) {
                    maxPrice = price;
                  } else if ((text.includes('average') || text.includes('avg')) && !avgPrice) {
                    avgPrice = price;
                  }
                }
              }
            }
          });
        }

        // If we couldn't find specific labels, try to infer from all prices
        if (!minPrice && !maxPrice && !avgPrice && prices.length >= 3) {
          prices.sort((a, b) => a - b);
          minPrice = prices[0];
          avgPrice = prices[Math.floor(prices.length / 2)];
          maxPrice = prices[prices.length - 1];
        }

        return {
          allPrices: prices,
          minPrice,
          maxPrice,
          avgPrice,
          rawHTML: marketSection.innerHTML,
        };
      });

      logger.info('💰 Extracted pricing data:', pricingData);

      // Log individual prices for debugging
      if (pricingData.minPrice) logger.info(`📊 MIN price: $${pricingData.minPrice}`);
      if (pricingData.maxPrice) logger.info(`📊 MAX price: $${pricingData.maxPrice}`);
      if (pricingData.avgPrice) logger.info(`📊 AVG price: $${pricingData.avgPrice}`);
      logger.info(
        `🔍 Extraction method: ${pricingData.minPrice && pricingData.maxPrice && pricingData.avgPrice ? 'Structured' : 'Fallback'}`,
      );

      if (pricingData.error || !pricingData.minPrice) {
        throw new Error(`Failed to extract pricing data: ${pricingData.error || 'No minimum price found'}`);
      }

      // Calculate target price (80% of minimum)
      const targetPrice = Math.round(pricingData.minPrice * 0.8);

      // Create evaluation result
      const result = {
        refNumber,
        minPrice: pricingData.minPrice,
        maxPrice: pricingData.maxPrice || pricingData.minPrice,
        avgPrice: pricingData.avgPrice || pricingData.minPrice,
        targetPrice,
        priceRange: {
          min: pricingData.minPrice,
          max: pricingData.maxPrice || pricingData.minPrice,
          spreadPercentage: pricingData.maxPrice
            ? Math.round(((pricingData.maxPrice - pricingData.minPrice) / pricingData.minPrice) * 100)
            : 0,
        },
        calculation: {
          multiplier: 0.8,
          basedOnMinPrice: pricingData.minPrice,
        },
        confidence: pricingData.allPrices.length >= 3 ? 'High' : pricingData.allPrices.length >= 2 ? 'Medium' : 'Low',
        timestamp: new Date().toISOString(),
      };

      logger.info('✅ Watch evaluation completed successfully');
      return result;
    } catch (error) {
      logger.error(`❌ Evaluation failed for ${refNumber}: ${error.message}`);
      throw error;
    }
  }

  async humanLikeType(element, text) {
    for (let i = 0; i < text.length; i++) {
      await element.type(text[i]);
      // Vary typing speed
      const delay = 80 + Math.random() * 120;
      await this.page.waitForTimeout(delay);
    }
  }

  async testConnection() {
    try {
      logger.info('🧪 Testing Playwright service connection...');

      // Initialize if not already done
      if (!this.browser) {
        await this.initialize();
      }

      // Simple test: navigate to Chrono24 homepage
      if (!this.page) {
        this.page = await this.context.newPage();
      }

      await this.page.goto('https://www.chrono24.com', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      const title = await this.page.title();

      logger.info(`✅ Connection test successful. Page title: ${title}`);

      return {
        status: 'connected',
        service: 'Playwright Chrono24 Service',
        pageTitle: title,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`❌ Connection test failed: ${error.message}`);
      throw new Error(`Service connection test failed: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('✅ Playwright resources cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error.message);
    }
  }

  async isSessionValid() {
    const timeSinceActivity = Date.now() - this.lastActivity;
    return this.page && !this.page.isClosed() && timeSinceActivity < 300000; // 5 minutes
  }
}

module.exports = new PlaywrightChrono24Service();
