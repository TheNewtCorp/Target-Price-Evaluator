const chrono24Service = require('./services/chrono24Service');

async function testValuationService() {
  console.log('🧪 Testing updated chrono24Service with valuation approach...');

  // Test with the Omega Speedmaster Racing reference number
  const refNumber = '326.30.40.50.06.001';

  try {
    console.log(`📝 Testing evaluation for: ${refNumber}`);

    const result = await chrono24Service.evaluateWatch(refNumber);

    console.log('✅ Evaluation completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));

    // Verify the calculation is correct (80% of min price)
    const expectedTarget = Math.round(result.minPrice * 0.8);
    const calculationCorrect = result.targetPrice === expectedTarget;

    console.log(`\n🔍 Calculation verification:`);
    console.log(`Min Price: $${result.minPrice}`);
    console.log(`Target Price (80%): $${result.targetPrice}`);
    console.log(`Expected: $${expectedTarget}`);
    console.log(`Calculation Correct: ${calculationCorrect ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await chrono24Service.cleanup();
    console.log('✅ Test completed');
  }
}

testValuationService().catch(console.error);
