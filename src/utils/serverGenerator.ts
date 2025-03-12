
import type { ServerConfig, GenerationResult, ServerFile } from '@/types';

export const generateServer = async (
  config: ServerConfig
): Promise<GenerationResult> => {
  try {
    console.log('Generating MCP server with config:', config);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const files: ServerFile[] = [];
    
    // Generate files based on chosen language
    if (config.language === 'Python') {
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
    } else {
      // TypeScript
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
    }

    // Add common files
    files.push({
      name: '.env.example',
      path: '/',
      content: `PORT=${config.language === 'Python' ? '8000' : '3000'}
${config.authentication.type !== 'None' ? 'API_KEY=your-api-key-here' : ''}`,
      type: 'config'
    });

    files.push({
      name: 'README.md',
      path: '/',
      content: generateReadme(config),
      type: 'documentation'
    });

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
};

const generatePythonServerCode = (config: ServerConfig): string => {
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
      `${param.name}: ${param.type}${param.required ? '' : ' = Query(default=None)'}${hasAuth ? ', _: bool = Depends(verify_api_key)' : ''}`
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
};

const generateTypeScriptServerCode = (config: ServerConfig): string => {
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
};

const generateReadme = (config: ServerConfig): string => {
  const isTypescript = config.language === 'TypeScript';
  
  return `# ${config.name} MCP Server

${config.description}

## Features

- Built with ${isTypescript ? 'TypeScript and Express' : 'Python and FastAPI'}
- MCP (Model Context Protocol) integration
${isTypescript ? '- Security with Helmet' : ''}
- CORS support
${config.authentication.type !== 'None' ? '- API Key Authentication' : ''}

## Endpoints

${config.endpoints.map(e => 
  `- \`${e.method} ${e.path}\` - ${e.description} (${e.mcpType !== 'none' ? e.mcpType : 'standard'})`
).join('\n')}

## Prerequisites

${isTypescript 
  ? '- Node.js 18+\n- npm 8+' 
  : '- Python 3.9+\n- pip'}

## Setup

1. Install dependencies:
\`\`\`bash
${isTypescript ? 'npm install' : 'pip install -r requirements.txt'}
\`\`\`

2. Copy \`.env.example\` to \`.env\` and configure:
\`\`\`bash
cp .env.example .env
\`\`\`

${isTypescript 
  ? `3. Build the project:
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
\`\`\``
  : `3. Run the server:
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
URL: http://${isTypescript ? 'localhost:3000' : '0.0.0.0:8000'}/mcp
${config.authentication.type !== 'None' ? 'Authentication: X-API-KEY header with your API key' : ''}
Capabilities:
${config.endpoints.filter(e => e.mcpType !== 'none').map(e => 
  `- ${e.mcpType === 'resource' ? 'Resource' : 'Tool'}: ${e.path.substring(1)}`
).join('\n')}
\`\`\`
`;
};

export default {
  generateServer
};
import type { ServerConfig, GenerationResult, ServerFile } from '../types/server';

export const generateServer = async (config: ServerConfig): Promise<GenerationResult> => {
  // In a real application, this would be a more sophisticated code generator
  // or would call an API to generate the server code
  
  const { language, framework, apiDefinition } = config;
  
  // Use the endpoint_definition from apiDefinition
  const endpoints = apiDefinition.endpoint_definition || apiDefinition.endpoints || [];
  
  // Only generate code for selected endpoints
  const selectedEndpoints = endpoints.filter((endpoint: any) => endpoint.selected !== false);
  
  let files: ServerFile[] = [];
  
  if (language === 'typescript' && framework === 'express') {
    files = generateTypescriptExpressServer(selectedEndpoints, config);
  } else if (language === 'python' && framework === 'fastapi') {
    files = generatePythonFastAPIServer(selectedEndpoints, config);
  }
  
  return {
    files,
    config
  };
};

