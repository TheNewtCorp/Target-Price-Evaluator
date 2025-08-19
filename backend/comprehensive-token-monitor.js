const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function comprehensiveTokenMonitoring() {
  console.log('🔍 Starting comprehensive token monitoring...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    );

    // Enhanced network monitoring
    await page.setRequestInterception(true);

    const networkLog = [];

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const postData = request.postData();

      networkLog.push({
        type: 'REQUEST',
        timestamp: new Date().toISOString(),
        method: method,
        url: url,
        postData: postData ? postData.substring(0, 200) + '...' : null,
        headers: request.headers(),
      });

      console.log(`📡 REQUEST: ${method} ${url}`);
      if (postData) {
        console.log(`   POST Data: ${postData.substring(0, 200)}...`);
      }

      request.continue();
    });

    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();

      try {
        const responseText = await response.text();
        networkLog.push({
          type: 'RESPONSE',
          timestamp: new Date().toISOString(),
          status: status,
          url: url,
          body: responseText.substring(0, 500) + '...',
          headers: response.headers(),
        });

        console.log(`📥 RESPONSE: ${status} ${url}`);
        if (responseText && responseText.includes('challengeToken')) {
          console.log(`🎯 RESPONSE CONTAINS challengeToken: ${responseText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`📥 RESPONSE: ${status} ${url} (binary or error reading)`);
      }
    });

    console.log('🔗 Navigating to collection page...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('📍 Current URL:', page.url());

    // Inject comprehensive monitoring script
    await page.evaluateOnNewDocument(() => {
      // Monitor all possible token changes
      window.tokenMonitor = {
        log: [],
        addLog: function (message) {
          const timestamp = new Date().toISOString();
          this.log.push(`[${timestamp}] ${message}`);
          console.log(`🔍 TOKEN MONITOR: ${message}`);
        },
      };

      // Override fetch to monitor all requests
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        window.tokenMonitor.addLog(`FETCH called with: ${args[0]}`);
        return originalFetch.apply(this, args).then((response) => {
          window.tokenMonitor.addLog(`FETCH response: ${response.status} ${response.url}`);
          return response;
        });
      };

      // Override XMLHttpRequest
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () {
        const xhr = new originalXHR();
        const originalSend = xhr.send;
        const originalOpen = xhr.open;

        xhr.open = function (method, url) {
          window.tokenMonitor.addLog(`XHR opened: ${method} ${url}`);
          return originalOpen.apply(this, arguments);
        };

        xhr.send = function (data) {
          window.tokenMonitor.addLog(`XHR sent with data: ${data ? data.toString().substring(0, 200) : 'null'}`);
          return originalSend.apply(this, arguments);
        };

        return xhr;
      };
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Inject token monitoring after page load
    await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"]');
      if (tokenField) {
        window.tokenMonitor.addLog(
          `Found challengeToken field, initial value: "${tokenField.value}" (${tokenField.value.length} chars)`,
        );

        // Monitor attribute changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              window.tokenMonitor.addLog(`challengeToken ATTRIBUTE changed to: ${tokenField.value.length} characters`);
            }
          });
        });
        observer.observe(tokenField, { attributes: true, attributeFilter: ['value'] });

        // Monitor property changes
        let currentValue = tokenField.value;
        Object.defineProperty(tokenField, 'value', {
          get: function () {
            return this._monitoredValue !== undefined ? this._monitoredValue : currentValue;
          },
          set: function (val) {
            window.tokenMonitor.addLog(`challengeToken PROPERTY set to: "${val}" (${val ? val.length : 0} chars)`);
            this._monitoredValue = val;
            currentValue = val;
            this.setAttribute('value', val);
          },
        });

        // Monitor direct attribute changes
        setInterval(() => {
          const currentAttrValue = tokenField.getAttribute('value') || '';
          const currentPropValue = tokenField._monitoredValue || currentValue || '';
          if (currentAttrValue !== currentPropValue || currentAttrValue.length > 0) {
            window.tokenMonitor.addLog(
              `Token check - Attr: ${currentAttrValue.length} chars, Prop: ${currentPropValue.length} chars`,
            );
          }
        }, 1000);

        window.challengeTokenElement = tokenField;
      } else {
        window.tokenMonitor.addLog('challengeToken field NOT FOUND');
      }
    });

    console.log('👀 Waiting for popup or user interaction...');
    console.log('💡 Please interact with the page (click popup, etc.) and I will monitor token changes');

    // Monitor for 60 seconds
    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check token status every 5 seconds
      if (i % 5 === 0) {
        const tokenStatus = await page.evaluate(() => {
          const tokenField = document.querySelector('input[name="challengeToken"]');
          return {
            exists: !!tokenField,
            value: tokenField ? tokenField.value : 'NOT FOUND',
            length: tokenField ? tokenField.value.length : 0,
            attribute: tokenField ? tokenField.getAttribute('value') : 'NOT FOUND',
          };
        });

        console.log(`⏱️  ${i}s - Token status:`, tokenStatus);

        // Get monitoring logs
        const logs = await page.evaluate(() => {
          return window.tokenMonitor ? window.tokenMonitor.log : [];
        });

        if (logs.length > 0) {
          console.log('📋 Recent monitoring logs:');
          logs.slice(-5).forEach((log) => console.log(`   ${log}`));
        }
      }
    }

    // Final analysis
    console.log('\n📊 FINAL ANALYSIS:');
    const finalLogs = await page.evaluate(() => {
      return window.tokenMonitor ? window.tokenMonitor.log : [];
    });

    console.log('📋 All monitoring logs:');
    finalLogs.forEach((log) => console.log(`   ${log}`));

    console.log('\n📡 Network activity summary:');
    console.log(`Total requests: ${networkLog.filter((l) => l.type === 'REQUEST').length}`);
    console.log(`Total responses: ${networkLog.filter((l) => l.type === 'RESPONSE').length}`);

    // Show challengeToken-related network activity
    const tokenRelated = networkLog.filter(
      (l) =>
        l.url &&
        (l.url.includes('challenge') ||
          l.url.includes('token') ||
          (l.postData && l.postData.includes('challengeToken')) ||
          (l.body && l.body.includes('challengeToken'))),
    );

    if (tokenRelated.length > 0) {
      console.log('\n🎯 Token-related network activity:');
      tokenRelated.forEach((entry) => {
        console.log(`   ${entry.type}: ${entry.url}`);
        if (entry.postData) console.log(`      POST: ${entry.postData}`);
        if (entry.body) console.log(`      BODY: ${entry.body}`);
      });
    }
  } catch (error) {
    console.error('💥 Error during monitoring:', error);
  } finally {
    console.log('\n⏱️  Monitoring complete. Browser will stay open for manual inspection.');
    console.log('💡 Press any key to close...');

    // Keep browser open for manual inspection
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit();
    });
  }
}

// Run monitoring
if (require.main === module) {
  comprehensiveTokenMonitoring();
}
