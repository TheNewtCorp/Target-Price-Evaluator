const puppeteer = require('puppeteer');
const path = require('path');

async function floridaGeoLocationLogin() {
    let browser;
    
    try {
        console.log('🌴 Starting Florida geo-spoofed login attempt...');
        
        browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();
        
        // Advanced geolocation and timezone spoofing for Boca Raton, Florida
        console.log('🗺️ Setting up Florida geolocation spoofing...');
        
        // Set geolocation to Boca Raton, Florida
        await page.setGeolocation({
            latitude: 26.3683064,  // Boca Raton coordinates
            longitude: -80.1289321,
            accuracy: 100
        });
        
        // Comprehensive Florida/Boca Raton spoofing
        await page.evaluateOnNewDocument(() => {
            // Remove webdriver indicators
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Mock timezone to Eastern Time (Florida)
            const originalDateTimeFormat = Intl.DateTimeFormat;
            window.Intl.DateTimeFormat = function(...args) {
                const instance = new originalDateTimeFormat(...args);
                const originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    const options = originalResolvedOptions.call(this);
                    options.timeZone = 'America/New_York'; // Florida uses Eastern Time
                    return options;
                };
                return instance;
            };
            
            // Override Date to use Eastern timezone
            const originalDate = Date;
            window.Date = class extends originalDate {
                constructor(...args) {
                    super(...args);
                }
                
                getTimezoneOffset() {
                    return 300; // EST offset (UTC-5)
                }
                
                static now() {
                    return originalDate.now();
                }
            };
            
            // Mock geolocation API for Boca Raton
            const mockPosition = {
                coords: {
                    latitude: 26.3683064,
                    longitude: -80.1289321,
                    altitude: 10,
                    accuracy: 100,
                    altitudeAccuracy: 10,
                    heading: null,
                    speed: null
                },
                timestamp: Date.now()
            };
            
            Object.defineProperty(navigator, 'geolocation', {
                value: {
                    getCurrentPosition: (success, error, options) => {
                        console.log('🌴 Geolocation requested - returning Boca Raton coordinates');
                        setTimeout(() => success(mockPosition), 100);
                    },
                    watchPosition: (success, error, options) => {
                        console.log('🌴 Watch position requested - returning Boca Raton coordinates');
                        setTimeout(() => success(mockPosition), 100);
                        return 1;
                    },
                    clearWatch: (id) => {
                        console.log('🌴 Geolocation watch cleared');
                    }
                },
                writable: false,
                configurable: false
            });
            
            // Override screen properties for common Florida setup
            Object.defineProperty(screen, 'width', { value: 1920 });
            Object.defineProperty(screen, 'height', { value: 1080 });
            Object.defineProperty(screen, 'availWidth', { value: 1920 });
            Object.defineProperty(screen, 'availHeight', { value: 1040 });
            Object.defineProperty(screen, 'colorDepth', { value: 24 });
            Object.defineProperty(screen, 'pixelDepth', { value: 24 });
            
            // Mock navigator properties for Florida/US
            Object.defineProperty(navigator, 'language', { value: 'en-US' });
            Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'] });
            Object.defineProperty(navigator, 'platform', { value: 'Win32' });
            Object.defineProperty(navigator, 'cookieEnabled', { value: true });
            Object.defineProperty(navigator, 'onLine', { value: true });
            Object.defineProperty(navigator, 'doNotTrack', { value: null });
            
            // Mock connection for typical Florida broadband
            Object.defineProperty(navigator, 'connection', {
                value: {
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 25,
                    saveData: false
                },
                writable: false
            });
            
            // Override plugin detection
            Object.defineProperty(navigator, 'plugins', {
                value: Object.setPrototypeOf([
                    {
                        name: 'Chrome PDF Plugin',
                        description: 'Portable Document Format',
                        filename: 'internal-pdf-viewer'
                    },
                    {
                        name: 'Chrome PDF Viewer',
                        description: '',
                        filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'
                    },
                    {
                        name: 'Native Client',
                        description: '',
                        filename: 'internal-nacl-plugin'
                    }
                ], PluginArray.prototype)
            });
            
            console.log('🌴 Florida geolocation and environment spoofing initialized');
            console.log('📍 Location: Boca Raton, FL (26.3683, -80.1289)');
            console.log('🕐 Timezone: America/New_York (Eastern)');
        });

        // Set realistic viewport for Florida desktop user
        await page.setViewport({ 
            width: 1366, 
            height: 768,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true
        });

        // Set headers consistent with Florida user
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

        console.log('🌐 Navigating to login page...');
        await page.goto('https://www.chrono24.com/auth/login.htm', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for page to fully load and collect geolocation data
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Monitor network requests for geolocation-related calls
        page.on('request', request => {
            const url = request.url();
            if (url.includes('geo') || url.includes('location') || url.includes('analytics') || url.includes('collect')) {
                console.log('🌐 Location-related request detected:', url.substring(0, 100) + '...');
            }
        });

                // Handle cookie consent with comprehensive selector matching from correct-login-test.js
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
                                
                                // Human-like mouse movement and click
                                const box = await button.boundingBox();
                                if (box) {
                                    await page.mouse.move(box.x + box.width/2, box.y + box.height/2, {steps: 10});
                                    await page.waitForTimeout(200 + Math.random() * 300);
                                    await button.click();
                                    cookieHandled = true;
                                    console.log('✅ Clicked cookie consent button');
                                    break;
                                }
                            }
                        }
                    } else {
                        // Handle CSS selectors
                        const element = await page.$(selector);
                        if (element) {
                            console.log(`🍪 Found cookie consent element: ${selector}`);
                            // Human-like mouse movement and click
                            const box = await element.boundingBox();
                            if (box) {
                                await page.mouse.move(box.x + box.width/2, box.y + box.height/2, {steps: 10});
                                await page.waitForTimeout(200 + Math.random() * 300);
                                await element.click();
                                cookieHandled = true;
                                console.log('✅ Clicked cookie consent element');
                                break;
                            }
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
            await page.waitForTimeout(2000);
        } catch (error) {
            console.log('🍪 Cookie consent handling skipped:', error.message);
        }

        // Set up challenge token monitoring with Florida context
        console.log('🎯 Setting up challenge token monitoring with Florida context...');
        
        const monitoringScript = `
            window.floridaMonitor = {
                challengeToken: '',
                locationData: {},
                
                init() {
                    // Log initial location info
                    console.log('🌴 Florida Monitor initialized');
                    console.log('📍 Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
                    console.log('🌐 Language:', navigator.language);
                    
                    // Test geolocation
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                this.locationData = {
                                    lat: position.coords.latitude,
                                    lon: position.coords.longitude,
                                    accuracy: position.coords.accuracy
                                };
                                console.log('🗺️ Geolocation test:', this.locationData);
                            },
                            (error) => {
                                console.log('❌ Geolocation error:', error.message);
                            }
                        );
                    }
                    
                    // Monitor challenge token
                    const tokenField = document.querySelector('input[name="challengeToken"], .js-login-challenge-token');
                    if (tokenField) {
                        console.log('🎫 Challenge token field found');
                        new MutationObserver(() => {
                            this.challengeToken = tokenField.value || '';
                            if (this.challengeToken.length > 0) {
                                console.log('🎉 Token populated:', this.challengeToken.length, 'chars');
                            }
                        }).observe(tokenField, { attributes: true, attributeFilter: ['value'] });
                    }
                    
                    // Monitor for Turnstile
                    setInterval(() => {
                        const turnstileElements = document.querySelectorAll('[data-sitekey], .cf-turnstile, [id*="turnstile"]');
                        if (turnstileElements.length > 0 && !this.turnstileLogged) {
                            console.log('🛡️ Turnstile elements detected:', turnstileElements.length);
                            this.turnstileLogged = true;
                        }
                    }, 2000);
                },
                
                getStatus() {
                    return {
                        challengeToken: this.challengeToken,
                        challengeTokenLength: this.challengeToken.length,
                        locationData: this.locationData,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        language: navigator.language,
                        platform: navigator.platform,
                        userAgent: navigator.userAgent.substring(0, 50) + '...',
                        screenWidth: screen.width,
                        screenHeight: screen.height
                    };
                }
            };
            
            window.floridaMonitor.init();
        `;
        
        await page.evaluate(monitoringScript);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Log initial status
        let status = await page.evaluate(() => window.floridaMonitor.getStatus());
        console.log('📊 Initial Florida monitor status:');
        console.log('   Timezone:', status.timezone);
        console.log('   Language:', status.language);
        console.log('   Platform:', status.platform);
        console.log('   Screen:', status.screenWidth + 'x' + status.screenHeight);
        console.log('   Location data:', status.locationData);
        console.log('   Token length:', status.challengeTokenLength);

        // Fill form with realistic Florida user behavior
        console.log('📝 Filling form as Florida user...');
        
        const emailField = await page.$('#email, input[name="email"]');
        if (!emailField) {
            throw new Error('Email field not found');
        }
        
        await emailField.click();
        await new Promise(resolve => setTimeout(resolve, 800)); // Realistic pause
        
        const email = process.env.CHRONO24_EMAIL || 'nlcordeiro90@gmail.com';
        await emailField.type(email, { delay: 120 }); // Realistic typing speed
        
        // Check token after email
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await page.evaluate(() => window.floridaMonitor.getStatus());
        console.log('📧 After email - Token length:', status.challengeTokenLength);
        
        // Password field
        const passwordField = await page.$('#password, input[name="password"]');
        if (!passwordField) {
            throw new Error('Password field not found');
        }
        
        await passwordField.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const password = process.env.CHRONO24_PASSWORD || 'Nn04121996$$';
        await passwordField.type(password, { delay: 100 });
        
        // Extended wait for Turnstile processing with Florida context
        console.log('⏳ Waiting for Turnstile challenge processing (Florida context)...');
        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            status = await page.evaluate(() => window.floridaMonitor.getStatus());
            console.log(`⏰ ${i+1}/20s - Token: ${status.challengeTokenLength} chars, Location: ${JSON.stringify(status.locationData)}`);
            
            if (status.challengeTokenLength > 0) {
                console.log('🎉 Challenge token populated with Florida context!');
                break;
            }
            
            // Try to trigger geolocation again mid-process
            if (i === 10) {
                console.log('🔄 Re-triggering geolocation check...');
                await page.evaluate(() => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(() => {
                            console.log('🌴 Geolocation re-check successful');
                        });
                    }
                });
            }
        }

        // Final status before submission
        status = await page.evaluate(() => window.floridaMonitor.getStatus());
        console.log('\n📊 FINAL FLORIDA STATUS:');
        console.log('=========================');
        console.log('Challenge Token:', status.challengeTokenLength, 'characters');
        console.log('Location Data:', status.locationData);
        console.log('Timezone:', status.timezone);
        console.log('Language:', status.language);
        
        // Submit form
        console.log('🚀 Submitting form with Florida geolocation context...');
        const submitButton = await page.$('button[name="login"], .js-login-button, button[type="submit"]');
        if (!submitButton) {
            throw new Error('Submit button not found');
        }
        
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check result
        const finalStatus = await page.evaluate(() => ({
            title: document.title,
            url: window.location.href,
            hasErrors: document.querySelector('.error, .alert-danger, [class*="error"]') !== null,
            isStillOnLogin: window.location.href.includes('/auth/login')
        }));
        
        console.log('\n📊 FLORIDA LOGIN RESULT:');
        console.log('========================');
        console.log('Final URL:', finalStatus.url);
        console.log('Page Title:', finalStatus.title);
        console.log('Has Errors:', finalStatus.hasErrors);
        
        if (finalStatus.isStillOnLogin) {
            console.log('❌ LOGIN FAILED - Still on login page');
            await page.screenshot({ path: './logs/florida-login-failure.png', fullPage: true });
            console.log('📸 Failure screenshot saved to ./logs/florida-login-failure.png');
        } else {
            console.log('🎉 LOGIN SUCCESS - Redirected from login page!');
            await page.screenshot({ path: './logs/florida-login-success.png', fullPage: true });
            console.log('📸 Success screenshot saved to ./logs/florida-login-success.png');
        }

        console.log('\n🔍 Browser staying open for inspection. Press any key to close...');
        await new Promise(resolve => process.stdin.once('data', resolve));

    } catch (error) {
        console.error('❌ Error during Florida login attempt:', error.message);
        
        if (browser) {
            try {
                const pages = await browser.pages();
                const page = pages[pages.length - 1];
                await page.screenshot({ path: './logs/florida-login-error.png', fullPage: true });
                console.log('📸 Error screenshot saved');
            } catch (screenshotError) {
                console.log('Could not capture error screenshot');
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the Florida geo-spoofed login attempt
floridaGeoLocationLogin().catch(console.error);
