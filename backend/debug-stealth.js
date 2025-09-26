const { chromium } = require('playwright');

async function debugStealth() {
  console.log('🔧 Debug: Testing stealth script application...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Apply stealth directly with page.evaluate AFTER page loads
  await page.goto('about:blank');

  console.log('📋 Testing BEFORE stealth application...');
  const beforeStealth = await page.evaluate(() => {
    return {
      chrome_runtime: !!(window.chrome && window.chrome.runtime),
      chrome_loadTimes: !!(window.chrome && window.chrome.loadTimes),
      chrome_csi: !!(window.chrome && window.chrome.csi),
      chrome_app: !!(window.chrome && window.chrome.app),
      plugins_count: navigator.plugins.length,
      first_plugin: navigator.plugins[0]?.name || 'Empty',
      user_agent: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Not found',
    };
  });

  console.log('BEFORE:', beforeStealth);

  // Apply stealth with page.evaluate
  await page.evaluate(() => {
    console.log('🔧 Applying stealth measures...');

    // 1. Fix Chrome object
    Object.defineProperty(window, 'chrome', {
      writable: true,
      enumerable: true,
      configurable: true,
      value: {
        loadTimes: function () {
          return {
            connectionInfo: 'http/1.1',
            finishDocumentLoadTime: Date.now() / 1000,
            finishLoadTime: Date.now() / 1000,
          };
        },
        csi: function () {
          return {
            pageT: Date.now(),
            startE: Date.now() - 1000,
          };
        },
        app: {},
        // No runtime property = runtime_present should be false
      },
    });

    // 2. Fix plugins
    const fakePlugins = [
      { name: 'PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
    ];
    fakePlugins.length = 2;

    Object.defineProperty(navigator, 'plugins', {
      get: () => fakePlugins,
      enumerable: true,
      configurable: true,
    });

    // 3. Fix user agent
    Object.defineProperty(navigator, 'userAgent', {
      get: () =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    });

    console.log('✅ Stealth measures applied');
  });

  console.log('\n📋 Testing AFTER stealth application...');
  const afterStealth = await page.evaluate(() => {
    return {
      chrome_runtime: !!(window.chrome && window.chrome.runtime),
      chrome_loadTimes: !!(window.chrome && window.chrome.loadTimes),
      chrome_csi: !!(window.chrome && window.chrome.csi),
      chrome_app: !!(window.chrome && window.chrome.app),
      plugins_count: navigator.plugins.length,
      first_plugin: navigator.plugins[0]?.name || 'Empty',
      user_agent: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Not found',
    };
  });

  console.log('AFTER:', afterStealth);

  console.log('\n📊 COMPARISON:');
  console.log('==============');
  console.log(
    `Chrome Runtime: ${beforeStealth.chrome_runtime} → ${afterStealth.chrome_runtime} ${afterStealth.chrome_runtime === false ? '✅' : '❌'}`,
  );
  console.log(
    `Chrome LoadTimes: ${beforeStealth.chrome_loadTimes} → ${afterStealth.chrome_loadTimes} ${afterStealth.chrome_loadTimes === true ? '✅' : '❌'}`,
  );
  console.log(
    `Chrome CSI: ${beforeStealth.chrome_csi} → ${afterStealth.chrome_csi} ${afterStealth.chrome_csi === true ? '✅' : '❌'}`,
  );
  console.log(
    `Chrome App: ${beforeStealth.chrome_app} → ${afterStealth.chrome_app} ${afterStealth.chrome_app === true ? '✅' : '❌'}`,
  );
  console.log(
    `First Plugin: "${beforeStealth.first_plugin}" → "${afterStealth.first_plugin}" ${afterStealth.first_plugin !== 'Empty' ? '✅' : '❌'}`,
  );
  console.log(
    `Chrome Version: ${beforeStealth.user_agent} → ${afterStealth.user_agent} ${afterStealth.user_agent === '140' ? '✅' : '❌'}`,
  );

  await browser.close();
}

debugStealth().catch(console.error);
