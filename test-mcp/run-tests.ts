import { ServerGenerationTester } from './server-generation-tester';
import { ValidationResult } from './mcp-server-validator';
import * as path from 'path';

const TEST_RESULTS: Record<string, ValidationResult> = {};

/**
 * Run all MCP server generation tests with different configurations
 */
async function runAllTests() {
  console.log('Starting MCP Server Generation Tests');
  console.log('===================================');

  const openApiSamplePath = path.join(__dirname, 'openapi-sample.json');
  
  // Test 1: TypeScript with API Key auth
  await runTest(
    'TypeScript-APIKey',
    openApiSamplePath,
    'TypeScript',
    'API Key'
  );
  
  // Test 2: TypeScript with Bearer Token auth
  await runTest(
    'TypeScript-BearerToken',
    openApiSamplePath,
    'TypeScript',
    'Bearer Token'
  );
  
  // Test 3: TypeScript with no auth
  await runTest(
    'TypeScript-NoAuth',
    openApiSamplePath,
    'TypeScript',
    'None'
  );
  
  // Test 4: Python with API Key auth
  await runTest(
    'Python-APIKey',
    openApiSamplePath,
    'Python',
    'API Key'
  );
  
  // Test 5: Python with Bearer Token auth
  await runTest(
    'Python-BearerToken',
    openApiSamplePath,
    'Python',
    'Bearer Token'
  );
  
  // Test 6: Python with no auth
  await runTest(
    'Python-NoAuth',
    openApiSamplePath,
    'Python',
    'None'
  );
  
  // Print summary
  printSummary();
}

/**
 * Run a single test with the specified configuration
 * @param testName Name of the test
 * @param openApiPath Path to the OpenAPI definition
 * @param language Language to use for the server
 * @param authType Authentication type
 */
async function runTest(
  testName: string,
  openApiPath: string,
  language: 'TypeScript' | 'Python',
  authType: 'None' | 'API Key' | 'Bearer Token'
) {
  console.log(`\nRunning test: ${testName}`);
  console.log('-'.repeat(50));
  
  try {
    const tester = new ServerGenerationTester(openApiPath);
    const result = await tester.runFullTest(language, authType);
    
    TEST_RESULTS[testName] = result;
    
    console.log(`Test ${testName} ${result.valid ? 'PASSED ✅' : 'FAILED ❌'}`);
    if (!result.valid && result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error(`Test ${testName} encountered an exception:`, error);
    TEST_RESULTS[testName] = {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Print a summary of all test results
 */
function printSummary() {
  console.log('\n===== TEST SUMMARY =====');
  
  let totalTests = 0;
  let passedTests = 0;
  
  Object.entries(TEST_RESULTS).forEach(([testName, result]) => {
    totalTests++;
    if (result.valid) {
      passedTests++;
    }
    
    console.log(`${testName}: ${result.valid ? 'PASSED ✅' : 'FAILED ❌'}`);
  });
  
  const passRate = (passedTests / totalTests) * 100;
  
  console.log(`\nPassed ${passedTests}/${totalTests} tests (${passRate.toFixed(2)}%)`);
  
  // Output overall result
  if (passedTests === totalTests) {
    console.log('\n✅ ALL TESTS PASSED!');
  } else {
    console.log(`\n❌ ${totalTests - passedTests} TEST(S) FAILED`);
    process.exit(1); // Exit with failure code
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Test suite failed to run:', error);
  process.exit(1);
});
