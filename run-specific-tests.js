// Specific test runner for the two target tests
// Run this in the browser console at http://localhost:8000/test-suite.html

(async function runSpecificTests() {
    console.log('🧪 Running specific tests for recent MainUI fixes...\n');
    
    // Wait for test runner to be available
    if (!window.runner) {
        console.error('❌ Test runner not found. Make sure you are on the test-suite.html page.');
        return;
    }
    
    const results = [];
    
    // Test 1: Randomization Uniqueness & Species Coverage
    console.log('1️⃣ Running "Randomization Uniqueness & Species Coverage" test...');
    try {
        await window.runner.runTest('randomize-uniqueness');
        const result1 = window.runner.results.get('randomize-uniqueness');
        results.push({
            name: 'Randomization Uniqueness & Species Coverage',
            passed: result1?.passed || false,
            duration: result1?.duration || 0,
            error: result1?.error?.message || null,
            details: result1?.result || null
        });
        console.log(`✅ Test 1 ${result1?.passed ? 'PASSED' : 'FAILED'} in ${result1?.duration}ms`);
        if (result1?.result) {
            console.log(`   • Unique scenarios: ${result1.result.uniqueScenarios}/7 expected`);
            console.log(`   • Unique parameters: ${result1.result.uniqueParameters}/10 attempts`);
        }
        if (result1?.error) {
            console.log(`   ❌ Error: ${result1.error.message}`);
        }
    } catch (error) {
        console.log(`❌ Test 1 FAILED: ${error.message}`);
        results.push({
            name: 'Randomization Uniqueness & Species Coverage',
            passed: false,
            error: error.message
        });
    }
    
    console.log('\n2️⃣ Running "Effect Mutual Exclusion" test...');
    try {
        await window.runner.runTest('randomize-effect-exclusion');
        const result2 = window.runner.results.get('randomize-effect-exclusion');
        results.push({
            name: 'Effect Mutual Exclusion',
            passed: result2?.passed || false,
            duration: result2?.duration || 0,
            error: result2?.error?.message || null,
            details: result2?.result || null
        });
        console.log(`✅ Test 2 ${result2?.passed ? 'PASSED' : 'FAILED'} in ${result2?.duration}ms`);
        if (result2?.result) {
            console.log(`   • Mutual exclusion enforced: ${result2.result.mutualExclusionEnforced ? 'YES' : 'NO'}`);
            console.log(`   • Iterations tested: ${result2.result.iterationsTested}`);
        }
        if (result2?.error) {
            console.log(`   ❌ Error: ${result2.error.message}`);
        }
    } catch (error) {
        console.log(`❌ Test 2 FAILED: ${error.message}`);
        results.push({
            name: 'Effect Mutual Exclusion',
            passed: false,
            error: error.message
        });
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    
    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const timing = result.duration ? ` (${result.duration}ms)` : '';
        console.log(`${index + 1}. ${result.name}: ${status}${timing}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All targeted tests are now PASSING! Your MainUI fixes are working correctly.');
    } else {
        console.log('⚠️  Some tests are still failing. The issues may not be fully resolved.');
    }
    
    return results;
})();