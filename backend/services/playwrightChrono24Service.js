const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const logger = require('../utils/logger');
const priceCalculator = require('../utils/priceCalculator');

class PlaywrightChrono24Service {
  constructor() {
    // Remove instance variables - each evaluation uses fresh browser
  }

  async evaluateWatch(refNumber) {
    // Create fresh browser instance for each evaluation
    let browser = null;
    let context = null;
    let page = null;

    try {
      logger.info(`🔍 Starting fresh watch evaluation for: ${refNumber}`);

      // Initialize fresh browser for this evaluation
      logger.info('🎭 Initializing fresh Playwright browser...');

      browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production' || process.env.HEADLESS === 'true',
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
          // Additional headless stealth args
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-ipc-flooding-protection',
        ],
      });

      // Create a new context with realistic device emulation
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        geolocation: {
          latitude: 26.3683064,
          longitude: -80.1289321,
          accuracy: 100,
        },
        permissions: ['geolocation'],
        colorScheme: 'light',
        reducedMotion: 'no-preference',
        forcedColors: 'none',
        offline: false,
        screen: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
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
      page = await context.newPage();

      // Advanced stealth measures - Enhanced for headless mode
      await page.addInitScript(() => {
        // Remove webdriver property
        delete Object.getPrototypeOf(navigator).webdriver;

        // Override plugins and languages
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Enhanced headless detection countermeasures
        // Override webdriver property more thoroughly
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Mock chrome runtime for headless detection
        window.chrome = {
          runtime: {
            onConnect: undefined,
            onMessage: undefined,
          },
        };

        // Override screen properties to appear like real display
        Object.defineProperty(screen, 'availHeight', { value: 1040 });
        Object.defineProperty(screen, 'availWidth', { value: 1920 });
        Object.defineProperty(screen, 'colorDepth', { value: 24 });
        Object.defineProperty(screen, 'pixelDepth', { value: 24 });

        // Mock WebGL for headless detection resistance
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (type === 'webgl' || type === 'webgl2') {
            const context = originalGetContext.apply(this, [type, ...args]);
            if (context) {
              // Override WebGL vendor/renderer to appear like real GPU
              const originalGetParameter = context.getParameter;
              context.getParameter = function (parameter) {
                if (parameter === 37445) return 'Intel Inc.'; // VENDOR
                if (parameter === 37446) return 'Intel(R) UHD Graphics 630'; // RENDERER
                return originalGetParameter.apply(this, arguments);
              };
            }
            return context;
          }
          return originalGetContext.apply(this, [type, ...args]);
        };

        // Override permissions API
        if (navigator.permissions && navigator.permissions.query) {
          const originalQuery = navigator.permissions.query;
          navigator.permissions.query = (parameters) => {
            return parameters.name === 'notifications'
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery(parameters);
          };
        }

        // Add realistic mouse events to prevent detection
        let mouseX = 0,
          mouseY = 0;
        document.addEventListener('mousemove', (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        });

        // Override Date to prevent timezone fingerprinting consistency
        const originalDate = Date;
        Date = class extends originalDate {
          getTimezoneOffset() {
            return 300; // EST/EDT offset
          }
        };
      });
      logger.info('✅ Fresh browser initialized with Florida geolocation');

      // Navigate to valuation page
      logger.info('📍 Navigating to valuation page...');
      await page.goto('https://www.chrono24.com/info/valuation.htm', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Handle cookie consent with fresh detection
      await this.handleCookieConsentFresh(page);

      // Take screenshot for debugging
      await page.screenshot({ path: 'playwright-valuation-debug.png', fullPage: true });
      logger.info('📸 Debug screenshot saved');

      // Enhanced page analysis
      const pageAnalysis = await page.evaluate(() => {
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
            visible: input.offsetWidth > 0 && input.offsetHeight > 0,
            value: input.value,
          })),
          forms: forms.map((form, index) => ({
            index,
            id: form.id,
            className: form.className,
            action: form.action,
            method: form.method,
          })),
          selects: selects.map((select) => ({
            id: select.id,
            name: select.name,
            className: select.className,
            options: Array.from(select.options).map((option) => ({
              value: option.value,
              text: option.text,
            })),
          })),
        };
      });

      logger.info(`🔍 Page analysis: | META: "${JSON.stringify(pageAnalysis)}"`);

      // Try to find the search input
      let searchInput = null;
      const inputSelectors = [
        '#productSearch',
        'input[name="model"]',
        'input[placeholder*="Reference"]',
        'input[placeholder*="reference"]',
        'input[placeholder*="brand"]',
        'input[placeholder*="model"]',
        '.wt-product-search-input',
        '.form-control.p-r-5',
      ];

      for (const selector of inputSelectors) {
        try {
          searchInput = page.locator(selector).first();
          if (await searchInput.isVisible({ timeout: 2000 })) {
            logger.info(`✅ Found search input with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!searchInput || !(await searchInput.isVisible({ timeout: 5000 }))) {
        throw new Error('Could not find reference number search input field');
      }

      // Clear and fill the search input
      await searchInput.click();
      await page.waitForTimeout(500);

      // Clear any existing value and type the reference number directly
      await searchInput.fill('');

      // Type the reference number character by character for better reliability
      logger.info(`📝 Typing reference number: ${refNumber}`);

      // Use slow typing to avoid detection and ensure accuracy
      for (let i = 0; i < refNumber.length; i++) {
        await searchInput.type(refNumber[i]);
        await page.waitForTimeout(50 + Math.random() * 100); // Random delay between characters
      }

      logger.info(`✅ Reference number typed: ${refNumber}`);

      // Wait for autocomplete dropdown
      logger.info('⏳ Waiting for search suggestions...');
      await page.waitForTimeout(2000);

      // Look for and click the first suggestion
      const suggestionSelectors = [
        '.productsearch-menu li:first-child',
        '.wt-product-search-result-list li:first-child',
        '[data-test="menu"] li:first-child',
        '.search-results li:first-child',
        '.dropdown-menu li:first-child',
      ];

      for (const selector of suggestionSelectors) {
        try {
          const suggestion = page.locator(selector).first();
          if (await suggestion.isVisible({ timeout: 2000 })) {
            logger.info(`🎯 Clicking first suggestion with selector: ${selector}`);
            await suggestion.click();
            await page.waitForTimeout(300);
            break;
          }
        } catch (error) {
          // Try next selector
          continue;
        }
      }

      // Wait for page to process selection
      await page.waitForTimeout(2000);

      // Select watch condition
      logger.info('🔧 Selecting watch condition...');
      const conditionSelect = page.locator('#condition, select[name="condition"]').first();
      await conditionSelect.selectOption('Used');
      logger.info('✅ Selected "Pre-owned" condition');

      // Select scope of delivery
      logger.info('📦 Selecting scope of delivery...');
      const deliverySelect = page.locator('#scopeOfDelivery, select[name="scopeOfDelivery"]').first();
      await deliverySelect.selectOption('WatchOnly');
      logger.info('✅ Selected "Watch only" delivery scope');

      // Submit the form
      logger.info('🚀 Submitting valuation form...');
      const submitButton = page.locator('#calculateStats, input[name="calculateStats"], button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 5000 })) {
        await submitButton.hover();
        await page.waitForTimeout(500);
        await submitButton.click();
        logger.info('✅ Form submitted');
      } else {
        throw new Error('Submit button not found');
      }

      // Wait for results page
      logger.info('⏳ Waiting for valuation results...');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Extract pricing information
      const pricingData = await page.evaluate(() => {
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
    } finally {
      // Always clean up browser resources
      try {
        if (page) {
          await page.close();
        }
        if (context) {
          await context.close();
        }
        if (browser) {
          await browser.close();
        }
        logger.info('✅ Fresh browser resources cleaned up');
      } catch (cleanupError) {
        logger.error('Error during cleanup:', cleanupError.message);
      }
    }
  }

  async handleCookieConsentFresh(page) {
    try {
      logger.info('🍪 Looking for cookie consent popup...');
      await page.waitForTimeout(2000);

      // More comprehensive cookie consent selectors
      const consentSelectors = [
        'button:has-text("OK")',
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("Allow all")',
        'button:has-text("I agree")',
        'button[id*="accept"]',
        'button[class*="accept"]',
        'button[data-test*="accept"]',
        'button[data-testid*="accept"]',
        '.cookie-consent button',
        '.cookie-banner button',
        '.privacy-banner button',
        '#cookie-consent button',
        '[data-cookie-consent] button',
      ];

      for (const selector of consentSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            const buttonText = await element.textContent();
            logger.info(`🍪 Found cookie consent button: "${buttonText?.trim()}"`);

            await element.hover();
            await page.waitForTimeout(200 + Math.random() * 300);
            await element.click();

            logger.info('✅ Cookie consent handled successfully');

            // Wait for popup to disappear
            await page.waitForTimeout(2000);
            return;
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      logger.info('ℹ️ No cookie consent popup found or already handled');
    } catch (error) {
      logger.warn(`⚠️ Cookie consent handling failed: ${error.message}`);
      // Don't throw error, continue with evaluation
    }
  }

  async testConnection() {
    let browser = null;
    let context = null;
    let page = null;

    try {
      logger.info('🧪 Testing fresh Playwright service connection...');

      // Initialize fresh browser for test
      browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production' || process.env.HEADLESS === 'true',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      context = await browser.newContext();
      page = await context.newPage();

      await page.goto('https://www.chrono24.com', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      const title = await page.title();

      logger.info(`✅ Connection test successful. Page title: ${title}`);

      return {
        status: 'connected',
        service: 'Fresh Playwright Chrono24 Service',
        pageTitle: title,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`❌ Connection test failed: ${error.message}`);
      throw new Error(`Service connection test failed: ${error.message}`);
    } finally {
      // Clean up test resources
      try {
        if (page) await page.close();
        if (context) await context.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        logger.error('Error during test cleanup:', cleanupError.message);
      }
    }
  }

  // Legacy cleanup method for compatibility
  async cleanup() {
    logger.info('ℹ️ Using fresh browser approach - no persistent resources to clean up');
  }
}

module.exports = new PlaywrightChrono24Service();
