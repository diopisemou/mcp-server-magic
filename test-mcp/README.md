# MCP Server Generation Tests

This directory contains tests for verifying the MCP (Model Context Protocol) server generation functionality.

## Test Components

- **`run-tests.ts`**: Original test runner for MCP server generation (TypeScript and Python servers)
- **`run-mcp-tests.ts`**: Enhanced test runner that includes Go server tests
- **`browser-tester.html`**: Browser-based tester for interactive verification of server generation
- **`mcp-server-validator.ts`**: Validates generated MCP servers against protocol specifications
- **`mcp-validator.ts`**: Validates running MCP servers for protocol compliance

## Running Tests

There are several ways to test the MCP server generation:

### Browser Tests (Recommended)

Run the browser-based tester with:

```bash
npm run test:browser
```

This will open a browser window where you can test each server type (TypeScript, Python, Go) by clicking the "Run Test" buttons. The test results will be displayed on the page.

### Automated Tests

Run the automated tests with:

```bash
npm test        # Basic tests
npm run test:mcp # Full MCP tests including Go implementation
```

## Test Configuration

The tests use sample API endpoints:

1. GET `/weather` - A resource endpoint for fetching weather data
2. POST `/forecast` - A tool endpoint for getting weather forecasts

Tests validate server generation with different configurations:
- Various authentication methods (None, API Key, Bearer Token)
- Multiple languages (TypeScript, Python, Go)
- Different deployment options

## Test Validation

The tests verify:

1. File generation (correct number and types of files)
2. Protocol compliance (correct URL structure, authentication, error handling)
3. Request/response formats according to MCP specifications

## Generated Server Structure

Each generated MCP server includes:

- **Configuration files** (package.json, tsconfig.json, requirements.txt, go.mod, etc.)
- **Main server files** (index.ts/js, main.py, main.go)
- **Route handlers** for resources (GET) and tools (POST)
- **Authentication middleware** (if applicable)
- **Documentation** (README.md)

## Troubleshooting

If tests fail, check:

1. Module dependencies are installed
2. TypeScript compilation is working
3. Required templates exist in src/utils/serverTemplates/
