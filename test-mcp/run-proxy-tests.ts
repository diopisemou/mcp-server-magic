/**
 * MCP Proxy Server Generation Test Runner
 * 
 * This script tests the generation of MCP proxy servers that act as a
 * middleware between MCP clients and existing APIs.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ServerConfig, Endpoint, AuthType } from '../src/types';
import { generateServer } from '../src/utils/serverGenerator';

// Extended interface for proxy-specific properties
interface ExtendedServerConfig extends ServerConfig {
  mode?: 'direct' | 'proxy';
  targetBaseUrl?: string;
  cacheEnabled?: boolean;
  rateLimitingEnabled?: boolean;
}

interface ProxyTestCase {
  name: string;
  language: 'TypeScript' | 'Python';
  authentication: AuthType;
  cacheEnabled: boolean;
  rateLimitingEnabled: boolean;
  targetBaseUrl: string;
}

const PROXY_TEST_CASES: ProxyTestCase[] = [
  {
    name: 'TypeScript-Proxy-NoAuth',
    language: 'TypeScript',
    authentication: 'None',
    cacheEnabled: false,
    rateLimitingEnabled: false,
    targetBaseUrl: 'https://api.example.com'
  },
  {
    name: 'TypeScript-Proxy-ApiKey-Cache',
    language: 'TypeScript',
    authentication: 'API Key',
    cacheEnabled: true,
    rateLimitingEnabled: false,
    targetBaseUrl: 'https://api.example.com'
  },
  {
    name: 'Python-Proxy-ApiKey-RateLimit',
    language: 'Python',
    authentication: 'API Key',
    cacheEnabled: false,
    rateLimitingEnabled: true,
    targetBaseUrl: 'https://weather.example.com/api/v1'
  },
  {
    name: 'Python-Proxy-Bearer-Full',
    language: 'Python',
    authentication: 'Bearer Token',
    cacheEnabled: true,
    rateLimitingEnabled: true,
    targetBaseUrl: 'https://data.example.com/api'
  }
];

/**
 * Sample endpoints for testing
 */
const SAMPLE_ENDPOINTS: Endpoint[] = [
  {
    id: 'weather-current',
    path: '/weather/current',
    method: 'GET',
    description: 'Get current weather data',
    parameters: [
      {
        name: 'location',
        type: 'string',
        required: true,
        description: 'City name or coordinates'
      },
      {
        name: 'units',
        type: 'string',
        required: false,
        description: 'Units of measurement (metric or imperial)'
      }
    ],
    responses: [],
    mcpType: 'resource',
    selected: true
  },
  {
    id: 'weather-forecast',
    path: '/weather/forecast',
    method: 'POST',
    description: 'Get weather forecast',
    parameters: [
      {
        name: 'location',
        type: 'string',
        required: true,
        description: 'City name or coordinates'
      },
      {
        name: 'days',
        type: 'integer',
        required: true,
        description: 'Number of days to forecast'
      }
    ],
    responses: [],
    mcpType: 'tool',
    selected: true
  }
];

/**
 * Run all MCP proxy server generation tests
 */