function generateTypescriptExpressServer(endpoints: any[], config: ServerConfig): ServerFile[] {
  const files: ServerFile[] = [];
  
  // package.json
  files.push({
    path: 'package.json',
    content: `{
  "name": "mcp-generated-server",
  "version": "1.0.0",
  "description": "Generated API server",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"${config.database === 'mongodb' ? ',\n    "mongoose": "^7.0.3"' : ''}${config.database === 'postgres' ? ',\n    "pg": "^8.10.0"' : ''}${config.authentication ? ',\n    "jsonwebtoken": "^9.0.0",\n    "bcrypt": "^5.1.0"' : ''}
  },
  "devDependencies": {
    "typescript": "^5.0.4",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/node": "^18.15.11"${config.database === 'postgres' ? ',\n    "@types/pg": "^8.6.6"' : ''}${config.authentication ? ',\n    "@types/jsonwebtoken": "^9.0.1",\n    "@types/bcrypt": "^5.0.0"' : ''}
  }
}`,
    language: 'json'
  });
  
  // tsconfig.json
  files.push({
    path: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}`,
    language: 'json'
  });
  
  // Main app file
  files.push({
    path: 'src/index.ts',
    content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
${config.database === 'mongodb' ? "import mongoose from 'mongoose';" : ''}${config.database === 'postgres' ? "import { Pool } from 'pg';" : ''}

// Import routes
${endpoints.map((endpoint, index) => `import ${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}Routes from './routes${endpoint.path}';`).join('\n')}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

${config.database === 'mongodb' ? `
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-server')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
` : ''}

${config.database === 'postgres' ? `
// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcp-server',
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));
` : ''}

// Routes
${endpoints.map((endpoint) => `app.use('${endpoint.path}', ${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}Routes);`).join('\n')}

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
    language: 'typescript'
  });
  
  // Create route files for each endpoint
  endpoints.forEach((endpoint) => {
    const routePath = `src/routes${endpoint.path}.ts`;
    const controllerPath = `src/controllers${endpoint.path}.ts`;
    
    // Route file
    files.push({
      path: routePath,
      content: `import express from 'express';
import * as ${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}Controller from '../controllers${endpoint.path}';
${config.authentication ? "import { authenticateToken } from '../middleware/auth';" : ''}

const router = express.Router();

/**
 * @route ${endpoint.method} ${endpoint.path}
 * @description ${endpoint.description || 'Endpoint for ' + endpoint.path}
 */
router.${endpoint.method.toLowerCase()}('/', ${config.authentication ? 'authenticateToken, ' : ''}${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}Controller.${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '').replace(/-/g, '_')});

export default router;`,
      language: 'typescript'
    });
    
    // Controller file
    files.push({
      path: controllerPath,
      content: `import { Request, Response } from 'express';

/**
 * ${endpoint.description || 'Handler for ' + endpoint.path}
 */
