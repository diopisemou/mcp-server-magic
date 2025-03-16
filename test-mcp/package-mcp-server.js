#!/usr/bin/env node
/**
 * Package MCP server for download
 * 
 * This script creates a downloadable zip file of the generated MCP server.
 * It reads from a specified output directory and creates a zip archive.
 * 
 * Usage: node package-mcp-server.js <output-dir> [zip-name]
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const archiver = require('archiver');

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

// Check if archiver is installed, if not, install it
try {
    require.resolve('archiver');
} catch (e) {
    console.log(`${colors.yellow}Installing archiver package...${colors.reset}`);
    execSync('npm install archiver');
}

// Process command line arguments
function processArgs() {
    if (process.argv.length < 3) {
        console.error(`${colors.red}Usage: node package-mcp-server.js <output-dir> [zip-name]${colors.reset}`);
        process.exit(1);
    }

    const outputDir = process.argv[2];
    const zipName = process.argv[3] || 'mcp-server';

    return { outputDir, zipName };
}

// Create a zip file from the output directory
function createZipFile(outputDir, zipName) {
    const fullOutputPath = path.resolve(outputDir);

    if (!fs.existsSync(fullOutputPath)) {
        console.error(`${colors.red}Error: Output directory ${fullOutputPath} does not exist${colors.reset}`);
        process.exit(1);
    }

    // Add .zip extension if not present
    if (!zipName.endsWith('.zip')) {
        zipName += '.zip';
    }

    const outputZip = path.resolve(zipName);

    console.log(`${colors.cyan}Creating zip file from ${fullOutputPath}${colors.reset}`);
    console.log(`${colors.cyan}Output: ${outputZip}${colors.reset}`);

    // Create a file to stream archive data to
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });

    // Listen for archive warnings
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.warn(`${colors.yellow}Warning: ${err}${colors.reset}`);
        } else {
            throw err;
        }
    });

    // Handle archive errors
    archive.on('error', function (err) {
        throw err;
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Get all files from the output directory recursively
    const getFiles = (dir, baseDir = dir) => {
        const files = fs.readdirSync(dir);
        let result = [];

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const relativePath = path.relative(baseDir, filePath);

            if (fs.statSync(filePath).isDirectory()) {
                result = result.concat(getFiles(filePath, baseDir));
            } else {
                result.push({ path: filePath, name: relativePath });
            }
        });

        return result;
    };

    // Add all files to the archive
    const files = getFiles(fullOutputPath);
    let fileCount = 0;

    files.forEach(file => {
        archive.file(file.path, { name: file.name });
        fileCount++;
    });

    // Finalize the archive
    archive.finalize();

    // Output completion message
    output.on('close', function () {
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(`${colors.green}Successfully created zip file with ${fileCount} files (${sizeMB} MB)${colors.reset}`);
        console.log(`${colors.green}Zip file location: ${outputZip}${colors.reset}`);
    });
}

// Main function
function main() {
    try {
        const { outputDir, zipName } = processArgs();
        createZipFile(outputDir, zipName);
    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run main function
main();
