require('dotenv').config();

async function simpleTest() {
  console.log('Starting simple test...');

  try {
    const service = require('./services/chrono24Service');
    console.log('Service required successfully');

    // Reset login state
    service.isLoggedIn = false;
    service.lastActivity = 0;

    console.log('Initializing service...');
    await service.initialize();
    console.log('Service initialized');

    console.log('Testing login...');
    const result = await service.ensureLoggedIn();
    console.log('Login result:', result);

    await service.cleanup();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

simpleTest();
