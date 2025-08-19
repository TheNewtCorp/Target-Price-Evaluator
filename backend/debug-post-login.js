require('dotenv').config();

const chrono24Service = require('./services/chrono24Service');
const logger = require('./utils/logger');

async function debugPostLogin() {
  try {
    console.log('Starting post-login debug...');

    // Initialize service
    await chrono24Service.initialize();

    // Navigate to collection page
    const collectionUrl =
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection';
    await chrono24Service.page.goto(collectionUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Current URL after collection navigation:', chrono24Service.page.url());

    // Fill out login form
    await chrono24Service.page.type('#email', process.env.CHRONO24_EMAIL.toString());
    await chrono24Service.page.type('#password', process.env.CHRONO24_PASSWORD.toString());
    await chrono24Service.page.click('#userLogInPermanently');

    // Take screenshot before login
    await chrono24Service.page.screenshot({ path: 'before-login-debug.png' });

    // Click login and monitor navigation
    const navigationPromise = chrono24Service.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    await chrono24Service.page.click('.js-login-button');

    console.log('Waiting for navigation after login...');
    try {
      await navigationPromise;
      console.log('Navigation completed');
    } catch (e) {
      console.log('Navigation timeout or error:', e.message);
    }

    // Wait a bit more and check multiple times
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const currentUrl = chrono24Service.page.url();
      console.log(`URL check ${i + 1}: ${currentUrl}`);

      // Take screenshot
      await chrono24Service.page.screenshot({ path: `after-login-debug-${i + 1}.png` });

      // Check if we have user indicators
      try {
        const userLink = await chrono24Service.page.$('a[href*="/user/"]');
        console.log(`User link found (${i + 1}):`, !!userLink);
      } catch (e) {
        console.log(`User link check error (${i + 1}):`, e.message);
      }

      // Check page content for debugging
      const pageContent = await chrono24Service.page.content();
      console.log(`Page title (${i + 1}):`, await chrono24Service.page.title());
    }
  } catch (error) {
    console.error('Debug failed:', error.message);
    console.error(error.stack);
  } finally {
    await chrono24Service.cleanup();
  }
}

debugPostLogin();
