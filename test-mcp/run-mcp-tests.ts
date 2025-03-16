/**
 * MCP Server Generation Test Runner
 * 
 * This script tests the generation of MCP servers in all supported languages
 * and validates them against the MCP protocol specification.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { generateNodeServer } from '../src/utils/serverTemplates/nodeServer';
import { generatePythonServer } from '../src/utils/serverTemplates/pythonServer';
import { generateGoServer } from '../src/utils/serverTemplates/goServer';
import { ServerConfig, Endpoint, AuthType } from '../src/types';

interface TestCase {
  name: string;
  language: 'TypeScript' | 'Python' | 'Go';
  authentication: AuthType;
  selectedEndpoints: string[];
}

const TEST_CASES: TestCase[] = [
  {
    name: 'TypeScript-NoAuth',
    language: 'TypeScript',
    authentication: 'None',
    selectedEndpoints: ['all']
  },
  {
    name: 'Python-ApiKey',
    language: 'Python',
    authentication: 'API Key',
    selectedEndpoints: ['all']
  },
  {
    name: 'Go-ApiKey',
    language: 'Go',
    authentication: 'API Key',
    selectedEndpoints: ['all']
  }
];

/**
 * Run all MCP server generation tests
 */
async function runTests() {
  console.log(chalk.blue.bold('=== MCP Server Generation Tests ===\n'));
  
  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  fs.ensureDirSync(outputDir);
  
  // Load OpenAPI definition
  const openApiPath = path.join(__dirname, 'openapi-sample.json');
  if (!fs.existsSync(openApiPath)) {
    console.error(chalk.red('❌ OpenAPI sample file not found. Run with --init to create sample files.'));
    process.exit(1);
  }
  
  const apiDefinition = JSON.parse(fs.readFileSync(openApiPath, 'utf8')) as Record<string, unknown>;
  
  // Extract endpoints from OpenAPI definition
  const endpoints = extractEndpointsFromOpenApi(apiDefinition);
  
  // Run tests for each test case
  const results: Record<string, { success: boolean; files: number; errors?: string[] }> = {};
  
  for (const testCase of TEST_CASES) {
    console.log(chalk.cyan(`\n📝 Testing ${testCase.name}...\n`));
    
    // Prepare config for this test case
    const config: ServerConfig = {
      name: `MCP-Test-${testCase.name}`,
      description: `MCP Server for testing ${testCase.language} implementation`,
      language: testCase.language,
      authentication: {
        type: testCase.authentication,
        location: 'header',
        name: testCase.authentication === 'API Key' ? 'X-API-Key' : 'Authorization'
      },
      hosting: {
        provider: 'Self-hosted',
        type: 'Container'
      },
      endpoints: endpoints.map(endpoint => ({
        ...endpoint,
        selected: testCase.selectedEndpoints.includes('all') || 
                 testCase.selectedEndpoints.includes(endpoint.path)
      })),
      authSecret: 'test-api-key-12345'
    };
    
    // Generate server for this test case
    const testCaseDir = path.join(outputDir, testCase.name);
    fs.ensureDirSync(testCaseDir);
    
    let generationResult;
    
    switch (testCase.language) {
      case 'TypeScript':
        generationResult = generateNodeServer(config);
        break;
      case 'Python':
        generationResult = generatePythonServer(config);
        break;
      case 'Go':
        generationResult = generateGoServer(config);
        break;
    }
    
    if (!generationResult.success || !generationResult.files) {
      console.log(chalk.red(`❌ Failed to generate ${testCase.language} server:`));
      console.log(generationResult.error || 'Unknown error');
      results[testCase.name] = { success: false, files: 0, errors: [generationResult.error || 'Unknown error'] };
      continue;
    }
    
    // Write files to disk
    const files = generationResult.files;
    for (const file of files) {
      const filePath = path.join(testCaseDir, file.path, file.name);
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, file.content);
    }
    
    console.log(chalk.green(`✅ Generated ${files.length} files for ${testCase.language} server`));
    
    // Check for required MCP files
    const fileErrors: string[] = [];
    const requiredFiles = getRequiredFilesForLanguage(testCase.language);
    
    for (const requiredFile of requiredFiles) {
      const filePath = path.join(testCaseDir, requiredFile);
      if (!fs.existsSync(filePath)) {
        fileErrors.push(`Missing required file: ${requiredFile}`);
      }
    }
    
    if (fileErrors.length > 0) {
      console.log(chalk.yellow('⚠️ File check found issues:'));
      fileErrors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
      results[testCase.name] = { success: false, files: files.length, errors: fileErrors };
    } else {
      console.log(chalk.green('✅ All required files are present'));
      results[testCase.name] = { success: true, files: files.length };
    }
    
    // TODO: If we had a way to automatically start the server and test it with the validator
    // that would go here. For now, we're just checking that all required files are generated.
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n=== Test Results Summary ===\n'));
  
  let allPassed = true;
  
  for (const testCase of TEST_CASES) {
    const result = results[testCase.name];
    if (!result) continue;
    
    if (result.success) {
      console.log(`${chalk.green('✓')} ${chalk.bold(testCase.name)}: Generated ${result.files} files successfully`);
    } else {
      console.log(`${chalk.red('✗')} ${chalk.bold(testCase.name)}: Failed`);
      if (result.errors) {
        result.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      }
      allPassed = false;
    }
  }
  
  console.log('\n');
  if (allPassed) {
    console.log(chalk.green('✅ All tests passed!'));
  } else {
    console.log(chalk.yellow('⚠️ Some tests failed. Check the logs for details.'));
  }
  
  console.log(chalk.blue(`\nOutput directory: ${outputDir}`));
  console.log(chalk.blue('To use the MCP validator on a running server, run:'));
  console.log(chalk.blue('npm run validate http://localhost:3000 [apiKey]'));
}

