const Chrono24Service = require('./services/chrono24Service.js');

async function debugLogin() {
    const service = new Chrono24Service();
    
    try {
        console.log('Initializing service...');
        await service.initialize();
        
        console.log('Starting detailed login debug...');
        
        // Navigate to login page
        console.log('1. Navigating to login page...');
        await service.page.goto('https://www.chrono24.com/auth/login', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Take screenshot before login
        await service.page.screenshot({ path: 'before-login.png' });
        console.log('Screenshot taken: before-login.png');
        
        // Check if login form exists
        console.log('2. Checking for login form...');
        const emailInput = await service.page.$('input[name="email"], input[type="email"], #email');
        const passwordInput = await service.page.$('input[name="password"], input[type="password"], #password');
        
        if (!emailInput || !passwordInput) {
            console.log('Login form not found!');
            await service.page.screenshot({ path: 'no-form.png' });
            return;
        }
        
        console.log('Login form found');
        
        // Fill credentials
        console.log('3. Filling credentials...');
        await emailInput.type(process.env.CHRONO24_EMAIL, { delay: 100 });
        await passwordInput.type(process.env.CHRONO24_PASSWORD, { delay: 100 });
        
        // Take screenshot after filling
        await service.page.screenshot({ path: 'after-fill.png' });
        console.log('Screenshot taken: after-fill.png');
        
        // Check for submit button
        console.log('4. Looking for submit button...');
        const submitButton = await service.page.$('button[type="submit"], input[type="submit"], .login-button, [data-testid="login-submit"], .js-login-button');
        
        if (!submitButton) {
            console.log('Submit button not found!');
            await service.page.screenshot({ path: 'no-submit.png' });
            return;
        }
        
        console.log('Submit button found, clicking...');
        await submitButton.click();
        
        // Wait a bit for potential navigation
        await service.page.waitForTimeout(2000);
        
        // Take screenshot after submit
        await service.page.screenshot({ path: 'after-submit.png' });
        console.log('Screenshot taken: after-submit.png');
        
        // Check current URL
        const currentUrl = service.page.url();
        console.log('Current URL:', currentUrl);
        
        // Check for Turnstile
        console.log('5. Checking for Turnstile...');
        const turnstile = await service.page.$('iframe[src*="cloudflare"], iframe[title*="turnstile"], .cf-turnstile');
        
        if (turnstile) {
            console.log('Turnstile found, handling...');
            // Let Turnstile process
            await service.page.waitForTimeout(3000);
            
            await service.page.screenshot({ path: 'turnstile-present.png' });
            console.log('Screenshot taken: turnstile-present.png');
            
            // Wait for Turnstile to complete
            try {
                await service.page.waitForFunction(() => {
                    const turnstileIframe = document.querySelector('iframe[src*="cloudflare"], iframe[title*="turnstile"], .cf-turnstile iframe');
                    if (!turnstileIframe) return true;
                    
                    try {
                        const doc = turnstileIframe.contentDocument;
                        if (!doc) return false;
                        
                        const successCheck = doc.querySelector('input[name="cf-turnstile-response"]');
                        return successCheck && successCheck.value && successCheck.value.length > 0;
                    } catch (e) {
                        return false;
                    }
                }, { timeout: 30000 });
                
                console.log('Turnstile appears to be completed');
                await service.page.screenshot({ path: 'turnstile-complete.png' });
            } catch (e) {
                console.log('Turnstile completion timeout or error:', e.message);
                await service.page.screenshot({ path: 'turnstile-timeout.png' });
            }
        } else {
            console.log('No Turnstile found');
        }
        
        // Check for final login success
        console.log('6. Checking login success...');
        
        await service.page.waitForTimeout(2000);
        
        const finalUrl = service.page.url();
        console.log('Final URL:', finalUrl);
        
        // Check various success indicators
        const isOnHomePage = finalUrl.includes('/account') || finalUrl.includes('/my') || finalUrl === 'https://www.chrono24.com/';
        const hasUserMenu = await service.page.$('.user-menu, [data-testid="user-menu"], .account-menu, a[href*="/user/"]') !== null;
        const noLoginForm = await service.page.$('form[action*="login"], .login-form') === null;
        
        console.log('Success indicators:');
        console.log('- On home/account page:', isOnHomePage);
        console.log('- Has user menu:', hasUserMenu);
        console.log('- No login form:', noLoginForm);
        
        // Take final screenshot
        await service.page.screenshot({ path: 'final-state.png' });
        console.log('Screenshot taken: final-state.png');
        
        if (isOnHomePage || hasUserMenu || noLoginForm) {
            console.log('✅ Login appears successful!');
        } else {
            console.log('❌ Login failed - still on login page');
            
            // Check for error messages
            const errorMessage = await service.page.$('.error-message, .alert-danger, .login-error');
            if (errorMessage) {
                const errorText = await errorMessage.textContent();
                console.log('Error message found:', errorText);
            }
        }
        
    } catch (error) {
        console.log('Debug test failed:', error.message);
        try {
            await service.page.screenshot({ path: 'error-state.png' });
            console.log('Error screenshot saved: error-state.png');
        } catch (e) {
            console.log('Could not take error screenshot:', e.message);
        }
    } finally {
        await service.cleanup();
    }
}

debugLogin();