async function runProxyTests() {
  console.log(chalk.blue.bold('=== MCP Proxy Server Generation Tests ===\n'));
  
  // Create output directory
  const outputDir = path.join(__dirname, 'output', 'proxy-tests');
  fs.ensureDirSync(outputDir);
  
  // Run tests for each test case
  const results: Record<string, { success: boolean; files: number; errors?: string[] }> = {};
  
  for (const testCase of PROXY_TEST_CASES) {
    console.log(chalk.cyan(`\n📝 Testing ${testCase.name}...\n`));
    
    // Prepare config for this test case
    const config: ExtendedServerConfig = {
      name: `MCP-Proxy-${testCase.name}`,
      description: `MCP Proxy Server for testing ${testCase.language} implementation`,
      language: testCase.language,
      mode: 'proxy',
      targetBaseUrl: testCase.targetBaseUrl,
      cacheEnabled: testCase.cacheEnabled,
      rateLimitingEnabled: testCase.rateLimitingEnabled,
      authentication: {
        type: testCase.authentication,
        location: 'header',
        name: testCase.authentication === 'API Key' ? 'X-API-Key' : 'Authorization'
      },
      hosting: {
        provider: 'Self-hosted',
        type: 'Container'
      },
      endpoints: SAMPLE_ENDPOINTS,
      authSecret: 'test-api-key-12345'
    };
    
    // Generate server for this test case
    const testCaseDir = path.join(outputDir, testCase.name);
    fs.ensureDirSync(testCaseDir);
    
    try {
      // Call generateServer which should use the proxy mode
      const generationResult = await generateServer(config);
      
      if (!generationResult.success || !generationResult.files) {
        console.log(chalk.red(`❌ Failed to generate ${testCase.language} proxy server:`));
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
      
      console.log(chalk.green(`✅ Generated ${files.length} files for ${testCase.language} proxy server`));
      
      // Check for required proxy MCP-related files/content
      const fileErrors: string[] = [];
      const requiredFeatures = getRequiredFeatures(testCase);
      
      for (const feature of requiredFeatures) {
        const files = feature.files.map(f => path.join(testCaseDir, f));
        const missingFiles = files.filter(f => !fs.existsSync(f));
        
        if (missingFiles.length > 0) {
          fileErrors.push(`Missing required file for ${feature.name}: ${missingFiles.join(', ')}`);
          continue;
        }
        
        // Check content of files if pattern is provided
        if (feature.contentPattern) {
          const hasContentMatch = files.some(file => {
            if (fs.existsSync(file)) {
              const content = fs.readFileSync(file, 'utf8');
              return feature.contentPattern!.test(content);
            }
            return false;
          });
          
          if (!hasContentMatch) {
            fileErrors.push(`Required pattern not found for ${feature.name}`);
          }
        }
      }
      
      if (fileErrors.length > 0) {
        console.log(chalk.yellow('⚠️ File check found issues:'));
        fileErrors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
        results[testCase.name] = { success: false, files: files.length, errors: fileErrors };
      } else {
        console.log(chalk.green('✅ All required MCP features are present'));
        results[testCase.name] = { success: true, files: files.length };
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error in test case:'), error);
      results[testCase.name] = { 
        success: false, 
        files: 0, 
        errors: [error.message || 'Unknown error during test execution'] 
      };
    }
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n=== Proxy Test Results Summary ===\n'));
  
  let allPassed = true;
  
  for (const testCase of PROXY_TEST_CASES) {
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
    console.log(chalk.green('✅ All proxy tests passed!'));
  } else {
    console.log(chalk.yellow('⚠️ Some proxy tests failed. Check the logs for details.'));
  }
  
  console.log(chalk.blue(`\nOutput directory: ${outputDir}`));
}

/**
 * Get required features for a specific test case
 */
function getRequiredFeatures(testCase: ProxyTestCase): Array<{
  name: string;
  files: string[];
  contentPattern?: RegExp;
}> {
  const features: Array<{
    name: string;
    files: string[];
    contentPattern?: RegExp;
  }> = [];
  
  // Add base MCP features by language
  if (testCase.language === 'TypeScript') {
    features.push({
      name: 'MCP TypeScript SDK',
      files: ['/src/index.ts', '/package.json'],
      contentPattern: /@modelcontextprotocol\/sdk/
    });
    
    features.push({
      name: 'MCP TypeScript Server',
      files: ['/src/index.ts'],
      contentPattern: /from '@modelcontextprotocol\/sdk\/server\/index\.js'/
    });
  } else if (testCase.language === 'Python') {
    features.push({
      name: 'MCP Python Library',
      files: ['/requirements.txt'],
      contentPattern: /mcp-server/
    });
    
    features.push({
      name: 'MCP Python Server',
      files: ['/main.py'],
      contentPattern: /from mcp_server import Server/
    });
  }
  
  // Add authentication features if needed
  if (testCase.authentication !== 'None') {
    if (testCase.language === 'TypeScript') {
      features.push({
        name: 'Authentication',
        files: ['/src/index.ts'],
        contentPattern: new RegExp(testCase.authentication === 'API Key' ? 
          /apiKey = headers\['/ : 
          /Bearer/)
      });
    } else {
      features.push({
        name: 'Authentication',
        files: ['/main.py'],
        contentPattern: new RegExp(testCase.authentication === 'API Key' ? 
          /api_key = headers\.get/ : 
          /Bearer/)
      });
    }
  }
  
  // Add caching features if enabled
  if (testCase.cacheEnabled) {
    if (testCase.language === 'TypeScript') {
      features.push({
        name: 'Caching',
        files: ['/src/services/proxyService.ts'],
        contentPattern: /NodeCache/
      });
    } else {
      features.push({
        name: 'Caching',
        files: ['/services/proxy_service.py'],
        contentPattern: /TTLCache/
      });
    }
  }
  
  // Add rate limiting features if enabled
  if (testCase.rateLimitingEnabled) {
    if (testCase.language === 'TypeScript') {
      features.push({
        name: 'Rate Limiting',
        files: ['/src/services/proxyService.ts'],
        contentPattern: /rateLimiter/
      });
    } else {
      features.push({
        name: 'Rate Limiting',
        files: ['/services/proxy_service.py'],
        contentPattern: /check_rate_limit/
      });
    }
  }
  
  // Resource and tool handlers
  if (testCase.language === 'TypeScript') {
    features.push({
      name: 'MCP Tool Handlers',
      files: ['/src/index.ts'],
      contentPattern: /CallToolRequestSchema/
    });
    
    features.push({
      name: 'MCP Resource Handlers',
      files: ['/src/index.ts'],
      contentPattern: /ReadResourceRequestSchema/
    });
  } else {
    features.push({
      name: 'MCP Tool Handlers',
      files: ['/main.py'],
      contentPattern: /CallToolRequest/
    });
    
    features.push({
      name: 'MCP Resource Handlers',
      files: ['/main.py'],
      contentPattern: /ReadResourceRequest/
    });
  }
  
  return features;
}

// Run tests if called directly
if (require.main === module) {
  runProxyTests().catch(error => {
    console.error(chalk.red('Error running proxy tests:'), error);
    process.exit(1);
  });
}

export { runProxyTests };