/**
 * Extract endpoints from OpenAPI definition
 */
function extractEndpointsFromOpenApi(apiDefinition: Record<string, unknown>): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const paths = (apiDefinition.paths as Record<string, unknown>) || {};
  
  Object.entries(paths).forEach(([path, methods]) => {
    const methodsObj = methods as Record<string, unknown>;
    Object.entries(methodsObj).forEach(([method, spec]) => {
      // Convert method to uppercase as a valid HTTP method
      const methodUpper = method.toUpperCase();
      // Only process if it's a valid HTTP method we can handle
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(methodUpper)) {
        return;
      }
      
      const httpMethod = methodUpper as Endpoint["method"];
      const specObj = spec as Record<string, unknown>;
      
      // Determine if endpoint is resource or tool based on HTTP method
      const mcpType = httpMethod === 'GET' ? 'resource' as const : 'tool' as const;
      
      // Extract parameters
      const paramArray = (specObj.parameters as Array<Record<string, unknown>>) || [];
      const parameters = paramArray.map(param => ({
        name: param.name as string,
        type: ((param.schema as Record<string, unknown>)?.type as string) || 'string',
        required: Boolean(param.required),
        description: (param.description as string) || ''
      }));
      
      // Add path parameters from route
      path.split('/').forEach(segment => {
        if (segment.startsWith('{') && segment.endsWith('}')) {
          const paramName = segment.slice(1, -1);
          
          // Check if parameter already exists
          const existing = parameters.find(p => p.name === paramName);
          if (!existing) {
            parameters.push({
              name: paramName,
              type: 'string',
              required: true,
              description: `Path parameter: ${paramName}`
            });
          }
        }
      });
      
      // Add endpoint
      endpoints.push({
        id: `${path}-${httpMethod}`,
        path,
        method: httpMethod,
        description: (specObj.summary as string) || (specObj.description as string) || `${httpMethod} ${path}`,
        parameters,
        responses: [],
        mcpType,
        selected: true
      });
    });
  });
  
  return endpoints;
}

/**
 * Get required files for each language
 */
function getRequiredFilesForLanguage(language: string): string[] {
  switch (language) {
    case 'TypeScript':
      return [
        'package.json',
        'tsconfig.json',
        'src/index.ts',
        'src/routes/resourceRoutes.ts',
        'src/routes/toolRoutes.ts'
      ];
    case 'Python':
      return [
        'main.py',
        'requirements.txt',
        'routes/resources.py',
        'routes/tools.py'
      ];
    case 'Go':
      return [
        'go.mod',
        'main.go',
        'handlers.go'
      ];
    default:
      return [];
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(chalk.red('Error running tests:'), error);
    process.exit(1);
  });
}
