
import yaml from 'js-yaml';
import { Endpoint, Parameter, Response } from '@/types';

type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

interface ValidationResult {
  isValid: boolean;
  format: ApiFormat;
  errors?: string[];
  parsedDefinition?: any;
  apiInfo?: {
    title: string;
    version: string;
    description?: string;
  };
}

// Helper function to determine if content is JSON or YAML
const detectContentType = (content: string): 'json' | 'yaml' | 'raml' | 'markdown' => {
  content = content.trim();
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json';
  } else if (content.startsWith('#%RAML')) {
    return 'raml';
  } else if (content.startsWith('# ') || content.startsWith('FORMAT:')) {
    return 'markdown'; // Potential API Blueprint
  } else {
    return 'yaml';
  }
};

// Parse content based on detected type
const parseContent = (content: string, contentType: 'json' | 'yaml' | 'raml' | 'markdown'): any => {
  try {
    if (contentType === 'json') {
      return JSON.parse(content);
    } else if (contentType === 'yaml') {
      return yaml.load(content);
    } else if (contentType === 'raml') {
      // Basic RAML parsing - in a real app, use raml-parser
      // For now, extract basic info from RAML header
      const lines = content.split('\n');
      const version = lines.find(line => line.trim().startsWith('#%RAML'))?.split(' ')[1] || '';
      const title = lines.find(line => line.trim().startsWith('title:'))?.split('title:')[1]?.trim() || '';
      return { ramlVersion: version, title, isRaml: true };
    } else if (contentType === 'markdown') {
      // Basic API Blueprint parsing - in a real app, use a proper parser
      return { isApiBlueprint: true, content };
    }
  } catch (error) {
    console.error('Error parsing content:', error);
    throw new Error('Failed to parse content');
  }
  return null;
};

// Determine API format from parsed content
const determineApiFormat = (parsedContent: any): ApiFormat => {
  if (parsedContent.swagger && parsedContent.swagger.startsWith('2.')) {
    return 'OpenAPI2';
  } else if (parsedContent.openapi && parsedContent.openapi.startsWith('3.')) {
    return 'OpenAPI3';
  } else if (parsedContent.isRaml) {
    return 'RAML';
  } else if (parsedContent.isApiBlueprint) {
    return 'APIBlueprint';
  }
  
  // Default to OpenAPI3 if unknown
  return 'OpenAPI3';
};

// Validate OpenAPI 2.0 (Swagger)
const validateOpenAPI2 = (parsedContent: any): string[] => {
  const errors: string[] = [];
  
  if (!parsedContent.swagger || parsedContent.swagger !== '2.0') {
    errors.push('Invalid Swagger version. Must be 2.0');
  }
  
  if (!parsedContent.info) {
    errors.push('Missing info object');
  } else {
    if (!parsedContent.info.title) {
      errors.push('Missing API title');
    }
    if (!parsedContent.info.version) {
      errors.push('Missing API version');
    }
  }
  
  if (!parsedContent.paths) {
    errors.push('Missing paths object');
  }
  
  return errors;
};

// Validate OpenAPI 3.0
const validateOpenAPI3 = (parsedContent: any): string[] => {
  const errors: string[] = [];
  
  if (!parsedContent.openapi || !parsedContent.openapi.startsWith('3.')) {
    errors.push('Invalid OpenAPI version. Must be 3.x');
  }
  
  if (!parsedContent.info) {
    errors.push('Missing info object');
  } else {
    if (!parsedContent.info.title) {
      errors.push('Missing API title');
    }
    if (!parsedContent.info.version) {
      errors.push('Missing API version');
    }
  }
  
  if (!parsedContent.paths) {
    errors.push('Missing paths object');
  }
  
  return errors;
};

