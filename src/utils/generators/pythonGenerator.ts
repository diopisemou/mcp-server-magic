import { GenerationResult, ServerFile } from '@/types';
import { ExtendedServerConfig, DirectServerConfig } from '@/types/serverConfig';
import { BaseGenerator } from './baseGenerator';
import { TemplateManager } from './templateManager';

/**
 * Generator for Python/FastAPI servers
 * Implements the standard Python server generation
 */
export class PythonGenerator extends BaseGenerator {
  private templateManager: TemplateManager;
  
  constructor() {
    super();
    this.templateManager = new TemplateManager('python');
  }
  
  /**
   * Generate server files for Python/FastAPI
   * @param config Server configuration
   * @returns Generation result
   */
  generateServer(config: ExtendedServerConfig): GenerationResult {
    if (config.mode !== 'direct') {
      throw new Error('PythonGenerator only supports direct mode. Use PythonProxyGenerator for proxy mode.');
    }
    
    try {
      const serverFiles: ServerFile[] = [];
      const { authentication, endpoints } = config;
      
      // Add standard files
      serverFiles.push(this.generateRequirementsTxt(config));
      serverFiles.push(this.generateReadme(config));
      serverFiles.push(this.generateEnvFile(config));
      
      // Add source files
      serverFiles.push(this.generateMainFile(config));
      serverFiles.push(this.generateResourceRoutesFile(config));
      serverFiles.push(this.generateToolRoutesFile(config));
      
      // Add auth middleware if needed
      if (authentication.type !== 'None') {
        serverFiles.push(this.generateAuthMiddleware(config));
      }
      
      // Create module init files
      serverFiles.push(this.generateInitFile('/routes/'));
      serverFiles.push(this.generateInitFile('/middleware/'));
      
      return {
        success: true,
        files: serverFiles
      };
    } catch (error) {
      console.error('Error generating Python server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating Python server'
      };
    }
  }
  
  /**
   * Generate requirements.txt file
   * @param config Server configuration
   * @returns ServerFile for requirements.txt
   */
  private generateRequirementsTxt(config: DirectServerConfig): ServerFile {
    // Define additional requirements based on configuration
    const additionalRequirements = '';
    
    const context = {
      additionalRequirements,
      config
    };
    
    return {
      name: 'requirements.txt',
      path: '/',
      content: this.templateManager.renderTemplate('requirements', context),
      type: 'config',
      language: 'plaintext'
    };
  }
  
  /**
   * Generate main.py file
   * @param config Server configuration
   * @returns ServerFile for main.py
   */
  private generateMainFile(config: DirectServerConfig): ServerFile {
    const { authentication, endpoints } = config;
    
    // Prepare resource and tool lists for server info
    const resourcesList = endpoints
      .filter(e => e.mcpType === 'resource')
      .map(e => `"${e.path}"`)
      .join(', ');
      
    const toolsList = endpoints
      .filter(e => e.mcpType === 'tool')
      .map(e => `"${e.path}"`)
      .join(', ');
    
    // Auth import and registration
    const authImport = authentication.type !== 'None' 
      ? "from middleware.auth import api_key_auth" 
      : '';
      
    const routerRegistration = authentication.type !== 'None'
      ? 'app.include_router(resource_router, prefix="/mcp/resources", dependencies=[Depends(api_key_auth)])\n' +
        'app.include_router(tool_router, prefix="/mcp/tools", dependencies=[Depends(api_key_auth)])'
      : 'app.include_router(resource_router, prefix="/mcp/resources")\n' +
        'app.include_router(tool_router, prefix="/mcp/tools")';
    
    const context = {
      config,
      resourcesList,
      toolsList,
      authImport,
      routerRegistration
    };
    
    return {
      name: 'main.py',
      path: '/',
      content: this.templateManager.renderTemplate('mainPy', context),
      type: 'code',
      language: 'python'
    };
  }
  
  /**
   * Generate resource routes file
   * @param config Server configuration
   * @returns ServerFile for resources.py
   */
  private generateResourceRoutesFile(config: DirectServerConfig): ServerFile {
    const { endpoints } = config;
    
    // Generate routes for each resource endpoint
    const resourceRoutes = endpoints
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
        
        const routeName = endpoint.path
                          .replace(/\//g, '_')
                          .replace(/-/g, '_')
                          .replace(/[{}]/g, '')
                          .trim() || 'get_resource';
        
        return `
@router.get("${endpoint.path}")
async def ${routeName}(
    request: Request,
    ${params ? params + ',' : ''}
):
    """${endpoint.description || endpoint.path}"""
    try:
        # Extract all query parameters
        query_params = dict(request.query_params)
        
        # Return data in MCP-compliant format
        return {
            "success": True,
            "data": {
                "id": "${endpoint.path}",
                ${params ? `"params": query_params,` : ''}
                # Add your resource data here
                "content": [
                    {
                        "type": "text",
                        "text": "Sample resource data for ${endpoint.path}"
                    }
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`;
      }).join('\n');
    
