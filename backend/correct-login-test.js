const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function correctLoginWithPopupHandling() {
  console.log('🔍 Testing correct login form with popup handling...');

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
              speed: null
            },
            timestamp: Date.now()
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
              speed: null
            },
            timestamp: Date.now()
          });
        },
        clearWatch: () => {}
      };
      
      Object.defineProperty(navigator, 'geolocation', {
        get: () => mockGeolocation,
        configurable: true
      });

      // Spoof timezone to Eastern Time (Florida)
      const originalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(...args) {
        if (args.length === 0 || !args[0]) {
          return new originalDateTimeFormat('en-US', { timeZone: 'America/New_York' });
        }
        return new originalDateTimeFormat(...args);
      };
      
      // Override Date methods to return Florida timezone
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        return 300; // EST offset (UTC-5)
      };
      
      // Spoof resolved options for timezone
      if (Intl.DateTimeFormat.prototype.resolvedOptions) {
        const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
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

    // Navigate to the collection page (triggers login redirect)
    console.log('🔗 Navigating to collection page...');
    await page.goto(
      'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection',
      {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
    );

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
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
              });
            },
            (error) => {
              resolve({
                success: false,
                error: error.message
              });
            }
          );
        } else {
          resolve({ success: false, error: 'Geolocation not available' });
        }
      });
    });
    
    console.log('📍 Geolocation test result:', locationTest);

    // Step 1: Handle cookie consent popup if it appears
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

    // Step 2: Monitor challengeToken before any interaction
    console.log('🔍 Setting up challengeToken monitoring...');
    const initialTokenStatus = await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
      return {
        exists: !!tokenField,
        value: tokenField ? tokenField.value : 'NOT FOUND',
        length: tokenField ? tokenField.value.length : 0,
        className: tokenField ? tokenField.className : 'N/A',
      };
    });
    console.log('🎯 Initial challengeToken status:', initialTokenStatus);

    // Step 3: Find and interact with the MAIN login form (not Google/Apple)
    console.log('📝 Looking for main login form...');

    const formInfo = await page.evaluate(() => {
      const mainForm = document.querySelector('#js-login-form');
      const emailField = document.querySelector('#email');
      const passwordField = document.querySelector('#password');
      const loginButton = document.querySelector('.js-login-button[name="login"]');

      return {
        mainFormExists: !!mainForm,
        mainFormAction: mainForm ? mainForm.action : 'NOT FOUND',
        emailFieldExists: !!emailField,
        passwordFieldExists: !!passwordField,
        loginButtonExists: !!loginButton,
        loginButtonText: loginButton ? loginButton.textContent?.trim() : 'NOT FOUND',
      };
    });

    console.log('📋 Form analysis:', formInfo);

    if (!formInfo.mainFormExists || !formInfo.emailFieldExists || !formInfo.passwordFieldExists) {
      console.error('❌ Required form elements not found!');
      return;
    }

    // Step 4: Type email with realistic human timing
    console.log('✍️ Typing email address...');
    const emailField = await page.$('#email');
    await emailField.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const email = process.env.CHRONO24_EMAIL || 'nlcordeiro90@gmail.com';
    for (const char of email) {
      await emailField.type(char, { delay: Math.random() * 100 + 50 });
    }
    console.log(`✅ Email typed: ${email}`);

    // Wait and check token after email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const tokenAfterEmail = await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
      return {
        value: tokenField ? tokenField.value : 'NOT FOUND',
        length: tokenField ? tokenField.value.length : 0,
      };
    });
    console.log('🎯 Token after email:', tokenAfterEmail);

    // Step 5: Type password with realistic human timing
    console.log('🔒 Typing password...');
    const passwordField = await page.$('#password');
    await passwordField.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const password = process.env.CHRONO24_PASSWORD || 'Nn04121996$$';
    for (const char of password) {
      await passwordField.type(char, { delay: Math.random() * 100 + 50 });
    }
    console.log('✅ Password typed (length: ' + password.length + ')');

    // Wait and check token after password
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const tokenAfterPassword = await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
      return {
        value: tokenField ? tokenField.value : 'NOT FOUND',
        length: tokenField ? tokenField.value.length : 0,
      };
    });
    console.log('🎯 Token after password:', tokenAfterPassword);

    // Step 6: Wait for any async validation/token population
    console.log('⏳ Waiting for potential async token population...');
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tokenStatus = await page.evaluate(() => {
        const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
        return {
          value: tokenField ? tokenField.value : 'NOT FOUND',
          length: tokenField ? tokenField.value.length : 0,
        };
      });

      console.log(`⏰ ${i + 1}s - Token status: ${tokenStatus.length} characters`);

      if (tokenStatus.length > 0) {
        console.log('🎉 Token populated! Value preview:', tokenStatus.value.substring(0, 100) + '...');
        break;
      }
    }

    // Step 7: Check final form state before submission
    const finalFormState = await page.evaluate(() => {
      const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
      const emailField = document.querySelector('#email');
      const passwordField = document.querySelector('#password');
      const errorMessages = document.querySelectorAll('.alert-error:not([style*="display: none"])');

      return {
        tokenValue: tokenField ? tokenField.value : 'NOT FOUND',
        tokenLength: tokenField ? tokenField.value.length : 0,
        emailValue: emailField ? emailField.value : 'NOT FOUND',
        passwordLength: passwordField ? passwordField.value.length : 0,
        hasErrorMessages: errorMessages.length > 0,
        pageTitle: document.title,
        currentUrl: window.location.href,
      };
    });

    console.log('\n📊 FINAL FORM STATE BEFORE SUBMISSION:');
    console.log('======================================');
    console.log('Challenge Token Length:', finalFormState.tokenLength, 'characters');
    console.log('Email Value:', finalFormState.emailValue);
    console.log('Password Length:', finalFormState.passwordLength, 'characters');
    console.log('Has Error Messages:', finalFormState.hasErrorMessages);
    console.log('Page Title:', finalFormState.pageTitle);
    console.log('Current URL:', finalFormState.currentUrl);

    // Step 8: Submit the form if token is populated (or attempt anyway)
    if (finalFormState.tokenLength > 0) {
      console.log('\n🚀 Token is populated! Attempting login...');
    } else {
      console.log('\n⚠️ Token is still empty, but attempting login anyway...');
    }

    const loginButton = await page.$('.js-login-button[name="login"]');
    if (loginButton) {
      await loginButton.click();
      console.log('✅ Login button clicked');

      // Wait for response
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const postSubmissionStatus = await page.evaluate(() => ({
        pageTitle: document.title,
        currentUrl: window.location.href,
        hasErrorMessages: document.querySelectorAll('.alert-error:not([style*="display: none"])').length > 0,
      }));

      console.log('\n📊 POST-SUBMISSION STATUS:');
      console.log('Page Title:', postSubmissionStatus.pageTitle);
      console.log('Current URL:', postSubmissionStatus.currentUrl);
      console.log('Has Error Messages:', postSubmissionStatus.hasErrorMessages);

      if (postSubmissionStatus.currentUrl.includes('/user/watch-collection/')) {
        console.log('🎉 LOGIN SUCCESS! Redirected to collection page');
      } else if (postSubmissionStatus.currentUrl.includes('/auth/login')) {
        console.log('❌ LOGIN FAILED - Still on login page');
      } else {
        console.log('🤔 Unexpected redirect:', postSubmissionStatus.currentUrl);
      }
    } else {
      console.log('❌ Login button not found!');
    }

    // Keep browser open for inspection
    console.log('\n🔍 Browser staying open for inspection. Press any key to close...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit();
    });
  } catch (error) {
    console.error('💥 Error during login test:', error);
  } finally {
    // Don't close browser automatically for inspection
  }
}

// Run the test
if (require.main === module) {
  correctLoginWithPopupHandling();
}
