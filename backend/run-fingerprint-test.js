const BrowserFingerprintAnalyzer = require('./fingerprint-comparison');

async function runFingerprintAnalysis() {
  console.log('🔍 Browser Fingerprint Comparison Tool');
  console.log('=====================================\n');

  try {
    const analyzer = new BrowserFingerprintAnalyzer();

    // Run automated browser analysis
    console.log('Step 1: Analyzing automated browser...');
    await analyzer.analyzeAutomatedBrowser();

    // Generate manual test page
    console.log('\nStep 2: Generating manual test page...');
    await analyzer.generateManualTestPage();

    // Save automated results
    console.log('\nStep 3: Saving automated fingerprint...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs-extra');
    await fs.writeFile(`automated-fingerprint-${timestamp}.json`, JSON.stringify(analyzer.results.automated, null, 2));

    console.log('\n✅ Analysis complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Open "fingerprint-test.html" in your regular browser');
    console.log('2. Copy the fingerprint results from the webpage');
    console.log('3. Save the results as "manual-fingerprint.json"');
    console.log('4. Run comparison analysis');

    console.log('\n🔍 Key areas to check in the automated fingerprint:');
    console.log('- navigator.webdriver:', analyzer.results.automated.navigator.webdriver);
    console.log('- Chrome runtime:', analyzer.results.automated.chrome.runtime_present);
    console.log('- Plugins count:', analyzer.results.automated.plugins.length);
    console.log('- WebGL vendor:', analyzer.results.automated.webgl.vendor);
    console.log(
      '- Automation markers:',
      Object.values(analyzer.results.automated.automation_markers).some((v) => v === true),
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runFingerprintAnalysis();
