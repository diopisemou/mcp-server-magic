#!/usr/bin/env node

/**
 * Standalone MCP Server Generation Tester
 * 
 * This script tests the generation of MCP servers by directly executing
 * the server templates without relying on imports, avoiding module conflicts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('
