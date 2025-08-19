require('dotenv').config();
const service = require('./services/chrono24Service');

async function testLogin() {
  let service;
  try {
    console.log('Testing login with environment variables...');
    console.log('CHRONO24_EMAIL:', process.env.CHRONO24_EMAIL ? 'SET' : 'NOT SET');
    console.log('CHRONO24_PASSWORD:', process.env.CHRONO24_PASSWORD ? 'SET' : 'NOT SET');

    service = require('./services/chrono24Service');

    // Force a fresh start by clearing any cached login state
    service.isLoggedIn = false;
    service.lastActivity = 0;

    await service.init();
    console.log('Service initialized successfully');

    const result = await service.ensureLoggedIn();

    if (result) {
      console.log('SUCCESS: Login completed successfully');
    } else {
      console.log('ERROR: Login failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    if (service) {
      await service.cleanup();
    }
  }
}

testLogin();