// Main validation function
export const validateApiDefinition = async (content: string, fileName?: string): Promise<ValidationResult> => {
  try {
    const contentType = detectContentType(content);
    const parsedContent = parseContent(content, contentType);
    
    if (!parsedContent) {
      return { 
        isValid: false, 
        format: 'OpenAPI3', 
        errors: ['Could not parse API definition'] 
      };
    }
    
    const format = determineApiFormat(parsedContent);
    let errors: string[] = [];
    
    // Validate based on format
    if (format === 'OpenAPI2') {
      errors = validateOpenAPI2(parsedContent);
    } else if (format === 'OpenAPI3') {
      errors = validateOpenAPI3(parsedContent);
    } else if (format === 'RAML') {
      // Basic RAML validation
      if (!parsedContent.title) {
        errors.push('Missing API title');
      }
    } else if (format === 'APIBlueprint') {
      // Basic API Blueprint validation
      if (!content.includes('FORMAT: 1A')) {
        errors.push('Invalid API Blueprint format. Should include FORMAT: 1A');
      }
    }
    
    // Extract API information
    const apiInfo = {
      title: '',
      version: '',
      description: ''
    };
    
    if (format === 'OpenAPI2' || format === 'OpenAPI3') {
      if (parsedContent.info) {
        apiInfo.title = parsedContent.info.title || '';
        apiInfo.version = parsedContent.info.version || '';
        apiInfo.description = parsedContent.info.description || '';
      }
    } else if (format === 'RAML') {
      apiInfo.title = parsedContent.title || '';
      apiInfo.version = parsedContent.version || '';
      apiInfo.description = parsedContent.description || '';
    } else if (format === 'APIBlueprint') {
      // Would need a proper parser for API Blueprint
      apiInfo.title = 'API Blueprint Document';
      apiInfo.version = '1.0';
    }
    
    return {
      isValid: errors.length === 0,
      format,
      errors: errors.length > 0 ? errors : undefined,
      parsedDefinition: parsedContent,
      apiInfo
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      format: 'OpenAPI3',
      errors: [`Failed to validate API: ${(error as Error).message}`]
    };
  }
};

// Extract endpoints from an API definition
export const extractEndpoints = (parsedDefinition: any, format: ApiFormat): Endpoint[] => {
  const endpoints: Endpoint[] = [];
  
  try {
    if (format === 'OpenAPI2' || format === 'OpenAPI3') {
      const paths = parsedDefinition.paths || {};
      
      // Iterate through each path
      Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
        // Iterate through each HTTP method (get, post, put, delete, etc.)
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
          // Skip non-HTTP method properties
          if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
            return;
          }
          
          // Extract parameters
          const parameters: Parameter[] = [];
          const operationParams = operation.parameters || [];
          
          operationParams.forEach((param: any) => {
            parameters.push({
              name: param.name || '',
              in: param.in || 'query',
              required: !!param.required,
              type: param.type || (param.schema ? param.schema.type : 'string'),
              description: param.description || ''
            });
          });
          
          // Extract request body for OpenAPI3
          if (format === 'OpenAPI3' && operation.requestBody) {
            const content = operation.requestBody.content || {};
            const contentType = Object.keys(content)[0] || 'application/json';
            const schema = content[contentType]?.schema;
            
            if (schema) {
              parameters.push({
                name: 'body',
                in: 'body',
                required: !!operation.requestBody.required,
                type: schema.type || 'object',
                description: operation.requestBody.description || 'Request body'
              });
            }
          }
          
          // Extract responses
          const responses: Response[] = [];
          const operationResponses = operation.responses || {};
          
          Object.entries(operationResponses).forEach(([statusCode, response]: [string, any]) => {
            responses.push({
              statusCode,
              description: response.description || '',
              contentType: format === 'OpenAPI3' 
                ? Object.keys(response.content || { 'application/json': {} })[0] || 'application/json'
                : 'application/json'
            });
          });
          
          // Create endpoint object
          endpoints.push({
            id: `${method}-${path}`,
            path,
            method: method.toUpperCase() as any,
            summary: operation.summary || '',
            description: operation.description || '',
            parameters,
            responses,
            tags: operation.tags || [],
            operationId: operation.operationId || '',
            mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool',
            enabled: true
          });
        });
      });
    } else if (format === 'RAML') {
      // Basic RAML endpoint extraction (simplified)
      // In a real app, use a proper RAML parser
      // This is just a placeholder
      endpoints.push({
        id: 'raml-endpoint',
        path: '/api',
        method: 'GET',
        summary: 'RAML Endpoint',
        description: 'Placeholder for RAML endpoint',
        parameters: [],
        responses: [],
        tags: [],
        operationId: 'ramlEndpoint',
        mcpType: 'resource',
        enabled: true
      });
    } else if (format === 'APIBlueprint') {
      // Basic API Blueprint endpoint extraction (simplified)
      // In a real app, use a proper API Blueprint parser
      // This is just a placeholder
      endpoints.push({
        id: 'blueprint-endpoint',
        path: '/api',
        method: 'GET',
        summary: 'API Blueprint Endpoint',
        description: 'Placeholder for API Blueprint endpoint',
        parameters: [],
        responses: [],
        tags: [],
        operationId: 'blueprintEndpoint',
        mcpType: 'resource',
        enabled: true
      });
    }
    
    return endpoints;
  } catch (error) {
    console.error('Error extracting endpoints:', error);
    return [];
  }
};
