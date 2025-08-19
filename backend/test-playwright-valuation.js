const playwrightChrono24Service = require('./services/playwrightChrono24Service');

async function testPlaywrightValuation() {
  console.log('🎭 Testing Playwright Chrono24 Service...');
  console.log('🔍 This should have much better anti-bot evasion than Puppeteer');

  // Test with the Omega Speedmaster Racing reference number
  const refNumber = '326.30.40.50.06.001';

  try {
    console.log(`📝 Testing evaluation for: ${refNumber}`);

    const startTime = Date.now();
    const result = await playwrightChrono24Service.evaluateWatch(refNumber);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 ===== EVALUATION SUCCESS! =====');
    console.log('📊 Results:', JSON.stringify(result, null, 2));

    // Verify the calculation is correct (80% of min price)
    const expectedTarget = Math.round(result.minPrice * 0.8);
    const calculationCorrect = result.targetPrice === expectedTarget;

    console.log(`\n🔍 Calculation Verification:`);
    console.log(`Min Price: $${result.minPrice.toLocaleString()}`);
    console.log(`Max Price: $${result.maxPrice.toLocaleString()}`);
    console.log(`Average Price: $${result.avgPrice.toLocaleString()}`);
    console.log(`Target Price (80%): $${result.targetPrice.toLocaleString()}`);
    console.log(`Expected: $${expectedTarget.toLocaleString()}`);
    console.log(`Calculation Correct: ${calculationCorrect ? '✅' : '❌'}`);
    console.log(`Confidence Level: ${result.confidence}`);
    console.log(`Processing Time: ${processingTime}s`);

    console.log(`\n📈 Price Range Analysis:`);
    console.log(`Spread: ${result.priceRange.spreadPercentage}%`);
    console.log(`Range: $${result.priceRange.min.toLocaleString()} - $${result.priceRange.max.toLocaleString()}`);

    if (result.confidence === 'High') {
      console.log('🎯 HIGH CONFIDENCE - Great data quality!');
    } else if (result.confidence === 'Medium') {
      console.log('⚡ MEDIUM CONFIDENCE - Good data available');
    } else {
      console.log('⚠️ LOW CONFIDENCE - Limited data points');
    }
  } catch (error) {
    console.error('\n❌ ===== TEST FAILED =====');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n🔍 Common issues and solutions:');
    console.log('1. ❌ Elements not found → Page structure changed or anti-bot detected');
    console.log('2. ❌ Timeout errors → Network issues or site blocking');
    console.log('3. ❌ Navigation failures → IP blocked or geographic restrictions');
    console.log('\n💡 Playwright advantages over Puppeteer:');
    console.log('✅ Better stealth (no webdriver traces)');
    console.log('✅ Real browser contexts (like incognito++)');
    console.log('✅ Advanced device emulation');
    console.log('✅ Built-in network interception');
    console.log('✅ More human-like interactions');
  } finally {
    console.log('\n🧹 Cleaning up Playwright resources...');
    await playwrightChrono24Service.cleanup();
    console.log('✅ Test completed');
  }
}

testPlaywrightValuation().catch(console.error);
