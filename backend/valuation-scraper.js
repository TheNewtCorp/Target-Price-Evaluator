const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function getWatchValuation(referenceNumber) {
  console.log(`🔍 Getting valuation for reference: ${referenceNumber}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    // Enhanced geolocation spoofing for Florida/Boca Raton
    await page.evaluateOnNewDocument(() => {
      // Spoof geolocation to Boca Raton, Florida
      const mockGeolocation = {
        getCurrentPosition: (success) => {
          success({
            coords: {
              latitude: 26.3683064,
              longitude: -80.1289321,
              accuracy: 100,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        },
        watchPosition: (success) => {
          success({
            coords: {
              latitude: 26.3683064,
              longitude: -80.1289321,
              accuracy: 100,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        },
        clearWatch: () => {},
      };

      Object.defineProperty(navigator, 'geolocation', {
        get: () => mockGeolocation,
        configurable: true,
      });

      // Spoof timezone to Eastern Time (Florida)
      const originalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function (...args) {
        if (args.length === 0 || !args[0]) {
          return new originalDateTimeFormat('en-US', { timeZone: 'America/New_York' });
        }
        return new originalDateTimeFormat(...args);
      };

      // Override Date methods to return Florida timezone
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function () {
        return 300; // EST offset (UTC-5)
      };

      // Spoof resolved options for timezone
      if (Intl.DateTimeFormat.prototype.resolvedOptions) {
        const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function () {
          const options = originalResolvedOptions.call(this);
          options.timeZone = 'America/New_York';
          return options;
        };
      }

      console.log('🌴 Florida geolocation spoofing activated');
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    // Step 1: Navigate to valuation page
    console.log('🌐 Navigating to valuation page...');
    await page.goto('https://www.chrono24.com/info/valuation.htm', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('📍 Current URL:', page.url());

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test geolocation spoofing
    console.log('🌴 Testing Florida geolocation spoofing...');
    const locationTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                success: true,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
            },
            (error) => {
              resolve({
                success: false,
                error: error.message,
              });
            },
          );
        } else {
          resolve({ success: false, error: 'Geolocation not available' });
        }
      });
    });

    console.log('📍 Geolocation test result:', locationTest);

    // Step 2: Handle cookie consent popup
    console.log('🍪 Looking for cookie consent popup...');
    try {
      // Look for common cookie consent selectors
      const cookieSelectors = [
        'button:contains("Accept")',
        'button:contains("OK")',
        'button:contains("Agree")',
        'button:contains("Continue")',
        '[id*="cookie"] button',
        '[class*="cookie"] button',
        '[class*="consent"] button',
        '.js-cookie-consent-accept',
        '#cookie-consent button',
        '[data-testid="cookie-banner"] button',
      ];

      let cookieHandled = false;
      for (const selector of cookieSelectors) {
        try {
          if (selector.includes(':contains')) {
            // Handle text-based selectors
            const text = selector.match(/contains\("(.+)"\)/)[1];
            const buttons = await page.$$('button');
            for (const button of buttons) {
              const buttonText = await page.evaluate((el) => el.textContent?.trim().toLowerCase(), button);
              if (buttonText && buttonText.includes(text.toLowerCase())) {
                console.log(`🍪 Found cookie consent button with text: "${buttonText}"`);
                await button.click();
                cookieHandled = true;
                console.log('✅ Clicked cookie consent button');
                break;
              }
            }
          } else {
            // Handle CSS selectors
            const element = await page.$(selector);
            if (element) {
              console.log(`🍪 Found cookie consent element: ${selector}`);
              await element.click();
              cookieHandled = true;
              console.log('✅ Clicked cookie consent element');
              break;
            }
          }
        } catch (error) {
          // Continue to next selector
        }

        if (cookieHandled) break;
      }

      if (!cookieHandled) {
        console.log('🍪 No cookie consent popup found or already handled');
      }

      // Wait a bit after handling cookie consent
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log('🍪 Cookie consent handling skipped:', error.message);
    }

    // Step 3: Find and fill the product search input
    console.log('🔍 Looking for product search input...');
    const searchInput = await page.$('#productSearch');
    if (!searchInput) {
      throw new Error('Product search input not found');
    }

    console.log(`✍️ Typing reference number: ${referenceNumber}`);
    await searchInput.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Type with realistic human timing
    for (let i = 0; i < referenceNumber.length; i++) {
      await page.keyboard.type(referenceNumber[i]);
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));
    }

    console.log('✅ Reference number typed');

    // Step 4: Wait for dropdown suggestions and select first option
    console.log('⏳ Waiting for product suggestions...');
    try {
      await page.waitForSelector('.wt-product-search-result-list li[role="listitem"]', {
        timeout: 10000,
        visible: true,
      });

      console.log('📋 Product suggestions appeared');

      // Wait a bit to ensure all options are loaded
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Click the first suggestion
      const firstOption = await page.$('.wt-product-search-result-list li[role="listitem"]:first-child');
      if (firstOption) {
        console.log('🎯 Selecting first product option...');
        await firstOption.click();
        console.log('✅ First product option selected');

        // Wait for selection to be processed
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw new Error('No product suggestions found');
      }
    } catch (error) {
      console.log('❌ Error with product suggestions:', error.message);

      // Take screenshot for debugging
      await page.screenshot({ path: './logs/valuation-search-error.png', fullPage: true });
      console.log('📸 Search error screenshot saved');

      throw error;
    }

    // Step 5: Verify selection was made (check if search input is populated)
    console.log('🔍 Verifying product selection...');
    const selectedValue = await page.evaluate(() => {
      const input = document.querySelector('#productSearch');
      return input ? input.value : '';
    });

    console.log('📝 Selected product:', selectedValue);

    if (!selectedValue) {
      console.log('⚠️ Warning: Product selection might not have been successful');
    }

    // Step 6: Select watch condition (Pre-owned)
    console.log('🔧 Setting watch condition to Pre-owned...');
    const conditionSelect = await page.$('#condition');
    if (conditionSelect) {
      await conditionSelect.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await conditionSelect.select('Used');
      console.log('✅ Watch condition set to Pre-owned');
    } else {
      console.log('⚠️ Watch condition dropdown not found');
    }

    // Step 7: Select scope of delivery (Watch only)
    console.log('📦 Setting scope of delivery to Watch only...');
    const scopeSelect = await page.$('#scopeOfDelivery');
    if (scopeSelect) {
      await scopeSelect.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await scopeSelect.select('WatchOnly');
      console.log('✅ Scope of delivery set to Watch only');
    } else {
      console.log('⚠️ Scope of delivery dropdown not found');
    }

    // Step 8: Click the appraisal button
    console.log('🚀 Clicking appraisal button...');
    const appraisalButton = await page.$('#calculateStats');
    if (appraisalButton) {
      await appraisalButton.click();
      console.log('✅ Appraisal button clicked');

      // Wait for results page to load
      console.log('⏳ Waiting for valuation results...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    } else {
      throw new Error('Appraisal button not found');
    }

    // Step 9: Extract valuation data from results
    console.log('📊 Extracting valuation data...');

    const valuationData = await page.evaluate(() => {
      const results = {
        currentMarketValue: null,
        minValue: null,
        maxValue: null,
        averagePrice: null,
        priceRange: null,
        watchModel: null,
        condition: null,
        scopeOfDelivery: null,
      };

      try {
        // Extract watch details
        const detailsText = document.querySelector('.text-lg.m-b-5');
        if (detailsText) {
          results.watchModel = detailsText.textContent.trim();
        }

        // Extract minimum value
        const minElement = document.querySelector('.value-range .text-left .h2');
        if (minElement) {
          const minText = minElement.textContent.replace(/[^0-9,]/g, '').replace(/,/g, '');
          results.minValue = parseInt(minText) || null;
        }

        // Extract maximum value
        const maxElement = document.querySelector('.value-range .text-right .h2');
        if (maxElement) {
          const maxText = maxElement.textContent.replace(/[^0-9,]/g, '').replace(/,/g, '');
          results.maxValue = parseInt(maxText) || null;
        }

        // Extract average/current market value
        const avgElement = document.querySelector(
          '.value-range div:not(.text-left):not(.text-right) .h1, .price.text-xlg',
        );
        if (avgElement) {
          const avgText = avgElement.textContent.replace(/[^0-9,]/g, '').replace(/,/g, '');
          results.averagePrice = parseInt(avgText) || null;
          results.currentMarketValue = results.averagePrice;
        }

        // Extract price range text
        const priceRangeElement = document.querySelector('.price-range');
        if (priceRangeElement) {
          results.priceRange = priceRangeElement.textContent.trim();
        }

        console.log('📋 Extracted valuation data:', results);
        return results;
      } catch (error) {
        console.error('Error extracting valuation data:', error);
        return results;
      }
    });

    console.log('\n📊 VALUATION RESULTS:');
    console.log('=====================');
    console.log('Watch Model:', valuationData.watchModel);
    console.log(
      'Current Market Value:',
      valuationData.currentMarketValue ? `$${valuationData.currentMarketValue.toLocaleString()}` : 'N/A',
    );
    console.log('Price Range:', valuationData.priceRange || 'N/A');
    console.log('Min Value:', valuationData.minValue ? `$${valuationData.minValue.toLocaleString()}` : 'N/A');
    console.log('Max Value:', valuationData.maxValue ? `$${valuationData.maxValue.toLocaleString()}` : 'N/A');

    // Step 10: Calculate 80% of minimum value for user
    let calculatedValue = null;
    if (valuationData.minValue) {
      calculatedValue = Math.round(valuationData.minValue * 0.8);
      console.log('\n💰 CALCULATED OFFER VALUE (80% of Min):');
      console.log('==========================================');
      console.log(`$${calculatedValue.toLocaleString()}`);
    } else {
      console.log('\n⚠️ Could not calculate offer value - no minimum price found');
    }

    // Take screenshot of results
    await page.screenshot({ path: './logs/valuation-results.png', fullPage: true });
    console.log('📸 Results screenshot saved to ./logs/valuation-results.png');

    console.log('\n🔍 Browser staying open for inspection. Press any key to close...');
    await new Promise((resolve) => process.stdin.once('data', resolve));

    return {
      ...valuationData,
      calculatedOfferValue: calculatedValue,
      success: true,
    };
  } catch (error) {
    console.error('❌ Error during valuation process:', error.message);

    // Take error screenshot
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: './logs/valuation-error.png', fullPage: true });
        console.log('📸 Error screenshot saved to ./logs/valuation-error.png');
      }
    }

    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test with example reference number
const testReferenceNumber = process.argv[2] || '326.30.40.50.06.001';
console.log(`🧪 Testing valuation scraper with reference: ${testReferenceNumber}`);
getWatchValuation(testReferenceNumber).catch(console.error);
