
import { ApiFormat, Endpoint } from '@/types';
import yaml from 'js-yaml';

// Mock validation - in a real app, use a proper validator library
export const validateApiDefinition = async (content: string, fileName: string) => {
  console.log('Validating API definition:', { fileName, contentLength: content.length });
  
  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    let contentType: string;
    
    // Detect content type from file extension or content structure
    if (fileExtension === 'json' || content.trim().startsWith('{')) {
      contentType = 'json';
    } else if (['yaml', 'yml'].includes(fileExtension) || 
               content.trim().startsWith('openapi:') || 
               content.trim().startsWith('swagger:')) {
      contentType = 'yaml';
    } else if (fileExtension === 'raml' || content.includes('#%RAML')) {
      contentType = 'raml';
    } else if (fileExtension === 'apib' || content.includes('FORMAT: 1A')) {
      contentType = 'apib';
    } else {
      // Default to YAML for OpenAPI files without clear indicators
      contentType = 'yaml';
    }
    
    console.log('Detected content type:', contentType);
    
    // Parse the definition based on the detected content type
    const parsedDefinition = parseContent(content, contentType);
    console.log('Parsed definition:', parsedDefinition);
    
    // Detect the API format
    const format = detectApiFormat(parsedDefinition);
    console.log('Detected API format:', format);
    
    if (!format) {
      return {
        isValid: false,
        errors: ['Unsupported API format or invalid definition'],
        format: null,
        parsedDefinition: null
      };
    }
    
    // Extract API info for validation
    const apiInfo = extractApiInfo(parsedDefinition, format);
    
    return {
      isValid: true,
      format: format,
      parsedDefinition: parsedDefinition,
      apiInfo
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      errors: [(error as Error).message],
      format: null,
      parsedDefinition: null
    };
  }
};

const parseContent = (content: string, contentType: string): any => {
  try {
    console.log('Parsing content as:', contentType);
    
    // Handle JSON content
    if (contentType === 'json') {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error('JSON parsing error:', error);
        throw new Error('Invalid JSON format');
      }
    } 
    // Handle YAML content
    else if (contentType === 'yaml') {
      try {
        const parsedYaml = yaml.load(content);
        console.log('YAML parsed result:', parsedYaml);
        return parsedYaml;
      } catch (error) {
        console.error('YAML parsing error:', error);
        throw new Error('Invalid YAML format');
      }
    } 
    // Handle RAML content
    else if (contentType === 'raml') {
      const lines = content.split('\n');
      const ramlObj: any = { 
        '#%RAML': true,
        title: '', 
        version: '', 
        baseUri: '' 
      };

      lines.forEach(line => {
        if (line.startsWith('title:')) ramlObj.title = line.replace('title:', '').trim();
        if (line.startsWith('version:')) ramlObj.version = line.replace('version:', '').trim();
        if (line.startsWith('baseUri:')) ramlObj.baseUri = line.replace('baseUri:', '').trim();
      });

      return ramlObj;
    } 
    // Handle API Blueprint content
    else if (contentType === 'apib') {
      const lines = content.split('\n');
      const apibObj: any = { 
        FORMAT: 'API Blueprint',
        title: '', 
        description: '' 
      };

      // Try to extract FORMAT and title
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        if (line.startsWith('# ')) {
          apibObj.title = line.replace('# ', '').trim();
        } else if (line.trim() !== '' && !apibObj.description) {
          apibObj.description = line.trim();
        }
      }

      return apibObj;
    }

    throw new Error('Unsupported content type');
  } catch (error) {
    console.error('Error parsing content:', error);
    throw error;
  }
};

// Detect API format from parsed definition
const detectApiFormat = (parsedDefinition: any): ApiFormat | null => {
  console.log('Detecting API format from:', parsedDefinition);
  
  if (!parsedDefinition) {
    return null;
  }
  
  if (parsedDefinition.swagger === '2.0') {
    return 'OpenAPI2';
  } else if (parsedDefinition.openapi && parsedDefinition.openapi.startsWith('3.')) {
    return 'OpenAPI3';
  } else if (parsedDefinition['#%RAML']) {
    return 'RAML';
  } else if (parsedDefinition.FORMAT && parsedDefinition.FORMAT.includes('API Blueprint')) {
    return 'APIBlueprint';
  }

  // If we can't definitively determine the format but it has common OpenAPI fields
  if (parsedDefinition.info && parsedDefinition.paths) {
    // Guess based on structure
    return 'OpenAPI3';
  }

  return null;
};