export const ${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '').replace(/-/g, '_')} = async (req: Request, res: Response) => {
  try {
    // Implementation for ${endpoint.method} ${endpoint.path}
    ${endpoint.method === 'GET' ? `
    // Sample response data
    const data = {
      message: 'Success',
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };
    
    return res.status(200).json(data);` : ''}
    ${endpoint.method === 'POST' ? `
    // Sample request handling
    const { name, value } = req.body;
    
    // Validate request
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Process request
    const result = {
      id: Date.now(),
      name,
      value,
      created: new Date().toISOString()
    };
    
    return res.status(201).json(result);` : ''}
    ${endpoint.method === 'PUT' ? `
    // Sample update handling
    const { id } = req.params;
    const { name, value } = req.body;
    
    // Validate request
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    
    // Process update
    const updated = {
      id,
      name,
      value,
      updated: new Date().toISOString()
    };
    
    return res.status(200).json(updated);` : ''}
    ${endpoint.method === 'DELETE' ? `
    // Sample delete handling
    const { id } = req.params;
    
    // Validate request
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    
    // Process deletion
    return res.status(200).json({ message: 'Resource deleted successfully' });` : ''}
  } catch (error) {
    console.error('Error in ${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};`,
      language: 'typescript'
    });
  });
  
  // Add authentication middleware if needed
  if (config.authentication) {
    files.push({
      path: 'src/middleware/auth.ts',
      content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};`,
      language: 'typescript'
    });
  }
  
  return files;
}

function generatePythonFastAPIServer(endpoints: any[], config: ServerConfig): ServerFile[] {
  const files: ServerFile[] = [];
  
  // requirements.txt
  files.push({
    path: 'requirements.txt',
    content: `fastapi>=0.95.1
uvicorn>=0.22.0
pydantic>=1.10.7
python-dotenv>=1.0.0${config.database === 'mongodb' ? '\npymongo>=4.3.3' : ''}${config.database === 'postgres' ? '\npsycopg2-binary>=2.9.6\nsqlalchemy>=2.0.0' : ''}${config.authentication ? '\npython-jose>=3.3.0\npasslib>=1.7.4\nbcrypt>=4.0.1' : ''}`,
    language: 'text'
  });
  
  // Main app file
  files.push({
    path: 'main.py',
    content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
${config.database === 'mongodb' ? 'from pymongo import MongoClient' : ''}
${config.database === 'postgres' ? 'from sqlalchemy import create_engine\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import sessionmaker' : ''}

# Import routes
${endpoints.map((endpoint) => `from routes.${endpoint.path.replace(/\//g, '').replace(/-/g, '_')} import router as ${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}_router`).join('\n')}

# Load environment variables
load_dotenv()

app = FastAPI(
    title="MCP Generated API",
    description="Generated FastAPI server",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

${config.database === 'mongodb' ? `
# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["mcp_server"]
` : ''}

${config.database === 'postgres' ? `
# PostgreSQL connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mcp_server")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create database tables
Base.metadata.create_all(bind=engine)
` : ''}

# Register routes
${endpoints.map((endpoint) => `app.include_router(${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}_router, prefix="${endpoint.path}", tags=["${endpoint.path.replace(/\//g, '').replace(/-/g, ' ').trim()}"])`).join('\n')}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`,
    language: 'python'
  });
  
  // Create routes directory
  files.push({
    path: 'routes/__init__.py',
    content: '',
    language: 'python'
  });
  
  // Create route files for each endpoint
  endpoints.forEach((endpoint) => {
    const routePath = `routes/${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}.py`;
    
    files.push({
      path: routePath,
      content: `from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
${config.authentication ? 'from dependencies.auth import get_current_user' : ''}

router = APIRouter()

${endpoint.method === 'POST' || endpoint.method === 'PUT' ? `
class ${endpoint.path.replace(/\//g, '').replace(/-/g, '_').charAt(0).toUpperCase() + endpoint.path.replace(/\//g, '').replace(/-/g, '_').slice(1)}Request(BaseModel):
    name: str
    value: Optional[str] = None
` : ''}

class ${endpoint.path.replace(/\//g, '').replace(/-/g, '_').charAt(0).toUpperCase() + endpoint.path.replace(/\//g, '').replace(/-/g, '_').slice(1)}Response(BaseModel):
    id: int
    name: str
    value: Optional[str] = None

@router.${endpoint.method.toLowerCase()}("/")
async def ${endpoint.method.toLowerCase()}_${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}(
    ${endpoint.method === 'POST' || endpoint.method === 'PUT' ? `request: ${endpoint.path.replace(/\//g, '').replace(/-/g, '_').charAt(0).toUpperCase() + endpoint.path.replace(/\//g, '').replace(/-/g, '_').slice(1)}Request` : ''}
    ${config.authentication ? `${endpoint.method === 'POST' || endpoint.method === 'PUT' ? ',' : ''}user = Depends(get_current_user)` : ''}
):
    """
    ${endpoint.description || endpoint.path.replace(/\//g, ' ').trim() + ' endpoint'}
    """
    ${endpoint.method === 'GET' ? `
    # Sample data
    items = [
        {"id": 1, "name": "Item 1", "value": "Value 1"},
        {"id": 2, "name": "Item 2", "value": "Value 2"}
    ]
    
    return items` : ''}
    ${endpoint.method === 'POST' ? `
    # Process the request
    new_item = {
        "id": 3,  # In a real app, this would be generated
        "name": request.name,
        "value": request.value
    }
    
    return new_item` : ''}
    ${endpoint.method === 'PUT' ? `
    # Update an item
    updated_item = {
        "id": 1,  # In a real app, this would be from the route parameter
        "name": request.name,
        "value": request.value
    }
    
    return updated_item` : ''}
    ${endpoint.method === 'DELETE' ? `
    # Delete an item
    # In a real app, you would use a path parameter for the ID
    
    return {"message": "Item deleted successfully"}` : ''}`,
      language: 'python'
    });
  });
  
  // Add authentication dependencies if needed
  if (config.authentication) {
    files.push({
      path: 'dependencies/__init__.py',
      content: '',
      language: 'python'
    });
    
    files.push({
      path: 'dependencies/auth.py',
      content: `from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In a real app, these would be in environment variables
SECRET_KEY = os.getenv("JWT_SECRET", "your_jwt_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return {"username": username}
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user = verify_token(token)
    if user is None:
        raise credentials_exception
    
    return user`,
      language: 'python'
    });
  }
  
  return files;
}
