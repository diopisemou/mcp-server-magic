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
export const validateApiDefinition = async (content: string, format?: ApiFormat): Promise<ValidationResult> => {
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
  if (!parsedDefinition) return [];

  // Extract endpoints based on format
  if (format === 'OpenAPI2' || format === 'OpenAPI3') {
    // OpenAPI extraction
    const paths = parsedDefinition.paths || {};
    const endpoints: Endpoint[] = [];

    for (const path in paths) {
      for (const method in paths[path]) {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
          const operation = paths[path][method];
          const parameters = [];

          // Process parameters
          if (operation.parameters) {
            for (const param of operation.parameters) {
              parameters.push({
                name: param.name,
                in: param.in,
                required: param.required || false,
                type: param.type || (param.schema?.type) || 'string',
                description: param.description || ''
              });
            }
          }

          // Process responses
          const responses = [];
          if (operation.responses) {
            for (const statusCode in operation.responses) {
              responses.push({
                statusCode,
                description: operation.responses[statusCode].description || ''
              });
            }
          }

          endpoints.push({
            id: `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
            path,
            method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
            summary: operation.summary || '',
            description: operation.description || '',
            parameters,
            responses,
            mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool'
          });
        }
      }
    }

    return endpoints;
  } else if (format === 'RAML') {
    // Basic RAML extraction
    return [];
  } else if (format === 'APIBlueprint') {
    // Basic API Blueprint extraction
    return [];
  }

  return [];
};