// Extract basic API info
const extractApiInfo = (parsedDefinition: any, format: ApiFormat) => {
  const info: { title: string; description: string; version: string } = {
    title: 'Untitled API',
    description: '',
    version: '1.0.0'
  };

  try {
    if (format === 'OpenAPI2' || format === 'OpenAPI3') {
      if (parsedDefinition.info) {
        info.title = parsedDefinition.info.title || info.title;
        info.description = parsedDefinition.info.description || info.description;
        info.version = parsedDefinition.info.version || info.version;
      }
    } else if (format === 'RAML') {
      info.title = parsedDefinition.title || info.title;
      info.version = parsedDefinition.version || info.version;
      info.description = parsedDefinition.documentation?.[0]?.content || '';
    } else if (format === 'APIBlueprint') {
      info.title = parsedDefinition.title || info.title;
      info.description = parsedDefinition.description || info.description;
    }
  } catch (error) {
    console.error('Error extracting API info:', error);
  }

  return info;
};

// Mock API fetching (for URL inputs)
export const fetchApiDefinition = async (url: string) => {
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();
    
    // Detect format from URL and content-type
    let format: string;
    if (url.endsWith('.json') || contentType.includes('json')) {
      format = 'json';
    } else if (url.endsWith('.yaml') || url.endsWith('.yml') || contentType.includes('yaml')) {
      format = 'yaml';
    } else if (url.endsWith('.raml') || contentType.includes('raml')) {
      format = 'raml';
    } else if (url.endsWith('.apib') || contentType.includes('apib')) {
      format = 'apib';
    } else {
      // Try to detect from content
      if (content.trim().startsWith('{')) {
        format = 'json';
      } else if (content.trim().startsWith('openapi:') || content.trim().startsWith('swagger:')) {
        format = 'yaml';
      } else if (content.includes('#%RAML')) {
        format = 'raml';
      } else if (content.includes('FORMAT: 1A')) {
        format = 'apib';
      } else {
        format = 'yaml'; // Default to yaml
      }
    }
    
    return { content, format };
  } catch (error) {
    throw new Error(`Failed to fetch API definition: ${(error as Error).message}`);
  }
};

// Mock API endpoint testing
export const testApiEndpoint = async (endpoint: string, method: string) => {
  // In a real app, this would actually call the endpoint
  console.log(`Testing ${method} ${endpoint}`);
  
  // Mock response
  return {
    status: 200,
    data: { message: 'Endpoint test successful' }
  };
};

