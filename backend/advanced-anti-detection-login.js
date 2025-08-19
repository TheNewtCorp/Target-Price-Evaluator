const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function attemptLogin() {
    let browser;
    
    try {
        console.log('🚀 Starting advanced anti-detection login attempt...');
        
        // Advanced browser configuration for stealth
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions-except=' + path.resolve('./extensions/turnstile-solver'),
                '--load-extension=' + path.resolve('./extensions/turnstile-solver'),
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--enable-features=NetworkService,NetworkServiceLogging',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();
        
        // Advanced stealth measures
        await page.evaluateOnNewDocument(() => {
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Mock chrome runtime
            window.chrome = {
                runtime: {
                    onConnect: undefined,
                    onMessage: undefined
                }
            };
            
            // Mock permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' 
                    ? Promise.resolve({ state: Notification.permission })
                    : originalQuery(parameters)
            );
            
            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
            
            // Add realistic screen properties
            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24
            });
            
            // Mock connection
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    rtt: 150,
                    downlink: 10
                })
            });
        });

        // Set realistic viewport
        await page.setViewport({ 
            width: 1366, 
            height: 768,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true
        });

        // Set extra headers to appear more legitimate
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        });

        // Navigate with human-like timing
        console.log('🌐 Navigating to login page with realistic timing...');
        await page.goto('https://www.chrono24.com/auth/login.htm', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for human-like initial page inspection time
        await page.waitForTimeout(2000 + Math.random() * 2000);
        
        // Handle cookie consent with human-like interaction
        console.log('🍪 Handling cookie consent with realistic behavior...');
        try {
            await page.waitForSelector('#cookie-consent button, .cookie-banner button, button[data-test="cookie-accept"]', { timeout: 5000 });
            
            // Simulate reading the cookie notice
            await page.waitForTimeout(1000 + Math.random() * 2000);
            
            const cookieButton = await page.$('#cookie-consent button, .cookie-banner button, button[data-test="cookie-accept"]');
            if (cookieButton) {
                // Human-like mouse movement and click
                const box = await cookieButton.boundingBox();
                if (box) {
                    await page.mouse.move(box.x + box.width/2, box.y + box.height/2, {steps: 10});
                    await page.waitForTimeout(200 + Math.random() * 300);
                    await cookieButton.click();
                    console.log('✅ Cookie consent handled with human-like interaction');
                }
            }
        } catch (error) {
            console.log('ℹ️ No cookie consent popup found or already handled');
        }

        // Wait for page to fully stabilize
        await page.waitForTimeout(3000);

        // Extensive monitoring of challenge token and Turnstile
        console.log('🎯 Setting up comprehensive monitoring...');
        
        const monitoringScript = `
            window.chrono24Monitor = {
                challengeToken: '',
                turnstileWidget: null,
                turnstileResponse: '',
                
                init() {
                    // Monitor challenge token field
                    const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
                    if (tokenField) {
                        console.log('🎫 Challenge token field found');
                        new MutationObserver(() => {
                            this.challengeToken = tokenField.value || '';
                            console.log('🔄 Token updated:', this.challengeToken.length, 'chars');
                        }).observe(tokenField, { attributes: true, attributeFilter: ['value'] });
                    }
                    
                    // Monitor Turnstile widgets
                    const checkTurnstile = () => {
                        const turnstileElements = document.querySelectorAll('[data-sitekey], .cf-turnstile, [id*="turnstile"]');
                        if (turnstileElements.length > 0) {
                            console.log('🛡️ Turnstile elements found:', turnstileElements.length);
                            turnstileElements.forEach((el, index) => {
                                console.log('Element', index, ':', el.outerHTML.substring(0, 200));
                            });
                        }
                        
                        // Check for global Turnstile object
                        if (window.turnstile) {
                            console.log('🔧 Turnstile API available');
                            this.turnstileWidget = window.turnstile;
                        }
                        
                        // Check for Cloudflare challenge
                        if (window.cf && window.cf.challenge) {
                            console.log('☁️ Cloudflare challenge object found');
                        }
                    };
                    
                    checkTurnstile();
                    setInterval(checkTurnstile, 2000);
                    
                    // Monitor network requests for Turnstile/challenge activity
                    const originalFetch = window.fetch;
                    window.fetch = function(...args) {
                        const url = args[0];
                        if (typeof url === 'string' && (url.includes('turnstile') || url.includes('challenge') || url.includes('cloudflare'))) {
                            console.log('🌐 Turnstile-related request:', url);
                        }
                        return originalFetch.apply(this, args);
                    };
                },
                
                getStatus() {
                    return {
                        challengeToken: this.challengeToken,
                        challengeTokenLength: this.challengeToken.length,
                        hasTurnstileWidget: !!this.turnstileWidget,
                        turnstileResponse: this.turnstileResponse,
                        pageTitle: document.title,
                        currentUrl: window.location.href
                    };
                }
            };
            
            window.chrono24Monitor.init();
        `;
        
        await page.evaluate(monitoringScript);
        
        // Wait and observe initial state
        await page.waitForTimeout(3000);
        let status = await page.evaluate(() => window.chrono24Monitor.getStatus());
        console.log('📊 Initial monitoring status:', status);

        // Fill form with extremely human-like behavior
        console.log('📝 Filling form with advanced human simulation...');
        
        // Email field
        const emailField = await page.$('#email, input[name="email"]');
        if (!emailField) {
            throw new Error('Email field not found');
        }
        
        // Focus with realistic timing
        await emailField.click();
        await page.waitForTimeout(500 + Math.random() * 1000);
        
        // Type email with realistic human typing patterns
        const email = process.env.CHRONO24_EMAIL || 'nlcordeiro90@gmail.com';
        for (let i = 0; i < email.length; i++) {
            await page.keyboard.type(email[i]);
            // Vary typing speed (faster for common words, slower for complex parts)
            const char = email[i];
            let delay = 100 + Math.random() * 100;
            if (char === '@') delay += 200; // Pause at @
            if (char === '.') delay += 150; // Pause at .
            await page.waitForTimeout(delay);
        }
        
        // Check token status after email
        await page.waitForTimeout(1000);
        status = await page.evaluate(() => window.chrono24Monitor.getStatus());
        console.log('📧 After email - Token status:', status.challengeTokenLength, 'characters');
        
        // Password field with realistic interaction
        const passwordField = await page.$('#password, input[name="password"]');
        if (!passwordField) {
            throw new Error('Password field not found');
        }
        
        await passwordField.click();
        await page.waitForTimeout(300 + Math.random() * 700);
        
        // Type password with realistic pauses
        const password = process.env.CHRONO24_PASSWORD || 'Nn04121996$$';
        for (let i = 0; i < password.length; i++) {
            await page.keyboard.type(password[i]);
            let delay = 80 + Math.random() * 120;
            if (/[A-Z]/.test(password[i])) delay += 100; // Slower for uppercase
            if (/[^a-zA-Z0-9]/.test(password[i])) delay += 150; // Slower for special chars
            await page.waitForTimeout(delay);
        }
        
        // Extended wait after form completion to allow Turnstile processing
        console.log('⏳ Waiting for Turnstile challenge processing...');
        for (let i = 0; i < 15; i++) {
            await page.waitForTimeout(1000);
            status = await page.evaluate(() => window.chrono24Monitor.getStatus());
            console.log(`⏰ ${i+1}/15s - Token: ${status.challengeTokenLength} chars`);
            
            if (status.challengeTokenLength > 0) {
                console.log('🎉 Challenge token populated!');
                break;
            }
            
            // Try to trigger Turnstile manually if detected
            if (status.hasTurnstileWidget) {
                console.log('🔧 Attempting manual Turnstile trigger...');
                await page.evaluate(() => {
                    // Try various methods to trigger Turnstile
                    if (window.turnstile && window.turnstile.render) {
                        try {
                            const turnstileElement = document.querySelector('[data-sitekey], .cf-turnstile');
                            if (turnstileElement) {
                                window.turnstile.render(turnstileElement);
                            }
                        } catch (e) {
                            console.log('Turnstile render error:', e);
                        }
                    }
                });
            }
        }

        // Final status check
        status = await page.evaluate(() => window.chrono24Monitor.getStatus());
        console.log('\n📊 FINAL STATUS BEFORE SUBMISSION:');
        console.log('=====================================');
        console.log('Challenge Token Length:', status.challengeTokenLength, 'characters');
        console.log('Has Turnstile Widget:', status.hasTurnstileWidget);
        console.log('Page Title:', status.pageTitle);
        console.log('Current URL:', status.currentUrl);
        
        if (status.challengeTokenLength === 0) {
            console.log('⚠️ Challenge token is still empty, but attempting login...');
        } else {
            console.log('✅ Challenge token is populated! Proceeding with login...');
        }

        // Submit form with human-like behavior
        const submitButton = await page.$('button[name="login"], .js-login-button, button[type="submit"]');
        if (!submitButton) {
            throw new Error('Submit button not found');
        }
        
        // Human-like pre-submission pause (reading over form)
        await page.waitForTimeout(1000 + Math.random() * 2000);
        
        // Click submit with realistic mouse movement
        const buttonBox = await submitButton.boundingBox();
        if (buttonBox) {
            await page.mouse.move(buttonBox.x + buttonBox.width/2, buttonBox.y + buttonBox.height/2, {steps: 15});
            await page.waitForTimeout(200);
            await submitButton.click();
            console.log('🚀 Login form submitted');
        }

        // Wait for response and analyze result
        console.log('⏳ Waiting for login response...');
        await page.waitForTimeout(5000);
        
        const finalStatus = await page.evaluate(() => ({
            title: document.title,
            url: window.location.href,
            hasErrors: document.querySelector('.error, .alert-danger, [class*="error"]') !== null,
            isStillOnLogin: window.location.href.includes('/auth/login')
        }));
        
        console.log('\n📊 LOGIN RESULT:');
        console.log('=================');
        console.log('Final URL:', finalStatus.url);
        console.log('Page Title:', finalStatus.title);
        console.log('Has Error Messages:', finalStatus.hasErrors);
        
        if (finalStatus.isStillOnLogin) {
            console.log('❌ LOGIN FAILED - Still on login page');
            
            // Capture screenshot for analysis
            await page.screenshot({ path: './logs/advanced-login-failure.png', fullPage: true });
            console.log('📸 Failure screenshot saved to ./logs/advanced-login-failure.png');
        } else {
            console.log('🎉 LOGIN SUCCESS - Redirected away from login page!');
            
            // Capture success screenshot
            await page.screenshot({ path: './logs/advanced-login-success.png', fullPage: true });
            console.log('📸 Success screenshot saved to ./logs/advanced-login-success.png');
        }

        console.log('\n🔍 Browser staying open for inspection. Press any key to close...');
        await new Promise(resolve => process.stdin.once('data', resolve));

    } catch (error) {
        console.error('❌ Error during login attempt:', error.message);
        
        if (browser) {
            const page = await browser.newPage();
            await page.screenshot({ path: './logs/advanced-login-error.png', fullPage: true });
            console.log('📸 Error screenshot saved to ./logs/advanced-login-error.png');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the login attempt
attemptLogin().catch(console.error);
