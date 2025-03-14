
import { ServerConfig, ServerFile, GenerationResult } from '@/types';
import { generateReadme } from './readmeGenerator';

/**
 * Generate Python/FastAPI server files based on the given configuration
 */
export const generatePythonServer = (
  config: ServerConfig
): GenerationResult => {
  const serverFiles: ServerFile[] = [];
  const { authentication } = config;

  // Generate requirements.txt
  serverFiles.push({
    name: 'requirements.txt',
    path: 'requirements.txt',
    content: `fastapi==0.103.1
uvicorn==0.23.2
anthropic==0.6.0
python-dotenv==1.0.0
pydantic==2.3.0
`,
    type: 'config',
    language: 'plaintext'
  });

  // Generate .env file
  serverFiles.push({
    name: '.env',
    path: '.env',
    content: `# MCP Server Configuration
PORT=3000
${authentication.type !== 'None' ? `API_KEY=${config.authSecret || 'your-api-key'}` : ''}
`,
    type: 'config',
    language: 'plaintext'
  });

  // Generate README.md
  serverFiles.push({
    name: 'README.md',
    path: 'README.md',
    content: generateReadme(
      config.name,
      config.description,
      'Python',
      authentication.type,
      config.endpoints
    ),
    type: 'documentation',
    language: 'markdown'
  });

  // Generate main.py
  serverFiles.push({
    name: 'main.py',
    path: 'main.py',
    content: `from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List
import os
from dotenv import load_dotenv

# Import route modules
from routes.resources import router as resource_router
from routes.tools import router as tool_router
${authentication.type !== 'None' ? 'from middleware.auth import api_key_auth\n' : ''}

load_dotenv()

app = FastAPI(
    title="${config.name}",
    description="${config.description || 'MCP Server generated by MCP Server Generator'}",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Return information about the MCP server"""
    return {
        "name": "${config.name}",
        "description": "${config.description || 'MCP Server'}",
        "capabilities": {
            "resources": [${config.endpoints.filter(e => e.mcpType === 'resource').map(e => `"${e.path}"`).join(', ')}],
            "tools": [${config.endpoints.filter(e => e.mcpType === 'tool').map(e => `"${e.path}"`).join(', ')}]
        }
    }

# Include routers with dependency if authentication is required
${authentication.type !== 'None' 
  ? 'app.include_router(resource_router, prefix="/mcp/resources", dependencies=[Depends(api_key_auth)])\n' +
    'app.include_router(tool_router, prefix="/mcp/tools", dependencies=[Depends(api_key_auth)])'
  : 'app.include_router(resource_router, prefix="/mcp/resources")\n' +
    'app.include_router(tool_router, prefix="/mcp/tools")'
}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
`,
    type: 'code',
    language: 'python'
  });

  // Generate auth middleware if needed
  if (authentication.type !== 'None') {
    serverFiles.push({
      name: 'auth.py',
      path: 'middleware/auth.py',
      content: `from fastapi import Header, HTTPException, Request, Depends
import os
from typing import Optional

async def api_key_auth(${authentication.location === 'header' 
    ? `${authentication.name || 'x_api_key'}: str = Header(None, alias="${authentication.name || 'x-api-key'}")` 
    : `request: Request`}):
    """Validate API key for protected endpoints"""
    api_key = ${authentication.location === 'header' 
        ? authentication.name || 'x_api_key' 
        : `request.query_params.get("${authentication.name || 'api_key'}")`}
    expected_api_key = os.getenv("API_KEY")
    
    if not api_key or api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    return True
`,
      type: 'code',
      language: 'python'
    });
  }

  // Create __init__.py files for Python modules
  serverFiles.push({
    name: '__init__.py',
    path: 'middleware/__init__.py',
    content: '',
    type: 'code',
    language: 'python'
  });

  serverFiles.push({
    name: '__init__.py',
    path: 'routes/__init__.py',
    content: '',
    type: 'code',
    language: 'python'
  });

  // Generate resource routes
  serverFiles.push({
    name: 'resources.py',
    path: 'routes/resources.py',
    content: `from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional, List

router = APIRouter()

${config.endpoints
  .filter(endpoint => endpoint.mcpType === 'resource' && endpoint.selected !== false)
  .map(endpoint => {
    const params = endpoint.parameters
      .filter(param => param.required)
      .map(param => {
        const paramType = param.type === 'number' || param.type === 'integer' ? 'float' : 
                         param.type === 'boolean' ? 'bool' : 'str';
        return `${param.name}: ${paramType} = Query(None, description="${param.description || ''}")`;
      })
      .join(', ');
    
    return `
@router.get("${endpoint.path}")
async def ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').replace(/[{}]/g, '').trim() || 'get_resource'}(${params}):
    """${endpoint.description || endpoint.path}"""
    try:
        # TODO: Implement the resource handling logic
        
        return {
            "data": {
                "resourceId": "${endpoint.path}",
                ${params ? `"params": {${endpoint.parameters.filter(p => p.required).map(p => `"${p.name}": ${p.name}`).join(', ')}},` : ''}
                # Add your resource data here
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`}).join('\n')}
`,
    type: 'code',
    language: 'python'
  });

  // Generate tool routes
  serverFiles.push({
    name: 'tools.py',
    path: 'routes/tools.py',
    content: `from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

router = APIRouter()

${config.endpoints
  .filter(endpoint => endpoint.mcpType === 'tool' && endpoint.selected !== false)
  .map(endpoint => {
    const requiredParams = endpoint.parameters.filter(param => param.required);
    const hasParams = requiredParams.length > 0;
    
    let content = '';
    
    if (hasParams) {
      // Create Pydantic model for required parameters
      content += `
class ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').replace(/[{}]/g, '').trim() || 'ToolParams'}(BaseModel):
    ${requiredParams.map(param => {
      const paramType = param.type === 'number' || param.type === 'integer' ? 'float' : 
                       param.type === 'boolean' ? 'bool' : 'str';
      return `${param.name}: ${paramType} # ${param.description || ''}`;
    }).join('\n    ')}
`;
    }
    
    content += `
@router.post("${endpoint.path}")
async def ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').replace(/[{}]/g, '').trim() || 'execute_tool'}(${hasParams ? `data: ${endpoint.path.replace(/\//g, '_').replace(/-/g, '_').replace(/[{}]/g, '').trim() || 'ToolParams'} = Body(...)` : ''}):
    """${endpoint.description || endpoint.path}"""
    try:
        # TODO: Implement the tool handling logic
        ${hasParams ? '# Access parameters with data.param_name' : ''}
        
        return {
            "result": {
                "toolId": "${endpoint.path}",
                ${hasParams ? `"params": {${requiredParams.map(p => `"${p.name}": data.${p.name}`).join(', ')}},` : ''}
                # Add your tool result data here
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`;
    
    return content;
  }).join('\n')}
`,
    type: 'code',
    language: 'python'
  });

  return {
    success: true,
    files: serverFiles
  };
};
