const puppeteer = require('puppeteer');
require('dotenv').config();

async function testChrome() {
  console.log('Testing Chrome executable path...');
  console.log('CHROME_EXECUTABLE_PATH:', process.env.CHROME_EXECUTABLE_PATH);

  try {
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (process.env.CHROME_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
      console.log('Using custom Chrome path:', launchOptions.executablePath);
    }

    console.log('Launching browser...');
    const browser = await puppeteer.launch(launchOptions);
    console.log('✅ Browser launched successfully!');

    const page = await browser.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('✅ Page loaded successfully! Title:', title);

    await browser.close();
    console.log('✅ Browser closed successfully!');
    console.log('🎉 Chrome is working correctly!');
  } catch (error) {
    console.error('❌ Chrome test failed:', error.message);
  }
}

testChrome();
