const Chrono24Service = require('./services/chrono24Service');

async function testCollectionRedirect() {
    console.log('Testing collection page redirect behavior...');
    
    let service;
    try {
        // Create a fresh instance to avoid cached login state
        service = new Chrono24Service();
        await service.initialize();
        
        console.log('Navigating to collection page...');
        
        // Navigate to the collection page (what the service normally tries first)
        const collectionUrl = 'https://www.chrono24.com/user/watch-collection/product-suggestions.htm?watchCollectionItemOrigin=WatchCollection';
        
        await service.page.goto(collectionUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        
        // Wait a bit for any redirects
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const finalUrl = service.page.url();
        const title = await service.page.title();
        
        console.log('Final URL:', finalUrl);
        console.log('Page title:', title);
        
        // Check if we're on a login page
        const isOnLoginPage = finalUrl.includes('login') || finalUrl.includes('auth');
        console.log('Redirected to login page:', isOnLoginPage);
        
        // Check for login form elements
        const hasLoginForm = await service.page.$('#email') && await service.page.$('#password');
        console.log('Has login form elements:', !!hasLoginForm);
        
        // Take a screenshot for debugging
        await service.page.screenshot({ path: 'collection-redirect-test.png', fullPage: true });
        console.log('Screenshot saved as collection-redirect-test.png');
        
        // Check page content
        const pageContent = await service.page.content();
        console.log('Page content (first 500 chars):', pageContent.slice(0, 500));
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (service) {
            await service.cleanup();
        }
    }
}

testCollectionRedirect().catch(console.error);
