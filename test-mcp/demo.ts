/**
 * Demo script for MCP Server Generation Tests
 * 
 * This script demonstrates a single test run to showcase the functionality
 * of the testing framework. It's a simplified version of the full test suite
 * that focuses on a specific configuration.
 */

import { ServerGenerationTester } from './server-generation-tester';
import * as path from 'path';

async function runDemo() {
  console.log('MCP Server Generation Test Demo');
  console.log('===============================');
  
  // Get path to the sample OpenAPI file
  const openApiSamplePath = path.join(__dirname, 'openapi-sample.json');
  
  console.log('Test Configuration:');
  console.log('- Language: TypeScript');
  console.log('- Authentication: API Key');
  console.log('- OpenAPI File: openapi-sample.json');
  console.log('\nStarting test...\n');
  
  try {
    // Create tester with the sample OpenAPI file
    const tester = new ServerGenerationTester(openApiSamplePath);
    
    // Step 1: Parse the OpenAPI definition
    console.log('Step 1: Parsing OpenAPI definition...');
    const endpoints = tester.parseOpenApiDefinition();
    console.log(`✅ Successfully extracted ${endpoints.length} endpoints`);
    
    // Display endpoint info
    console.log(`\nEndpoints by type:`);
    const resourceEndpoints = endpoints.filter(e => e.mcpType === 'resource');
    const toolEndpoints = endpoints.filter(e => e.mcpType === 'tool');
    
    console.log(`- ${resourceEndpoints.length} resources: ${resourceEndpoints.map(e => e.path).join(', ')}`);
    console.log(`- ${toolEndpoints.length} tools: ${toolEndpoints.map(e => e.path).join(', ')}`);
    
    // Step 2: Create server configuration
    console.log('\nStep 2: Creating server configuration...');
    const config = tester.createServerConfig(
      'TypeScript',
      'Demo MCP Server',
      'Generated for demonstration purposes',
      'API Key'
    );
    console.log('✅ Server configuration created successfully');
    
    // Step 3: Generate server
    console.log('\nStep 3: Generating MCP server...');
    console.log('This may take a moment...');
    const result = await tester.generateMcpServer();
    
    if (result.success) {
      console.log('✅ Server generated successfully!');
      
      // Display files
      console.log(`\nGenerated ${result.files?.length || 0} files:`);
      const filesByType: Record<string, number> = {};
      
      result.files?.forEach(file => {
        const ext = file.path.split('.').pop() || 'unknown';
        filesByType[ext] = (filesByType[ext] || 0) + 1;
      });
      
      Object.entries(filesByType).forEach(([ext, count]) => {
        console.log(`- ${count} ${ext} ${count === 1 ? 'file' : 'files'}`);
      });
      
      // Display server URL (mock)
      if (result.serverUrl) {
        console.log(`\nServer URL: ${result.serverUrl}`);
      }
    } else {
      console.log(`❌ Server generation failed: ${result.error}`);
    }
    
    // Step 4: Validate the generated server
    console.log('\nStep 4: Validating generated MCP server...');
    const validationResult = await tester.runFullTest('TypeScript', 'API Key');
    
    if (validationResult.valid) {
      console.log('✅ Validation passed! Generated a valid MCP server.');
    } else {
      console.log('❌ Validation failed with errors:');
      validationResult.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    console.log('\nDemo completed successfully!');
    console.log('To run the full test suite, use: npm test');
  } catch (error) {
    console.error('\n❌ Demo failed with error:', error);
  }
}

// Run the demo
runDemo().catch(console.error);
