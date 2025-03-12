import type { ServerConfig, GenerationResult, ServerFile } from '@/types';

export const generateServer = async (
  config: ServerConfig
): Promise<GenerationResult> => {
  try {
    console.log('Generating MCP server with config:', config);
    
    // In a real implementation, this would make an API call to a backend service
    // Here we're just mocking the response for demonstration
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const files: ServerFile[] = [];
    
    if (config.language === 'Python') {
      // Generate Python server files
      files.push({
        name: 'mcp_server.py',
        path: '/',
        content: generatePythonServerCode(config),
        type: 'code'
      });
      
      files.push({
        name: 'requirements.txt',
        path: '/',
        content: 'anthropic-mcp==1.0.0\nfastapi==0.100.0\nuvicorn==0.22.0\npydantic==2.0.3\nrequests==2.31.0',
        type: 'config'
      });
      
      files.push({
        name: 'README.md',
        path: '/',
        content: generateReadme(config),
        type: 'documentation'
      });
    } else {
      // Generate TypeScript server files
      files.push({
        name: 'server.ts',
        path: '/src/',
        content: generateTypeScriptServerCode(config),
        type: 'code'
      });
      
      files.push({
        name: 'package.json',
        path: '/',
        content: JSON.stringify({
          "name": config.name.toLowerCase().replace(/\s+/g, '-'),
          "version": "1.0.0",
          "description": config.description,
          "main": "dist/server.js",
          "scripts": {
            "build": "tsc",
            "start": "node dist/server.js"
          },
          "dependencies": {
            "@anthropic-ai/mcp": "^1.0.0",
            "express": "^4.18.2",
            "dotenv": "^16.3.1"
          },
          "devDependencies": {
            "@types/express": "^4.17.17",
            "@types/node": "^20.4.2",
            "typescript": "^5.1.6"
          }
        }, null, 2),
        type: 'config'
      });
      
      files.push({
        name: 'README.md',
        path: '/',
        content: generateReadme(config),
        type: 'documentation'
      });
    }
    
    // Return a success result with server URL and generated files
    return {
      success: true,
      serverUrl: `https://mcp-server-${config.name.toLowerCase().replace(/\s+/g, '-')}.supabase.co`,
      files
    };
  } catch (error) {
    console.error('Error generating server:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to generate Python server code
const generatePythonServerCode = (config: ServerConfig): string => {
  const endpoints = config.endpoints.map(endpoint => {
    const paramDefs = endpoint.parameters.map(param => 
      `    ${param.name}: ${param.type} = ${param.required ? 'Query(...)' : 'Query(None)'}`
    ).join('\n');
    
    return `
@app.${endpoint.method.toLowerCase()}("${endpoint.path}")
async def ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').substring(1)}(${paramDefs}):
    """${endpoint.description}"""
    # Implementation goes here
    return {"result": "data for ${endpoint.path}"}
`;
  }).join('\n');

  return `
import os
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from anthropic_mcp import MCPServer, Resource, Tool

app = FastAPI(title="${config.name} MCP Server")

# Configure MCP server
mcp_server = MCPServer(app)

${endpoints}

# Register MCP resources and tools
${config.endpoints.filter(e => e.mcpType === 'resource').map(e => 
  `mcp_server.register_resource(Resource(name="${e.path.substring(1)}", description="${e.description}"))`
).join('\n')}

${config.endpoints.filter(e => e.mcpType === 'tool').map(e => 
  `mcp_server.register_tool(Tool(name="${e.path.substring(1)}", description="${e.description}"))`
).join('\n')}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
};

// Helper function to generate TypeScript server code
const generateTypeScriptServerCode = (config: ServerConfig): string => {
  const endpoints = config.endpoints.map(endpoint => {
    const paramList = endpoint.parameters.map(param => param.name).join(', ');
    
    return `
// ${endpoint.description}
app.${endpoint.method.toLowerCase()}('${endpoint.path}', (req, res) => {
  const { ${paramList} } = req.query;
  // Implementation goes here
  res.json({ result: 'data for ${endpoint.path}' });
});
`;
  }).join('\n');

  return `
import express from 'express';
import { MCPServer, Resource, Tool } from '@anthropic-ai/mcp';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure MCP server
const mcpServer = new MCPServer();

// Register with Express
app.use('/mcp', mcpServer.router);

// API Endpoints
${endpoints}

// Register MCP resources and tools
${config.endpoints.filter(e => e.mcpType === 'resource').map(e => 
  `mcpServer.registerResource(new Resource({ name: "${e.path.substring(1)}", description: "${e.description}" }));`
).join('\n')}

${config.endpoints.filter(e => e.mcpType === 'tool').map(e => 
  `mcpServer.registerTool(new Tool({ name: "${e.path.substring(1)}", description: "${e.description}" }));`
).join('\n')}

app.listen(port, () => {
  console.log(\`${config.name} MCP Server running on port \${port}\`);
});
`;
};

// Helper function to generate README content
const generateReadme = (config: ServerConfig): string => {
  return `# ${config.name} MCP Server

${config.description}

## Overview

This is a Model Context Protocol (MCP) server that provides the following capabilities:

${config.endpoints.filter(e => e.mcpType === 'resource').map(e => 
  `- **Resource**: ${e.path.substring(1)} - ${e.description}`
).join('\n')}

${config.endpoints.filter(e => e.mcpType === 'tool').map(e => 
  `- **Tool**: ${e.path.substring(1)} - ${e.description}`
).join('\n')}

## Getting Started

${config.language === 'Python' ? 
`1. Install dependencies: \`pip install -r requirements.txt\`
2. Run the server: \`python mcp_server.py\`` :
`1. Install dependencies: \`npm install\`
2. Build the project: \`npm run build\`
3. Run the server: \`npm start\``}

## Authentication

${config.authentication.type === 'None' ? 
'This server does not require authentication.' :
`This server uses ${config.authentication.type} authentication.`}

## MCP Integration

To connect to this server from a Claude conversation, use:

\`\`\`
Using the Model Context Protocol, connect to the API at the URL:
${config.name}

It provides the following capabilities:
${config.endpoints.filter(e => e.mcpType !== 'none').map(e => 
  `- ${e.mcpType === 'resource' ? 'Resource' : 'Tool'}: ${e.path.substring(1)}`
).join('\n')}
\`\`\`
`;
};

export default {
  generateServer
};
