const chrono24Service = require('./services/chrono24Service');
const logger = require('./utils/logger');

async function debugCaptchaDetection() {
  try {
    logger.info('Starting comprehensive CAPTCHA detection test...');

    // Initialize the service
    await chrono24Service.initialize();

    // Navigate to login page directly
    await chrono24Service.page.goto('https://www.chrono24.com/auth/login.htm', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Take screenshot before any interaction
    await chrono24Service.page.screenshot({
      path: 'captcha-before-login.png',
      fullPage: true,
    });

    // Fill in the form
    await chrono24Service.page.type('#email', 'nlcordeiro90@gmail.com');
    await chrono24Service.page.type('#password', 'Nn04121996$$');

    // Take screenshot after filling form
    await chrono24Service.page.screenshot({
      path: 'captcha-after-filling.png',
      fullPage: true,
    });

    // Check for all possible CAPTCHA elements before clicking
    const captchaElements = await chrono24Service.page.evaluate(() => {
      const selectors = [
        'iframe[src*="challenges.cloudflare.com"]',
        'iframe[src*="turnstile"]',
        '.cf-turnstile',
        '[data-sitekey]',
        '.captcha',
        '.recaptcha',
        '.hcaptcha',
        '[id*="captcha"]',
        '[class*="captcha"]',
        'div[data-callback]',
      ];

      const found = [];
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          found.push({
            selector: selector,
            count: elements.length,
            visible: Array.from(elements).map((el) => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }),
          });
        }
      });

      return found;
    });

    logger.info('CAPTCHA elements found before clicking:', JSON.stringify(captchaElements, null, 2));

    // Click the login button
    await chrono24Service.page.click('.js-login-button');

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Take screenshot after clicking
    await chrono24Service.page.screenshot({
      path: 'captcha-after-clicking.png',
      fullPage: true,
    });

    // Check for CAPTCHA elements again after clicking
    const captchaElementsAfter = await chrono24Service.page.evaluate(() => {
      const selectors = [
        'iframe[src*="challenges.cloudflare.com"]',
        'iframe[src*="turnstile"]',
        '.cf-turnstile',
        '[data-sitekey]',
        '.captcha',
        '.recaptcha',
        '.hcaptcha',
        '[id*="captcha"]',
        '[class*="captcha"]',
        'div[data-callback]',
      ];

      const found = [];
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          found.push({
            selector: selector,
            count: elements.length,
            visible: Array.from(elements).map((el) => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }),
          });
        }
      });

      return found;
    });

    logger.info('CAPTCHA elements found after clicking:', JSON.stringify(captchaElementsAfter, null, 2));

    // Check for error messages
    const errors = await chrono24Service.page.evaluate(() => {
      const errorSelectors = [
        '.alert-error',
        '.error-message',
        '.js-error',
        '.alert-danger',
        '.captcha-error',
        '.js-captcha-error',
        '.error',
        '.warning',
        '.validation-error',
      ];

      const foundErrors = [];
      errorSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.textContent.trim()) {
            foundErrors.push({
              selector: selector,
              text: el.textContent.trim(),
              visible: el.offsetParent !== null,
            });
          }
        });
      });

      return foundErrors;
    });

    logger.info('Error messages found:', JSON.stringify(errors, null, 2));

    // Get page source snippet around potential CAPTCHA areas
    const pageContent = await chrono24Service.page.content();
    const captchaKeywords = ['captcha', 'turnstile', 'cloudflare', 'challenge', 'verify'];
    captchaKeywords.forEach((keyword) => {
      const index = pageContent.toLowerCase().indexOf(keyword);
      if (index !== -1) {
        const snippet = pageContent.substring(Math.max(0, index - 200), index + 200);
        logger.info(`Found '${keyword}' in page content:`, snippet);
      }
    });
  } catch (error) {
    logger.error('Debug test failed:', error);
  } finally {
    // Cleanup
    await chrono24Service.cleanup();
    logger.info('Debug test completed');
  }
}

// Run the debug test
debugCaptchaDetection().catch(console.error);
