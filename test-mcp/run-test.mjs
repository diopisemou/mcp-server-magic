#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the ts-node executable in node_modules
const tsNodePath = join(__dirname, 'node_modules', '.bin', 'ts-node');

// Path to the run-mcp-tests.ts file
const scriptPath = join(__dirname, 'run-mcp-tests.ts');

// Set NODE_OPTIONS to enable ES modules compatibility
process.env.NODE_OPTIONS = '--loader ts-node/esm';

// Run the TypeScript file
const proc = spawn(tsNodePath, [
    '--esm',  // Enable ES module mode
    scriptPath
], {
    stdio: 'inherit', // Redirect child process I/O to the parent
    env: {
        ...process.env,
    }
});

proc.on('close', (code) => {
    process.exit(code);
});
