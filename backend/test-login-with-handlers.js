const chrono24Service = require('./services/chrono24Service');
const logger = require('./utils/logger');

async function testLoginWithHandlers() {
  try {
    logger.info('Starting login test with cookie consent and CAPTCHA handlers...');

    // Initialize the service
    await chrono24Service.initialize();

    // Test the login process
    const loginSuccess = await chrono24Service.ensureLoggedIn();

    if (loginSuccess) {
      logger.info('✅ Login successful!');

      // Take a screenshot after successful login
      await chrono24Service.page.screenshot({
        path: 'login-success.png',
        fullPage: true,
      });
      logger.info('Screenshot saved as login-success.png');

      // Check final URL
      const finalUrl = chrono24Service.page.url();
      logger.info(`Final URL after login: ${finalUrl}`);

      // Check page title
      const title = await chrono24Service.page.title();
      logger.info(`Page title: ${title}`);
    } else {
      logger.error('❌ Login failed');

      // Take a screenshot of the failure
      await chrono24Service.page.screenshot({
        path: 'login-failed.png',
        fullPage: true,
      });
      logger.info('Screenshot saved as login-failed.png');
    }
  } catch (error) {
    logger.error('Test failed:', error);

    // Take a screenshot of the error state
    try {
      await chrono24Service.page.screenshot({
        path: 'login-error.png',
        fullPage: true,
      });
      logger.info('Error screenshot saved as login-error.png');
    } catch (e) {
      logger.error('Could not take error screenshot:', e.message);
    }
  } finally {
    // Cleanup
    await chrono24Service.cleanup();
    logger.info('Test completed');
  }
}

// Run the test
testLoginWithHandlers().catch(console.error);
