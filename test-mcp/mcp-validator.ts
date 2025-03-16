/**
 * MCP Server Protocol Validator
 * 
 * This tool validates that a generated MCP server complies with the
 * Model Context Protocol specification.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

export interface ValidatorOptions {
  url: string;
  apiKey?: string;
  verbose?: boolean;
}

/**
 * Validates an MCP server implementation against the protocol specification
 */
export async function validateMcpServer(options: ValidatorOptions): Promise<{
  success: boolean;
  results: { test: string; passed: boolean; message?: string }[];
}> {
  const { url, apiKey, verbose = false } = options;
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const results: { test: string; passed: boolean; message?: string }[] = [];
  
  console.log(chalk.blue(`🔍 Validating MCP server at ${baseUrl}`));
  
  try {
    // Test 1: Root endpoint should return server info with capabilities
    if (verbose) console.log(chalk.gray('Testing root endpoint...'));
    
    const rootResponse = await fetch(baseUrl);
    if (!rootResponse.ok) {
      results.push({
        test: 'Root endpoint',
        passed: false,
        message: `HTTP ${rootResponse.status}: ${rootResponse.statusText}`
      });
    } else {
      const rootData = await rootResponse.json() as any;
      
      // Check for required fields
      const hasName = typeof rootData.name === 'string';
      const hasVersion = typeof rootData.version === 'string';
      const hasCapabilities = rootData.capabilities && 
        Array.isArray(rootData.capabilities.resources) && 
        Array.isArray(rootData.capabilities.tools);
      
      if (hasName && hasVersion && hasCapabilities) {
        results.push({
          test: 'Root endpoint',
          passed: true,
          message: `Server: ${rootData.name} v${rootData.version}`
        });
      } else {
        results.push({
          test: 'Root endpoint',
          passed: false,
          message: 'Missing required fields (name, version, capabilities)'
        });
      }
      
      // Extract endpoints for testing
      const resources = rootData.capabilities?.resources || [];
      const tools = rootData.capabilities?.tools || [];
      
      // Test 2: Resource endpoints
      if (resources.length > 0) {
        if (verbose) console.log(chalk.gray(`Testing ${resources.length} resource endpoints...`));
        
        // Test the first resource
        const resourcePath = resources[0];
        const resourceUrl = `${baseUrl}/mcp/resources${resourcePath}`;
        
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        try {
          const resourceResponse = await fetch(resourceUrl, { headers });
          
          if (!resourceResponse.ok) {
            results.push({
              test: 'Resource endpoint',
              passed: false,
              message: `HTTP ${resourceResponse.status}: ${resourceResponse.statusText}`
            });
          } else {
            const resourceData = await resourceResponse.json() as any;
            
            // Check resource response format
            const hasSuccess = typeof resourceData.success === 'boolean';
            const hasData = typeof resourceData.data === 'object';
            const hasDataId = hasData && typeof resourceData.data.id === 'string';
            const hasContent = hasData && Array.isArray(resourceData.data.content);
            
            if (hasSuccess && hasData && hasDataId && hasContent) {
              results.push({
                test: 'Resource endpoint',
                passed: true,
                message: `Successfully accessed resource: ${resourcePath}`
              });
            } else {
              results.push({
                test: 'Resource endpoint',
                passed: false,
                message: 'Invalid resource response format'
              });
            }
          }
        } catch (error) {
          results.push({
            test: 'Resource endpoint',
            passed: false,
            message: `Error accessing resource: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      } else {
        results.push({
          test: 'Resource endpoint',
          passed: true,
          message: 'No resources to test'
        });
      }
      
      // Test 3: Tool endpoints
      if (tools.length > 0) {
        if (verbose) console.log(chalk.gray(`Testing ${tools.length} tool endpoints...`));
        
        // Test the first tool
        const toolPath = tools[0];
        const toolUrl = `${baseUrl}/mcp/tools${toolPath}`;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        
        try {
          const toolResponse = await fetch(toolUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ test: true })
          });
          
          if (!toolResponse.ok) {
            results.push({
              test: 'Tool endpoint',
              passed: false,
              message: `HTTP ${toolResponse.status}: ${toolResponse.statusText}`
            });
          } else {
            const toolData = await toolResponse.json() as any;
            
            // Check tool response format
            const hasSuccess = typeof toolData.success === 'boolean';
            const hasResult = typeof toolData.result === 'object';
            const hasResultId = hasResult && typeof toolData.result.id === 'string';
            const hasContent = hasResult && Array.isArray(toolData.result.content);
            
            if (hasSuccess && hasResult && hasResultId && hasContent) {
              results.push({
                test: 'Tool endpoint',
                passed: true,
                message: `Successfully called tool: ${toolPath}`
              });
            } else {
              results.push({
                test: 'Tool endpoint',
                passed: false,
                message: 'Invalid tool response format'
              });
            }
          }
        } catch (error) {
          results.push({
            test: 'Tool endpoint',
            passed: false,
            message: `Error calling tool: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      } else {
        results.push({
          test: 'Tool endpoint',
          passed: true,
          message: 'No tools to test'
        });
      }
      
      // Test 4: Authentication (if provided)
      if (apiKey) {
        if (verbose) console.log(chalk.gray('Testing authentication...'));
        
        // Try to access a protected endpoint without authentication
        const testUrl = resources.length > 0 
          ? `${baseUrl}/mcp/resources${resources[0]}`
          : tools.length > 0 
            ? `${baseUrl}/mcp/tools${tools[0]}`
            : null;
            
        if (testUrl) {
          try {
            const unauthResponse = await fetch(testUrl);
            
            if (unauthResponse.status === 401) {
              results.push({
                test: 'Authentication',
                passed: true,
                message: 'Correctly rejected unauthenticated request'
              });
            } else {
              results.push({
                test: 'Authentication',
                passed: false,
                message: `Expected 401, got ${unauthResponse.status}`
              });
            }
          } catch (error) {
            results.push({
              test: 'Authentication',
              passed: false,
              message: `Error testing authentication: ${error instanceof Error ? error.message : String(error)}`
            });
          }
        } else {
          results.push({
            test: 'Authentication',
            passed: true,
            message: 'No endpoints available to test authentication'
          });
        }
      } else {
        results.push({
          test: 'Authentication',
          passed: true,
          message: 'No API key provided, skipping authentication test'
        });
      }
    }
  } catch (error) {
    console.error(chalk.red('Error validating MCP server:'), error);
    results.push({
      test: 'Connection',
      passed: false,
      message: `Could not connect to server: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  
  // Print results
  console.log('\nValidation Results:');
  let allPassed = true;
  
  for (const result of results) {
    if (result.passed) {
      console.log(`${chalk.green('✓')} ${chalk.bold(result.test)}: ${result.message}`);
    } else {
      console.log(`${chalk.red('✗')} ${chalk.bold(result.test)}: ${result.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n');
  if (allPassed) {
    console.log(chalk.green('✅ All tests passed! Server is MCP compliant.'));
  } else {
    console.log(chalk.yellow('⚠️ Some tests failed. Server may not be fully MCP compliant.'));
  }
  
  return {
    success: allPassed,
    results
  };
}

// Run the validator from the command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const url = args[0];
  const apiKey = args[1];
  
  if (!url) {
    console.error(chalk.red('Error: URL is required'));
    console.log('Usage: npx ts-node mcp-validator.ts <url> [apiKey]');
    process.exit(1);
  }
  
  validateMcpServer({ url, apiKey, verbose: true })
    .then(({ success }) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Validation failed:'), error);
      process.exit(1);
    });
}
