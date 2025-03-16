#!/usr/bin/env node

/**
 * Simple test runner for MCP server generation
 * This script runs the tests without dealing with module compatibility issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the test files
const testDir = path.join(__dirname);
const outputDir = path.join(testDir, 'output');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('=== MCP Server Generation Test ===');

// Use the main project's existing TypeScript configuration
// but with a specific test file
try {
    // Run the test directly with ts-node
    const command = `npx ts-node ${path.join(testDir, 'run-mcp-tests.ts')}`;
    console.log(`\nExecuting: ${command}`);

    // Execute the command
    const output = execSync(command, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    console.log('\n✅ Tests completed successfully');
} catch (error) {
    console.error('\n❌ Tests failed to run:');
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
}
