const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugLoginPageStructure() {
  console.log('🔍 Debugging login page structure...');

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

    console.log('🔗 Navigating to collection page to trigger redirect...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

    console.log('📍 Current URL:', page.url());

    // Wait for page to load fully
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('🔍 Analyzing login page structure...');

    const pageAnalysis = await page.evaluate(() => {
      // Find all forms
      const forms = Array.from(document.querySelectorAll('form'));
      const formInfo = forms.map((form, index) => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'));
        const inputInfo = inputs.map((input) => ({
          tag: input.tagName,
          type: input.type || 'N/A',
          name: input.name || 'N/A',
          id: input.id || 'N/A',
          value: input.value ? input.value.substring(0, 50) + '...' : 'EMPTY',
          valueLength: input.value ? input.value.length : 0,
          className: input.className || 'N/A',
        }));

        return {
          formIndex: index,
          action: form.action || 'N/A',
          method: form.method || 'N/A',
          inputCount: inputs.length,
          inputs: inputInfo,
        };
      });

      // Look for Turnstile/CAPTCHA elements
      const turnstileElements = {
        iframes: Array.from(document.querySelectorAll('iframe')).map((iframe) => ({
          src: iframe.src,
          id: iframe.id || 'N/A',
          className: iframe.className || 'N/A',
        })),
        turnstileContainers: Array.from(
          document.querySelectorAll('[data-sitekey], .cf-turnstile, [class*="turnstile"]'),
        ).map((el) => ({
          tagName: el.tagName,
          className: el.className || 'N/A',
          id: el.id || 'N/A',
          sitekey: el.getAttribute('data-sitekey') || 'N/A',
        })),
        hiddenInputs: Array.from(document.querySelectorAll('input[type="hidden"]')).map((input) => ({
          name: input.name || 'N/A',
          value: input.value ? input.value.substring(0, 100) + '...' : 'EMPTY',
          valueLength: input.value ? input.value.length : 0,
        })),
      };

      // Page metadata
      const metadata = {
        title: document.title,
        url: window.location.href,
        hasJavaScript: !!window.jQuery || !!window.$,
        scripts: Array.from(document.querySelectorAll('script[src]'))
          .slice(0, 10)
          .map((script) => script.src),
      };

      return {
        forms: formInfo,
        turnstile: turnstileElements,
        metadata: metadata,
      };
    });

    console.log('\n📊 LOGIN PAGE ANALYSIS:');
    console.log('========================');

    console.log('\n🏷️ Page Metadata:');
    console.log(`Title: ${pageAnalysis.metadata.title}`);
    console.log(`URL: ${pageAnalysis.metadata.url}`);
    console.log(`Scripts found: ${pageAnalysis.metadata.scripts.length}`);

    console.log('\n📝 Forms Found:', pageAnalysis.forms.length);
    pageAnalysis.forms.forEach((form, index) => {
      console.log(`\n📋 Form ${index}:`);
      console.log(`  Action: ${form.action}`);
      console.log(`  Method: ${form.method}`);
      console.log(`  Inputs: ${form.inputCount}`);

      form.inputs.forEach((input) => {
        console.log(
          `    - ${input.tag} [${input.type}] name="${input.name}" id="${input.id}" value="${input.value}" (${input.valueLength} chars)`,
        );
      });
    });

    console.log('\n🛡️ Turnstile/CAPTCHA Elements:');
    console.log(`  Iframes: ${pageAnalysis.turnstile.iframes.length}`);
    pageAnalysis.turnstile.iframes.forEach((iframe) => {
      console.log(`    - ${iframe.src} (id: ${iframe.id}, class: ${iframe.className})`);
    });

    console.log(`  Turnstile containers: ${pageAnalysis.turnstile.turnstileContainers.length}`);
    pageAnalysis.turnstile.turnstileContainers.forEach((container) => {
      console.log(`    - ${container.tagName} (class: ${container.className}, sitekey: ${container.sitekey})`);
    });

    console.log(`  Hidden inputs: ${pageAnalysis.turnstile.hiddenInputs.length}`);
    pageAnalysis.turnstile.hiddenInputs.forEach((input) => {
      console.log(`    - "${input.name}": ${input.value} (${input.valueLength} chars)`);
    });

    // Take a screenshot for visual analysis
    await page.screenshot({ path: 'debug-login-structure.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: debug-login-structure.png');

    // Wait for potential dynamic content loading
    console.log('\n⏳ Waiting 15 seconds for dynamic content...');
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Re-check after waiting
    const afterWaitAnalysis = await page.evaluate(() => {
      const challengeToken = document.querySelector('input[name="challengeToken"]');
      const allHiddenInputs = Array.from(document.querySelectorAll('input[type="hidden"]')).map((input) => ({
        name: input.name || 'N/A',
        value: input.value ? input.value.substring(0, 100) + '...' : 'EMPTY',
        valueLength: input.value ? input.value.length : 0,
      }));

      return {
        challengeTokenExists: !!challengeToken,
        challengeTokenValue: challengeToken ? challengeToken.value : 'NOT FOUND',
        challengeTokenLength: challengeToken ? challengeToken.value.length : 0,
        allHiddenInputs: allHiddenInputs,
      };
    });

    console.log('\n🔍 After 15 second wait:');
    console.log('Challenge Token Analysis:', afterWaitAnalysis);

    await page.screenshot({ path: 'debug-login-after-wait.png', fullPage: true });
    console.log('📸 After-wait screenshot saved as: debug-login-after-wait.png');

    console.log('\n✅ Debug analysis complete!');
  } catch (error) {
    console.error('💥 Error during debug analysis:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run debug analysis
if (require.main === module) {
  debugLoginPageStructure();
}
