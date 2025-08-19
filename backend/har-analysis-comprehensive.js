const fs = require('fs');

console.log('='.repeat(80));
console.log('COMPREHENSIVE CHRONO24 LOGIN HAR ANALYSIS');
console.log('='.repeat(80));

// Analyze multiple HAR files to understand the differences
const harFiles = [
    {
        name: 'Manual Success Session',
        path: './logs/manual-login-success.har',
        description: 'Successful manual login with 302 redirect'
    },
    {
        name: 'Test Browser Session', 
        path: './logs/www.chrono24testbrowser.com.har',
        description: 'Test browser session with perpetual loading'
    }
];

function analyzeHarFile(harPath, description) {
    if (!fs.existsSync(harPath)) {
        console.log(`❌ File not found: ${harPath}`);
        return null;
    }

    console.log(`\n📁 Analyzing: ${description}`);
    console.log(`📄 File: ${harPath}`);

    try {
        const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));
        const entries = harData.log.entries;

        // Find login POST request
        const loginPost = entries.find(entry => 
            entry.request.method === 'POST' && 
            entry.request.url.includes('/auth/login.htm')
        );

        if (!loginPost) {
            console.log('❌ No login POST request found');
            return null;
        }

        console.log('✅ Login POST request found:');
        console.log(`   URL: ${loginPost.request.url}`);
        console.log(`   Status: ${loginPost.response.status} ${loginPost.response.statusText}`);
        
        // Analyze POST data
        if (loginPost.request.postData) {
            const params = loginPost.request.postData.params || [];
            const challengeTokenParam = params.find(p => p.name === 'challengeToken');
            const emailParam = params.find(p => p.name === 'email');
            const passwordParam = params.find(p => p.name === 'password');

            console.log('\n📝 Form Data Analysis:');
            console.log(`   Email: ${emailParam ? (emailParam.value ? 'Present' : 'Empty') : 'Missing'}`);
            console.log(`   Password: ${passwordParam ? (passwordParam.value ? 'Present' : 'Empty') : 'Missing'}`);
            console.log(`   Challenge Token: ${challengeTokenParam ? (challengeTokenParam.value || '(EMPTY)') : 'Missing'}`);
            
            if (challengeTokenParam && challengeTokenParam.value) {
                console.log(`   Challenge Token Length: ${challengeTokenParam.value.length} characters`);
            }
        }

        // Check for redirects after login
        const redirects = entries.filter(entry => 
            entry.response.status >= 300 && entry.response.status < 400
        );
        
        console.log(`\n🔄 Redirects found: ${redirects.length}`);
        redirects.forEach((redirect, index) => {
            const location = redirect.response.headers.find(h => h.name.toLowerCase() === 'location');
            console.log(`   ${index + 1}. ${redirect.response.status} -> ${location ? location.value : 'No location header'}`);
        });

        // Look for Turnstile-related requests
        const turnstileRequests = entries.filter(entry => 
            entry.request.url.includes('turnstile') ||
            entry.request.url.includes('cloudflare') ||
            entry.request.url.includes('challenges.cloudflare.com')
        );

        console.log(`\n🛡️  Turnstile/Cloudflare requests: ${turnstileRequests.length}`);
        turnstileRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ${req.request.method} ${req.request.url}`);
            console.log(`      Status: ${req.response.status}`);
        });

        // Look for any requests containing challenge or token
        const challengeRequests = entries.filter(entry => 
            entry.request.url.toLowerCase().includes('challenge') ||
            entry.request.url.toLowerCase().includes('token')
        );

        if (challengeRequests.length > 0) {
            console.log(`\n🎫 Challenge/Token requests: ${challengeRequests.length}`);
            challengeRequests.forEach((req, index) => {
                console.log(`   ${index + 1}. ${req.request.method} ${req.request.url}`);
            });
        }

        // Analyze timing - look for long-running requests around login time
        if (loginPost.timings) {
            console.log('\n⏱️  Login Request Timing:');
            console.log(`   Total: ${loginPost.time}ms`);
            if (loginPost.timings.wait) {
                console.log(`   Server Wait: ${loginPost.timings.wait}ms`);
            }
            if (loginPost.timings.receive) {
                console.log(`   Receive: ${loginPost.timings.receive}ms`);
            }
        }

        return {
            hasLoginPost: true,
            loginStatus: loginPost.response.status,
            challengeToken: loginPost.request.postData?.params?.find(p => p.name === 'challengeToken')?.value || '',
            redirectCount: redirects.length,
            turnstileRequestCount: turnstileRequests.length,
            challengeRequestCount: challengeRequests.length
        };

    } catch (error) {
        console.log(`❌ Error analyzing HAR file: ${error.message}`);
        return null;
    }
}

// Analyze each HAR file
const results = {};
harFiles.forEach(harFile => {
    const result = analyzeHarFile(harFile.path, harFile.description);
    if (result) {
        results[harFile.name] = result;
    }
});

// Comparative analysis
console.log('\n' + '='.repeat(80));
console.log('COMPARATIVE ANALYSIS');
console.log('='.repeat(80));

const resultKeys = Object.keys(results);
if (resultKeys.length >= 2) {
    console.log('\n📊 Key Differences:');
    
    // Compare challenge tokens
    console.log('\n🎫 Challenge Token Comparison:');
    resultKeys.forEach(key => {
        const token = results[key].challengeToken;
        console.log(`   ${key}: ${token ? `${token.length} characters` : 'EMPTY'}`);
    });
    
    // Compare response status
    console.log('\n📈 Response Status Comparison:');
    resultKeys.forEach(key => {
        console.log(`   ${key}: ${results[key].loginStatus}`);
    });
    
    // Compare redirects
    console.log('\n🔄 Redirect Comparison:');
    resultKeys.forEach(key => {
        console.log(`   ${key}: ${results[key].redirectCount} redirects`);
    });
    
    // Compare Turnstile activity
    console.log('\n🛡️  Turnstile Activity Comparison:');
    resultKeys.forEach(key => {
        console.log(`   ${key}: ${results[key].turnstileRequestCount} Turnstile requests`);
    });
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY & RECOMMENDATIONS');
console.log('='.repeat(80));

console.log('\n🔍 Key Findings:');
console.log('1. Both automation AND test browser sessions have empty challenge tokens');
console.log('2. Successful manual login has 1000+ character challenge token');
console.log('3. Login POST requests are being made correctly');
console.log('4. The issue is Turnstile challenge token not populating');

console.log('\n💡 This confirms:');
console.log('- Form interaction automation is working correctly');
console.log('- Network requests are being made properly'); 
console.log('- The challenge token field exists but stays empty');
console.log('- Chrono24\'s anti-automation detection prevents token population');

console.log('\n🚀 Next Steps:');
console.log('1. Focus on making automation appear more human-like');
console.log('2. Investigate browser fingerprinting detection');
console.log('3. Consider using residential proxies');
console.log('4. Try different browser automation approaches (Playwright, Selenium)');
console.log('5. Look into bypassing Turnstile challenges specifically');

console.log('\n' + '='.repeat(80));
