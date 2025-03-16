#!/usr/bin/env node
/**
 * Run all MCP server generation tests
 * 
 * This script tests server generation for TypeScript, Python, and Go
 * using the sample configuration files.
 */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Test configuration files
const configs = [
    {
        name: 'TypeScript',
        file: 'sample-config.json',
        outputDir: 'output-typescript'
    },
    {
        name: 'Python',
        file: 'sample-config-python.json',
        outputDir: 'output-python'
    },
    {
        name: 'Go',
        file: 'sample-config-go.json',
        outputDir: 'output-go'
    }
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Create output directory if it doesn't exist
function ensureOutputDirectory(dir) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        console.log(`${colors.yellow}Removing existing output directory: ${dir}${colors.reset}`);
        fs.rmSync(fullPath, { recursive: true, force: true });
    }
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
}

// Run the generator for a single configuration
function runTest(config) {
    console.log(`\n${colors.cyan}==============================${colors.reset}`);
    console.log(`${colors.cyan}Testing ${config.name} server generation${colors.reset}`);
    console.log(`${colors.cyan}==============================${colors.reset}\n`);

    const configFile = path.join(__dirname, config.file);
    const outputDir = ensureOutputDirectory(config.outputDir);

    try {
        console.log(`${colors.yellow}Running generator...${colors.reset}`);
        const result = execSync(
            `npx ts-node ${path.join(__dirname, 'generate-mcp-server.ts')} ${configFile} ${outputDir}`,
            { stdio: 'inherit' }
        );

        // Check results
        const outputFiles = fs.readdirSync(outputDir, { recursive: true });
        console.log(`${colors.green}✓ Server generated successfully with ${outputFiles.length} files${colors.reset}`);

        return true;
    } catch (error) {
        console.error(`${colors.red}✗ Failed to generate ${config.name} server: ${error.message}${colors.reset}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log(`${colors.magenta}Starting MCP Server Generation Tests${colors.reset}`);
    console.log(`${colors.magenta}=====================================${colors.reset}\n`);

    const results = configs.map(config => {
        const success = runTest(config);
        return { name: config.name, success };
    });

    console.log(`\n${colors.magenta}Test Results Summary${colors.reset}`);
    console.log(`${colors.magenta}====================${colors.reset}\n`);

    let allPassed = true;
    results.forEach(result => {
        if (result.success) {
            console.log(`${colors.green}✓ ${result.name}: PASSED${colors.reset}`);
        } else {
            console.log(`${colors.red}✗ ${result.name}: FAILED${colors.reset}`);
            allPassed = false;
        }
    });

    console.log(`\n${allPassed ? colors.green : colors.red}${allPassed ? 'All tests passed!' : 'Some tests failed!'}${colors.reset}`);

    return allPassed ? 0 : 1;
}

// Run tests
const exitCode = runAllTests();
process.exit(exitCode);
