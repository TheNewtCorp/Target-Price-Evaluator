const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');

class BrowserFingerprintAnalyzer {
  constructor() {
    this.results = {
      automated: null,
      manual: null,
      differences: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Comprehensive fingerprinting script to run in browser
  getFingerprintingScript() {
    return `
    (function() {
      const fingerprint = {};
      
      // 1. Navigator Properties
      fingerprint.navigator = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub,
        productSub: navigator.productSub,
        appName: navigator.appName,
        appVersion: navigator.appVersion,
        buildID: navigator.buildID,
        oscpu: navigator.oscpu,
        webdriver: navigator.webdriver
      };

      // 2. Screen Properties
      fingerprint.screen = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation ? {
          angle: screen.orientation.angle,
          type: screen.orientation.type
        } : null
      };

      // 3. Window Properties
      fingerprint.window = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        screenX: window.screenX,
        screenY: window.screenY,
        devicePixelRatio: window.devicePixelRatio
      };

      // 4. WebDriver Detection
      fingerprint.webdriver_detection = {
        navigator_webdriver: navigator.webdriver,
        window_webdriver: window.webdriver,
        document_webdriver: document.webdriver,
        navigator_selenium: navigator.selenium,
        window_selenium: window.selenium,
        document_selenium: document.selenium,
        webdriver_in_window: Object.keys(window).filter(key => key.includes('webdriver')),
        webdriver_in_navigator: Object.keys(navigator).filter(key => key.includes('webdriver')),
        webdriver_in_document: Object.keys(document).filter(key => key.includes('webdriver'))
      };

      // 5. Chrome Runtime Detection
      fingerprint.chrome = {
        runtime_present: !!(window.chrome && window.chrome.runtime),
        runtime_onConnect: !!(window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect),
        runtime_onMessage: !!(window.chrome && window.chrome.runtime && window.chrome.runtime.onMessage),
        loadTimes_present: !!(window.chrome && window.chrome.loadTimes),
        csi_present: !!(window.chrome && window.chrome.csi),
        app_present: !!(window.chrome && window.chrome.app)
      };

      // 6. Plugin Detection
      fingerprint.plugins = {
        length: navigator.plugins.length,
        plugins: Array.from(navigator.plugins).map(plugin => ({
          name: plugin.name,
          description: plugin.description,
          filename: plugin.filename
        }))
      };

      // 7. WebGL Fingerprinting
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          fingerprint.webgl = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            extensions: gl.getSupportedExtensions(),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
          };
        }
      } catch (e) {
        fingerprint.webgl = { error: e.message };
      }

      // 8. Canvas Fingerprinting
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint test 🔍', 2, 2);
        fingerprint.canvas = {
          dataURL: canvas.toDataURL()
        };
      } catch (e) {
        fingerprint.canvas = { error: e.message };
      }

      // 9. Audio Context Fingerprinting
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        fingerprint.audio = {
          sampleRate: audioContext.sampleRate,
          maxChannelCount: audioContext.destination.maxChannelCount,
          numberOfInputs: audioContext.destination.numberOfInputs,
          numberOfOutputs: audioContext.destination.numberOfOutputs,
          channelCount: audioContext.destination.channelCount,
          channelCountMode: audioContext.destination.channelCountMode,
          channelInterpretation: audioContext.destination.channelInterpretation
        };
        
        audioContext.close();
      } catch (e) {
        fingerprint.audio = { error: e.message };
      }

      // 10. Permissions API
      fingerprint.permissions = {};
      if (navigator.permissions && navigator.permissions.query) {
        fingerprint.permissions.api_available = true;
      } else {
        fingerprint.permissions.api_available = false;
      }

      // 11. Battery API
      fingerprint.battery = {};
      if (navigator.getBattery) {
        fingerprint.battery.api_available = true;
      } else {
        fingerprint.battery.api_available = false;
      }

      // 12. WebRTC Detection
      fingerprint.webrtc = {
        RTCPeerConnection: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      };

      // 13. Automation Detection Markers
      fingerprint.automation_markers = {
        automation_controlled: document.querySelector('[automation-controlled]') !== null,
        phantom_marker: !!(window.phantom || window._phantom),
        selenium_marker: !!(window.selenium || document.selenium),
        webdriver_marker: !!(window.webdriver || document.webdriver || navigator.webdriver),
        callPhantom: typeof window.callPhantom === 'function',
        spawn: typeof window.spawn === 'function',
        buffer: typeof window.Buffer === 'function',
        emit: typeof window.emit === 'function'
      };

      // 14. Performance & Timing
      fingerprint.performance = {
        navigation: performance.navigation ? {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        } : null,
        timing: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd,
          domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
        } : null
      };

      // 15. Error Stack Traces (can reveal automation)
      try {
        throw new Error('Test error for stack trace analysis');
      } catch (e) {
        fingerprint.stackTrace = e.stack;
      }

      return fingerprint;
    })();
    `;
  }

  async analyzeAutomatedBrowser() {
    console.log('🤖 Analyzing automated browser fingerprint...');

    let browser = null;
    try {
      // Use the same configuration as our main service
      browser = await chromium.launch({
        headless: false, // Keep visible for comparison
        args: [
          '--no-sandbox',
          '--no-zygote',
          '--single-process',
          '--disable-crashpad',
          '--memory-pressure-off',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--disable-plugins',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        geolocation: { latitude: 26.3683064, longitude: -80.1289321, accuracy: 100 },
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'max-age=0',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Sec-Ch-Ua': '"Google Chrome";v="140", "Chromium";v="140", "Not;A=Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      const page = await context.newPage();

      // Apply the same stealth measures as our main service
      await page.addInitScript(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        window.chrome = {
          runtime: { onConnect: undefined, onMessage: undefined },
        };

        Object.defineProperty(screen, 'availHeight', { value: 1040 });
        Object.defineProperty(screen, 'availWidth', { value: 1920 });
        Object.defineProperty(screen, 'colorDepth', { value: 24 });
        Object.defineProperty(screen, 'pixelDepth', { value: 24 });
      });

      // Navigate to a test page
      await page.goto('about:blank');

      // Run fingerprinting
      const fingerprint = await page.evaluate(this.getFingerprintingScript());
      this.results.automated = fingerprint;

      console.log('✅ Automated browser fingerprint captured');
      return fingerprint;
    } catch (error) {
      console.error('❌ Error analyzing automated browser:', error.message);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  generateFingerprintingHTML() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Browser Fingerprinting Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .result { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .copy-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
            .copy-btn:hover { background: #0056b3; }
            pre { white-space: pre-wrap; font-size: 12px; max-height: 300px; overflow-y: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Browser Fingerprinting Test</h1>
            <p>This page will analyze your browser's fingerprint. Click the button below to run the test.</p>
            
            <button class="copy-btn" onclick="runFingerprinting()">Run Fingerprinting Test</button>
            <button class="copy-btn" onclick="copyResults()">Copy Results to Clipboard</button>
            
            <div id="results"></div>
        </div>

        <script>
            let fingerprintResults = null;
            
            function runFingerprinting() {
                const script = ${JSON.stringify(this.getFingerprintingScript())};
                
                try {
                    fingerprintResults = eval(script);
                    displayResults(fingerprintResults);
                } catch (error) {
                    document.getElementById('results').innerHTML = '<div class="result"><h3>Error</h3><pre>' + error.message + '</pre></div>';
                }
            }
            
            function displayResults(fingerprint) {
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '<div class="result"><h3>Browser Fingerprint Results</h3><pre>' + 
                    JSON.stringify(fingerprint, null, 2) + '</pre></div>';
            }
            
            function copyResults() {
                if (fingerprintResults) {
                    navigator.clipboard.writeText(JSON.stringify(fingerprintResults, null, 2)).then(() => {
                        alert('Results copied to clipboard!');
                    });
                } else {
                    alert('Please run the fingerprinting test first!');
                }
            }
            
            // Auto-run on page load
            window.onload = function() {
                runFingerprinting();
            };
        </script>
    </body>
    </html>
    `;
  }

  async generateManualTestPage() {
    const htmlContent = this.generateFingerprintingHTML();
    const filePath = path.join(__dirname, 'fingerprint-test.html');

    await fs.writeFile(filePath, htmlContent);
    console.log(`📄 Manual fingerprint test page created: ${filePath}`);
    console.log('🌐 Open this file in your regular browser to get manual fingerprint');
    console.log('📋 Copy the results and paste them when prompted');

    return filePath;
  }

  async getManualFingerprint() {
    console.log('\n🔍 To get manual browser fingerprint:');
    console.log('1. Open the generated HTML file in your regular browser');
    console.log('2. The fingerprinting will run automatically');
    console.log('3. Click "Copy Results to Clipboard"');
    console.log('4. Paste the results here when prompted\n');

    // In a real implementation, you'd get input from user
    // For now, we'll return a placeholder
    return new Promise((resolve) => {
      console.log('⏳ Waiting for manual fingerprint input...');
      console.log('💡 For now, run the HTML file manually and save the results');
      resolve(null);
    });
  }

  compareFingerprintsDeep(automated, manual) {
    const differences = [];

    const compareObjects = (obj1, obj2, path = '') => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in obj2)) {
          differences.push({
            type: 'missing_in_manual',
            path: currentPath,
            automated_value: obj1[key],
            manual_value: 'MISSING',
          });
        } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          if (obj1[key] !== null && obj2[key] !== null) {
            compareObjects(obj1[key], obj2[key], currentPath);
          } else if (obj1[key] !== obj2[key]) {
            differences.push({
              type: 'value_difference',
              path: currentPath,
              automated_value: obj1[key],
              manual_value: obj2[key],
            });
          }
        } else if (obj1[key] !== obj2[key]) {
          differences.push({
            type: 'value_difference',
            path: currentPath,
            automated_value: obj1[key],
            manual_value: obj2[key],
          });
        }
      }

      for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in obj1)) {
          differences.push({
            type: 'missing_in_automated',
            path: currentPath,
            automated_value: 'MISSING',
            manual_value: obj2[key],
          });
        }
      }
    };

    if (automated && manual) {
      compareObjects(automated, manual);
    }

    return differences;
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fingerprint-comparison-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);

    await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);

    // Also create a summary report
    const summaryFilename = `fingerprint-summary-${timestamp}.md`;
    const summaryPath = path.join(__dirname, summaryFilename);

    const summary = this.generateSummaryReport();
    await fs.writeFile(summaryPath, summary);
    console.log(`📊 Summary report saved to: ${summaryPath}`);

    return { fullReport: filepath, summary: summaryPath };
  }

  generateSummaryReport() {
    const criticalDifferences = this.results.differences.filter((diff) => {
      const criticalPaths = [
        'webdriver_detection',
        'automation_markers',
        'chrome.runtime',
        'navigator.webdriver',
        'plugins',
        'webgl.vendor',
        'webgl.renderer',
      ];
      return criticalPaths.some((path) => diff.path.includes(path));
    });

    return `# Browser Fingerprint Analysis Report

Generated: ${this.results.timestamp}

## Summary
- Total differences found: ${this.results.differences.length}
- Critical automation markers: ${criticalDifferences.length}

## Critical Differences (Automation Detection Vectors)

${criticalDifferences
  .map(
    (diff) => `
### ${diff.path}
- **Type**: ${diff.type}
- **Automated**: ${JSON.stringify(diff.automated_value)}
- **Manual**: ${JSON.stringify(diff.manual_value)}
`,
  )
  .join('\n')}

## Top Recommendations

${
  criticalDifferences.length > 0
    ? `
1. **Priority 1 - Fix automation markers**
   - Remove webdriver properties completely
   - Normalize Chrome runtime objects
   - Fix plugin enumeration

2. **Priority 2 - Hardware fingerprinting**
   - Normalize WebGL renderer/vendor
   - Fix canvas fingerprinting differences
   - Standardize audio context properties

3. **Priority 3 - Behavioral patterns**
   - Add realistic interaction delays
   - Implement mouse movement simulation
   - Randomize typing patterns
`
    : 'No critical automation markers detected - investigate network/behavioral triggers'
}

## Next Steps

1. Implement fixes for critical differences
2. Test with updated fingerprint
3. Compare network request patterns
4. Analyze form submission timing

---
*Use this report to prioritize anti-detection improvements*
`;
  }

  async run() {
    try {
      console.log('🚀 Starting browser fingerprint comparison analysis...\n');

      // Step 1: Analyze automated browser
      await this.analyzeAutomatedBrowser();

      // Step 2: Generate manual test page
      await this.generateManualTestPage();

      // Step 3: Get manual fingerprint (would require user input in real scenario)
      const manualFingerprint = await this.getManualFingerprint();
      this.results.manual = manualFingerprint;

      // Step 4: Compare fingerprints
      if (this.results.automated && this.results.manual) {
        this.results.differences = this.compareFingerprintsDeep(this.results.automated, this.results.manual);
      }

      // Step 5: Save results
      const savedFiles = await this.saveResults();

      console.log('\n📈 Analysis complete!');
      console.log('📁 Files generated:');
      console.log(`   - Fingerprint test page: fingerprint-test.html`);
      console.log(`   - Full report: ${savedFiles.fullReport}`);
      console.log(`   - Summary: ${savedFiles.summary}`);

      return this.results;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new BrowserFingerprintAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = BrowserFingerprintAnalyzer;