    const context = {
      resourceRoutes,
      config
    };
    
    return {
      name: 'resources.py',
      path: '/routes/',
      content: this.templateManager.renderTemplate('resourceRoutes', context),
      type: 'code',
      language: 'python'
    };
  }
  
  /**
   * Generate tool routes file
   * @param config Server configuration
   * @returns ServerFile for tools.py
   */
  private generateToolRoutesFile(config: DirectServerConfig): ServerFile {
    const { endpoints } = config;
    
    // Generate tool models
    const toolModels = endpoints
      .filter(endpoint => endpoint.mcpType === 'tool' && endpoint.selected !== false)
      .filter(endpoint => endpoint.parameters.some(p => p.required))
      .map(endpoint => {
        const modelName = endpoint.path
                          .replace(/\//g, '_')
                          .replace(/-/g, '_')
                          .replace(/[{}]/g, '')
                          .trim() + 'Model';
        
        const params = endpoint.parameters
          .filter(param => param.required)
          .map(param => {
            const paramType = param.type === 'number' || param.type === 'integer' ? 'float' : 
                             param.type === 'boolean' ? 'bool' : 'str';
            return `${param.name}: ${paramType}`;
          })
          .join('\n    ');
        
        return `
class ${modelName}(BaseModel):
    ${params}`;
      }).join('\n');
    
    // Generate routes for each tool endpoint
    const toolRoutes = endpoints
      .filter(endpoint => endpoint.mcpType === 'tool' && endpoint.selected !== false)
      .map(endpoint => {
        const modelName = endpoint.path
                          .replace(/\//g, '_')
                          .replace(/-/g, '_')
                          .replace(/[{}]/g, '')
                          .trim() + 'Model';
        
        const routeName = endpoint.path
                          .replace(/\//g, '_')
                          .replace(/-/g, '_')
                          .replace(/[{}]/g, '')
                          .trim() || 'execute_tool';
                          
        const hasParams = endpoint.parameters.some(p => p.required);
        
        return `
@router.post("${endpoint.path}")
async def ${routeName}(
    request: Request,
    ${hasParams ? `data: ${modelName},` : ''}
):
    """${endpoint.description || endpoint.path}"""
    try:
        # Get request body
        ${hasParams ? 'body_data = data.model_dump()' : 'body_data = await request.json()'}
        
        # Return data in MCP-compliant format
        return {
            "success": True,
            "result": {
                "id": "${endpoint.path}",
                "requestData": body_data,
                "content": [
                    {
                        "type": "text",
                        "text": "Sample tool result for ${endpoint.path}"
                    }
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`;
      }).join('\n');
    
    const context = {
      toolModels,
      toolRoutes,
      config
    };
    
    return {
      name: 'tools.py',
      path: '/routes/',
      content: this.templateManager.renderTemplate('toolRoutes', context),
      type: 'code',
      language: 'python'
    };
  }
  
  /**
   * Generate authentication middleware
   * @param config Server configuration
   * @returns ServerFile for auth.py
   */
  private generateAuthMiddleware(config: DirectServerConfig): ServerFile {
    const { authentication } = config;
    
    const apiKeyParam = authentication.location === 'header'
      ? `${authentication.name || 'x_api_key'}: str = Header(None, alias="${authentication.name || 'x-api-key'}")`
      : 'request: Request';
    
    const apiKeySource = authentication.location === 'header'
      ? authentication.name || 'x_api_key'
      : `request.query_params.get("${authentication.name || 'api_key'}")`;
    
    const context = {
      apiKeyParam,
      apiKeySource,
      config
    };
    
    return {
      name: 'auth.py',
      path: '/middleware/',
      content: this.templateManager.renderTemplate('auth', context),
      type: 'code',
      language: 'python'
    };
  }
  
  /**
   * Generate __init__.py file for a module
   * @param path Module path
   * @returns ServerFile for __init__.py
   */
  private generateInitFile(path: string): ServerFile {
    return {
      name: '__init__.py',
      path,
      content: '',
      type: 'code',
      language: 'python'
    };
  }
  
  /**
   * Get a list of features supported by this generator
   * @returns Array of supported feature strings
   */
  getSupportedFeatures(): string[] {
    return [
      ...super.getSupportedFeatures(),
      'python',
      'fastapi',
      'pydantic',
      'uvicorn'
    ];
  }
}
