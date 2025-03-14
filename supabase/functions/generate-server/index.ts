
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

// Define the server file type
interface ServerFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation';
}

// Define the server generation result
interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  files?: ServerFile[];
  error?: string;
}

// Define server configuration
interface ServerConfig {
  name: string;
  description: string;
  language: 'TypeScript' | 'Python';
  authentication: {
    type: 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
    location?: 'header' | 'query' | 'cookie';
    name?: string;
    value?: string;
  };
  hosting: {
    provider: 'AWS' | 'GCP' | 'Azure' | 'Self-hosted';
    type: 'Serverless' | 'Container' | 'VM';
    region?: string;
  };
  endpoints: Array<{
    id: string;
    path: string;
    method: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    responses: Array<{
      statusCode: number | string;
      description: string;
      schema: any;
    }>;
    mcpType: 'none' | 'resource' | 'tool';
  }>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { deploymentId, config } = await req.json();

    if (!deploymentId || !config) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log('Received request to generate server for deployment ID:', deploymentId);
    console.log('Server config:', JSON.stringify(config, null, 2).substring(0, 500) + '...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update deployment status to processing
    const { error: updateError } = await supabase
      .from('deployments')
      .update({ status: 'processing' })
      .eq('id', deploymentId);

    if (updateError) {
      console.error('Error updating deployment status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update deployment status' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Generate the server
    const result = await generateServer(config as ServerConfig);

    // Update deployment with the results
    const { error: finalUpdateError } = await supabase
      .from('deployments')
      .update({
        status: result.success ? 'success' : 'failed',
        server_url: result.serverUrl,
        logs: JSON.stringify({
          timestamp: new Date().toISOString(),
          success: result.success,
          message: result.success ? 'Server generated successfully' : result.error
        }),
        files: result.files
      })
      .eq('id', deploymentId);

    if (finalUpdateError) {
      console.error('Error saving generation results:', finalUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save generation results' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});

// TypeScript server code generator
function generateTypeScriptServerCode(config: ServerConfig): string {
  const hasAuth = config.authentication.type !== 'None';

  const paramInterfaces = config.endpoints.map(endpoint => {
    return `
interface ${endpoint.path.replace(/\//g, '').replace(/-/g, '')}Params {
${endpoint.parameters.map(param => 
  `  ${param.name}${param.required ? '' : '?'}: ${param.type};`
).join('\n')}
}`;
  }).join('\n');

  const endpoints = config.endpoints.map(endpoint => {
    const paramList = endpoint.parameters.map(param => param.name).join(', ');
    const paramTypes = endpoint.parameters.map(param => 
      `${param.name}${param.required ? '' : '?'}: ${param.type}`).join(', ');

    return `
app.${endpoint.method.toLowerCase()}('${endpoint.path}', ${hasAuth ? 'authenticate, ' : ''}async (req: Request, res: Response) => {
  try {
    const { ${paramList} } = req.query as { ${paramTypes} };
    ${endpoint.parameters.map(param => 
      param.required ? `if (!${param.name}) throw new Error('Missing required parameter: ${param.name}');` : ''
    ).join('\n    ')}
    
    // ${endpoint.description}
    // Add your implementation logic here
    const result = {
      status: 'success',
      endpoint: '${endpoint.path}',
      data: { ${paramList ? `${paramList}` : ''} }
    };
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred'
    });
  }
});
`;
  }).join('\n');

  return `
import express, { Request, Response, NextFunction } from 'express';
import { MCPServer, Resource, Tool } from '@anthropic-ai/mcp';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MCP Server Setup
const mcpServer = new MCPServer();
app.use('/mcp', mcpServer.router);

// Authentication Middleware
${hasAuth ? `
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
` : ''}

// Parameter Interfaces
${paramInterfaces}

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Endpoints
${endpoints}

// MCP Resources and Tools Registration
${config.endpoints.filter(e => e.mcpType === 'resource').map(e => 
  `mcpServer.registerResource(new Resource({ 
    name: "${e.path.substring(1)}", 
    description: "${e.description}",
    endpoint: "${e.path}"
  }));`
).join('\n')}

${config.endpoints.filter(e => e.mcpType === 'tool').map(e => 
  `mcpServer.registerTool(new Tool({ 
    name: "${e.path.substring(1)}", 
    description: "${e.description}",
    endpoint: "${e.path}"
  }));`
).join('\n')}

// Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Server Start
app.listen(port, () => {
  console.log(\`${config.name} MCP Server running on port \${port}\`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  process.exit(0);
});
`;
}

// Python server code generator
function generatePythonServerCode(config: ServerConfig): string {
  const hasAuth = config.authentication.type !== 'None';

  const imports = `
import os
import sys
from typing import Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic_mcp import MCPServer, Resource, Tool
from dotenv import load_dotenv
import uvicorn

load_dotenv()
`;

  const authCode = hasAuth ? `
# Authentication dependency
async def verify_api_key(request: Request):
    api_key = request.headers.get('x-api-key') or request.query_params.get('api_key')
    if not api_key or api_key != os.getenv('API_KEY'):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True
` : '';

  const endpoints = config.endpoints.map(endpoint => {
    const params = endpoint.parameters.map(param => 
      `${param.name}: ${param.type}${param.required ? '' : ' = Query(default=None)'}${hasAuth ? ' , _: bool = Depends(verify_api_key)' : ''}`
    ).join(', ');
    
    const param_validations = endpoint.parameters
      .filter(p => p.required)
      .map(p => `    if ${p.name} is None:\n        raise HTTPException(status_code=400, detail="Missing required parameter: ${p.name}")`)
      .join('\n');

    return `
@app.${endpoint.method.toLowerCase()}("${endpoint.path}"${hasAuth ? ', dependencies=[Depends(verify_api_key)]' : ''})
async def ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').substring(1)}(${params}) -> Dict[str, Any]:
    """
    ${endpoint.description}
    """
    try:
${param_validations}
        # Add your implementation logic here
        return {
            "status": "success",
            "endpoint": "${endpoint.path}",
            "data": {${endpoint.parameters.map(p => `"${p.name}": ${p.name}`).join(', ')}}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
`;
  }).join('\n');

  return `${imports}

# Server configuration
app = FastAPI(
    title="${config.name} MCP Server",
    description="${config.description}",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCP Server Setup
mcp_server = MCPServer(app)

${authCode}

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "healthy", "timestamp": os.getenv("TIMESTAMP", "N/A")}

# API Endpoints
${endpoints}

# Register MCP resources and tools
${config.endpoints.filter(e => e.mcpType === 'resource').map(e => 
  `mcp_server.register_resource(Resource(name="${e.path.substring(1)}", description="${e.description}", endpoint="${e.path}"))`
).join('\n')}

${config.endpoints.filter(e => e.mcpType === 'tool').map(e => 
  `mcp_server.register_tool(Tool(name="${e.path.substring(1)}", description="${e.description}", endpoint="${e.path}"))`
).join('\n')}

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

# Server startup
if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = "0.0.0.0"
    
    # Configure logging
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            reload=False
        )
    except KeyboardInterrupt:
        print("Server shutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        print(f"Server failed to start: {str(e)}")
        sys.exit(1)
`;
}

// Generate README based on server config and language
function generateReadme(config: ServerConfig, language: 'TypeScript' | 'Python'): string {
  const isTypeScript = language === 'TypeScript';
  
  return `# ${config.name} MCP Server

${config.description}

## Features

- Built with ${isTypeScript ? 'TypeScript and Express' : 'FastAPI and Python'}
- MCP (Model Context Protocol) integration
${isTypeScript ? '- Security with Helmet' : '- Type hints and validation'}
- CORS support
${config.authentication.type !== 'None' ? '- API Key Authentication' : ''}

## Endpoints

${config.endpoints.map(e => 
  `- \`${e.method} ${e.path}\` - ${e.description} (${e.mcpType !== 'none' ? e.mcpType : 'standard'})`
).join('\n')}

## Prerequisites

${isTypeScript ? '- Node.js 18+\n- npm 8+' : '- Python 3.9+\n- pip'}

## Setup

1. Install dependencies:
\`\`\`bash
${isTypeScript ? 'npm install' : 'pip install -r requirements.txt'}
\`\`\`

2. Copy \`.env.example\` to \`.env\` and configure:
\`\`\`bash
cp .env.example .env
\`\`\`

${isTypeScript ? 
`3. Build the project:
\`\`\`bash
npm run build
\`\`\`

4. Start the server:
\`\`\`bash
npm start
\`\`\`

Or run in development mode:
\`\`\`bash
npm run dev
\`\`\`` : 
`3. Run the server:
\`\`\`bash
python mcp_server.py
\`\`\`

Or use gunicorn for production:
\`\`\`bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker mcp_server:app
\`\`\``}

## MCP Integration

Connect to this server using:
\`\`\`
URL: http://localhost:${isTypeScript ? '3000' : '8000'}/mcp
${config.authentication.type !== 'None' ? 'Authentication: X-API-KEY header with your API key' : ''}
Capabilities:
${config.endpoints.filter(e => e.mcpType !== 'none').map(e => 
  `- ${e.mcpType === 'resource' ? 'Resource' : 'Tool'}: ${e.path.substring(1)}`
).join('\n')}
\`\`\`
`;
}

// Generate server code based on language
async function generateServer(config: ServerConfig): Promise<GenerationResult> {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const files: ServerFile[] = [];
    
    // Generate server based on language
    if (config.language === 'TypeScript') {
      // Generate TypeScript server files
      files.push({
        name: 'server.ts',
        path: '/src/',
        content: generateTypeScriptServerCode(config),
        type: 'code'
      });

      files.push({
        name: 'tsconfig.json',
        path: '/',
        content: JSON.stringify({
          "compilerOptions": {
            "target": "es2018",
            "module": "commonjs",
            "outDir": "./dist",
            "rootDir": "./src",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true
          },
          "include": ["src/**/*"]
        }, null, 2),
        type: 'config'
      });

      files.push({
        name: '.env.example',
        path: '/',
        content: `PORT=3000
API_KEY=${config.authentication.type !== 'None' ? 'your-api-key-here' : ''}`,
        type: 'config'
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
            "start": "node dist/server.js",
            "dev": "ts-node src/server.ts",
            "lint": "eslint . --ext .ts"
          },
          "dependencies": {
            "express": "^4.18.2",
            "dotenv": "^16.3.1",
            "helmet": "^7.0.0",
            "cors": "^2.8.5",
            "@anthropic-ai/mcp": "^1.0.0"
          },
          "devDependencies": {
            "@types/express": "^4.17.17",
            "@types/node": "^20.4.2",
            "@types/cors": "^2.8.13",
            "typescript": "^5.1.6",
            "ts-node": "^10.9.1",
            "eslint": "^8.44.0",
            "@typescript-eslint/parser": "^5.61.0",
            "@typescript-eslint/eslint-plugin": "^5.61.0"
          }
        }, null, 2),
        type: 'config'
      });

      files.push({
        name: 'README.md',
        path: '/',
        content: generateReadme(config, 'TypeScript'),
        type: 'documentation'
      });
    } else if (config.language === 'Python') {
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
        content: `fastapi==0.110.0
uvicorn==0.29.0
pydantic==2.6.4
anthropic-mcp==1.0.0
python-dotenv==1.0.1
gunicorn==21.2.0`,
        type: 'config'
      });

      files.push({
        name: '.env.example',
        path: '/',
        content: `PORT=8000
${config.authentication.type !== 'None' ? 'API_KEY=your-api-key-here' : ''}`,
        type: 'config'
      });

      files.push({
        name: 'README.md',
        path: '/',
        content: generateReadme(config, 'Python'),
        type: 'documentation'
      });
    } else {
      throw new Error(`Unsupported language: ${config.language}`);
    }

    return {
      success: true,
      serverUrl: `https://mcp-${config.name.toLowerCase().replace(/\s+/g, '-')}.example.com`,
      files
    };
  } catch (error) {
    console.error('Error generating server:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