// Extract endpoints from API definition
export const extractEndpoints = (apiDef: any, format: string): Endpoint[] => {
  console.log('Extracting endpoints from:', { format, apiDef });
  const endpoints: Endpoint[] = [];

  try {
    if (!apiDef || !format) {
      console.error('Missing API definition or format');
      return [];
    }

    // OpenAPI 3.x
    if (format === 'OpenAPI3' && apiDef.paths) {
      console.log('Processing OpenAPI3 paths:', Object.keys(apiDef.paths));
      
      Object.entries(apiDef.paths).forEach(([path, pathItem]: [string, any]) => {
        if (!pathItem) return;
        
        // Process each HTTP method in the path
        ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].forEach(method => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            console.log(`Found ${method.toUpperCase()} ${path} operation:`, operation.operationId || 'unnamed');
            
            const parameters = [];
            // Process path parameters
            if (operation.parameters) {
              operation.parameters.forEach((param: any) => {
                parameters.push({
                  name: param.name,
                  in: param.in,
                  required: !!param.required,
                  schema: param.schema || { type: 'string' },
                  description: param.description || ''
                });
              });
            }
            
            // Process request body if present
            if (operation.requestBody) {
              let requestBodyType = '';
              let requestBodySchema = null;
              
              if (operation.requestBody.content) {
                // Try common content types
                const contentTypes = [
                  'application/json', 
                  'application/xml',
                  'application/x-www-form-urlencoded',
                  'multipart/form-data'
                ];
                
                for (const contentType of contentTypes) {
                  if (operation.requestBody.content[contentType]) {
                    requestBodyType = contentType;
                    requestBodySchema = operation.requestBody.content[contentType].schema;
                    break;
                  }
                }
                
                // If still no match, use the first available content type
                if (!requestBodyType) {
                  const availableTypes = Object.keys(operation.requestBody.content);
                  if (availableTypes.length > 0) {
                    requestBodyType = availableTypes[0];
                    requestBodySchema = operation.requestBody.content[requestBodyType].schema;
                  }
                }
              }
              
              if (requestBodySchema) {
                parameters.push({
                  name: 'requestBody',
                  in: 'body',
                  required: operation.requestBody.required === true,
                  schema: requestBodySchema,
                  description: operation.requestBody.description || 'Request body'
                });
              }
            }
            
            // Extract responses
            const responses = [];
            if (operation.responses) {
              for (const [statusCode, response] of Object.entries(operation.responses)) {
                let schema = null;
                if ((response as any).content) {
                  // Get first content type schema
                  const contentType = Object.keys((response as any).content)[0];
                  if (contentType && (response as any).content[contentType].schema) {
                    schema = (response as any).content[contentType].schema;
                  }
                }
                
                responses.push({
                  statusCode,
                  description: (response as any).description || '',
                  schema
                });
              }
            }
            
            endpoints.push({
              id: `${method}-${path}`,
              path,
              method: method.toUpperCase() as Endpoint['method'],
              operationId: operation.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
              summary: operation.summary || '',
              description: operation.description || '',
              parameters,
              responses,
              tags: operation.tags || [],
              mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool',
            });
          }
        });
      });
    }
    // OpenAPI 2.0 (Swagger)
    else if (format === 'OpenAPI2' && apiDef.paths) {
      console.log('Processing OpenAPI2 paths:', Object.keys(apiDef.paths));
      
      Object.entries(apiDef.paths).forEach(([path, pathItem]: [string, any]) => {
        if (!pathItem) return;
        
        ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].forEach(method => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            
            const parameters = [];
            // Process parameters
            if (operation.parameters) {
              operation.parameters.forEach((param: any) => {
                parameters.push({
                  name: param.name,
                  in: param.in,
                  required: !!param.required,
                  schema: param.schema || { type: param.type || 'string' },
                  description: param.description || ''
                });
              });
            }
            
            // Extract responses
            const responses = [];
            if (operation.responses) {
              for (const [statusCode, response] of Object.entries(operation.responses)) {
                responses.push({
                  statusCode,
                  description: (response as any).description || '',
                  schema: (response as any).schema || null
                });
              }
            }
            
            endpoints.push({
              id: `${method}-${path}`,
              path,
              method: method.toUpperCase() as Endpoint['method'],
              operationId: operation.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
              summary: operation.summary || '',
              description: operation.description || '',
              parameters,
              responses,
              tags: operation.tags || [],
              mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool',
            });
          }
        });
      });
    }
    // RAML (basic support)
    else if (format === 'RAML') {
      // Basic RAML parsing - in a real app use a full RAML parser
      console.log('RAML format detected, but detailed endpoint extraction requires a full RAML parser');
      
      // Add a placeholder endpoint
      endpoints.push({
        id: 'raml-placeholder',
        path: '/',
        method: 'GET',
        operationId: 'getRamlRoot',
        summary: 'RAML Root Endpoint',
        description: 'RAML endpoint details would be extracted with a full parser',
        parameters: [],
        responses: [],
        tags: [],
        mcpType: 'resource',
      });
    }
    // API Blueprint (basic support)
    else if (format === 'APIBlueprint') {
      console.log('API Blueprint format detected, but detailed endpoint extraction requires a full parser');
      
      // Add a placeholder endpoint
      endpoints.push({
        id: 'blueprint-placeholder',
        path: '/',
        method: 'GET',
        operationId: 'getBlueprintRoot',
        summary: 'API Blueprint Root Endpoint',
        description: 'API Blueprint endpoint details would be extracted with a full parser',
        parameters: [],
        responses: [],
        tags: [],
        mcpType: 'resource',
      });
    }
    
    console.log(`Extracted ${endpoints.length} endpoints:`, endpoints.map(e => `${e.method} ${e.path}`));
    return endpoints;
  } catch (error) {
    console.error('Error extracting endpoints:', error);
    return [];
  }
};
