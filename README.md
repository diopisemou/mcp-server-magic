# MCP Server Magic

Generate MCP (Model Context Protocol) servers easily.

## Project info

**URL**: https://lovable.dev/projects/d1f58d89-2e1d-4c6a-ade1-f7807ab46e44

## Features

- Generate TypeScript, Python, and Go MCP servers
- Configure authentication (API Key, Bearer Token, Basic Auth)
- Define resources and tools
- Deploy to various environments (AWS, GCP, Azure, Self-hosted)
- **NEW**: API Proxy Mode - Create MCP servers that proxy to existing APIs

## Server Modes

MCP Server Magic supports two modes for server generation:

### Direct Implementation Mode

This is the default mode where MCP Server Magic generates a complete, standalone implementation of your MCP server. The server handles all logic and data processing directly.

### Proxy Mode

Proxy mode allows you to create an MCP server that acts as a middleware between MCP clients (like Claude) and your existing APIs. The MCP server translates MCP-formatted requests into standard API calls and converts the responses back to MCP format.

**Proxy Mode Features:**
- Connect to any existing REST API
- Automatic conversion between MCP and standard formats
- Optional caching for improved performance
- Optional rate limiting to protect your target API
- Authentication support for both MCP client and target API
- Full compliance with Model Context Protocol standard

## Tests

This project includes comprehensive tests to ensure the quality of generated servers:

```bash
# Run basic MCP server tests
npm test

# Run full MCP tests including Go server generation
npm run test:mcp

# Run proxy mode tests
npm run test:proxy
```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d1f58d89-2e1d-4c6a-ade1-f7807ab46e44) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Model Context Protocol SDK
