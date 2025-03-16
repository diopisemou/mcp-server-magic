#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { generateServerCode } from '../src/utils/serverGeneratorCore';
import type { ServerConfig } from '../src/types';

/**
 * Command-line tool for testing MCP server generation
 * 
 * Usage: npx ts-node generate-mcp-server.ts <config.json> [output-dir]
 * 
 * This tool reads a server configuration from a JSON file, generates
 * the server code using the same core generator that the web app uses,
 * and writes the generated files to the specified output directory.
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: generate-mcp-server <config.json> [output-dir]');
    process.exit(1);
  }

  const configFile = process.argv[2];
  const outputDir = process.argv[3] || './mcp-server-output';

  // Load config
  console.log(`Reading configuration from ${configFile}...`);
  let config: ServerConfig;
  try {
    const configContent = fs.readFileSync(configFile, 'utf8');
    config = JSON.parse(configContent);
  } catch (err) {
    console.error(`Error reading config file: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
  
  console.log(`Generating ${config.language} MCP server...`);
  
  // Generate server
  const result = generateServerCode(config);
  
  if (result.success && result.files) {
    // Create output directory
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Write files
    console.log(`Writing ${result.files.length} files...`);
    for (const file of result.files) {
      const filePath = path.join(outputDir, file.path);
      const fullPath = path.join(filePath, file.name);
      
      // Create directory if it doesn't exist
      fs.mkdirSync(filePath, { recursive: true });
      
      // Write file content
      fs.writeFileSync(fullPath, file.content);
      console.log(`Created ${fullPath}`);
    }
    
    console.log(`Server generated successfully with ${result.files.length} files.`);
    console.log(`Files are in: ${outputDir}`);
    
    // Log server URL
    if (result.serverUrl) {
      console.log(`Server URL: ${result.serverUrl}`);
    }
  } else {
    console.error('Failed to generate server:', result.error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
