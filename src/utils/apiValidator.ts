import yaml from 'js-yaml';

// Polyfill for Buffer in browser environments
const BufferPolyfill = {
  isBuffer: (obj: any): boolean => {
    return obj && typeof obj === 'object' &&
      (typeof obj.byteLength === 'number' || 
       (obj instanceof Uint8Array) || 
       (obj instanceof ArrayBuffer));
  },
  from: (data: string): { toString: () => string } => {
    return {
      toString: () => data
    };
  }
};

// Use native Buffer if available (Node.js) or polyfill (browser)
const BufferImpl = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

// Extract Swagger definition URL from HTML content
export const extractSwaggerUrl = (htmlContent: string, baseUrl: string): string | null => {
  // Look for common patterns in Swagger UI HTML
  const patterns = [
    /url:\s*['"](.*?)['"]/,                         // Standard Swagger UI config
    /spec:\s*{"url":\s*['"](.*?)['"]}/,            // Alternative format
    /"swagger-ui".*?["'].*?["'](.*\.json|.*\.yaml|.*\.yml)["']/i, // Script src referencing spec
    /href=["'](.*\.json|.*\.yaml|.*\.yml)["']/i     // Direct link to spec
  ];

  for (const pattern of patterns) {
    const matches = htmlContent.match(pattern);
    if (matches && matches[1]) {
      // Resolve relative URLs
      try {
        return new URL(matches[1], baseUrl).href;
      } catch (e) {
        console.error('Error resolving URL:', e);
      }
    }
  }

  return null;
};

// Parse content based on detected type


interface ValidationResult {
  isValid: boolean;
  format: ApiFormat;
  errors?: string[];
  parsedDefinition?: any;
}

import { detectFileType, parseFileContent } from './fileUtils';

// Helper function to determine if content is JSON or YAML
const detectContentType = (content: string | Buffer | object, filename?: string): 'json' | 'yaml' | 'raml' | 'markdown' | 'unknown' => {
  // Handle Buffer or non-string content
  if (BufferImpl.isBuffer(content)) {
    content = content.toString();
  } else if (typeof content !== 'string') {
    // If content is an object (already parsed JSON), return 'json'
    if (typeof content === 'object') {
      return 'json';
    }
    // Convert to string if possible, otherwise return unknown
    try {
      content = String(content);
    } catch (e) {
      return 'unknown';
    }
  }

  // Make sure we have a string to work with
  if (typeof content !== 'string') {
    return 'unknown';
  }

  const trimmedContent = content.trim();

  if (trimmedContent.startsWith('#%RAML')) {
    return 'raml';
  } else if (trimmedContent.startsWith('# ') || trimmedContent.startsWith('FORMAT:')) {
    return 'markdown'; // Potential API Blueprint
  } 
  
  // Use the file utils to detect JSON/YAML
  return detectFileType(trimmedContent, filename);
};

// Parse content based on detected type
const parseContent = (content: string, contentType: 'json' | 'yaml' | 'raml' | 'markdown' | 'unknown'): any => {
  try {
    if (contentType === 'json' || contentType === 'yaml') {
      return parseFileContent(content, contentType);
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
    } else if (contentType === 'unknown') {
      // Try both formats
      try {
        return parseFileContent(content, 'json');
      } catch (e1) {
        try {
          return parseFileContent(content, 'yaml');
        } catch (e2) {
          throw new Error('Could not parse content as JSON or YAML');
        }
      }
    }
  } catch (error) {
    console.error('Error parsing content:', error);
    throw new Error(`Failed to parse content: ${(error as Error).message}`);
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

  if (!parsedContent.paths || Object.keys(parsedContent.paths).length === 0) {
    errors.push('No paths defined in the API');
  }

  return errors;
};

// Validate OpenAPI 3.0
const validateOpenAPI3 = (parsedContent: any): string[] => {
  const errors: string[] = [];

  if (!parsedContent.openapi || !parsedContent.openapi.startsWith('3.')) {
    errors.push('Invalid OpenAPI version. Must start with 3.');
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

  if (!parsedContent.paths || Object.keys(parsedContent.paths).length === 0) {
    errors.push('No paths defined in the API');
  }

  return errors;
};

// Basic validation for RAML
const validateRAML = (parsedContent: any): string[] => {
  const errors: string[] = [];

  if (!parsedContent.ramlVersion) {
    errors.push('Could not determine RAML version');
  }

  if (!parsedContent.title) {
    errors.push('Missing API title');
  }

  return errors;
};

// Basic validation for API Blueprint
const validateAPIBlueprint = (parsedContent: any): string[] => {
  const errors: string[] = [];

  if (!parsedContent.content || parsedContent.content.trim() === '') {
    errors.push('Empty API Blueprint document');
  }

  if (!parsedContent.content.includes('# ') && !parsedContent.content.includes('FORMAT:')) {
    errors.push('Missing API Blueprint header or format specification');
  }

  return errors;
};

// Extract endpoints from API definition
export const extractEndpoints = (apiDefinition: any, format: ApiFormat): Endpoint[] => {
  const endpoints: Endpoint[] = [];
  console.log('Extracting endpoints from format:', format);
  console.log('API Definition (sample):', JSON.stringify(apiDefinition).substring(0, 300) + '...');
  
  try {
    // Handle case where API definition might be nested in different ways
    const definition = 
      apiDefinition.parsedDefinition || // From validateApiDefinition result
      (apiDefinition.content ? JSON.parse(apiDefinition.content).parsedDefinition : null) || // From DB content
      apiDefinition; // Direct definition
    
    if (!definition) {
      console.error('No valid definition found in:', apiDefinition);
      return endpoints;
    }
    
    if ((format === 'OpenAPI2' || format === 'OpenAPI3') && definition.paths) {
      const paths = definition.paths || {};

      Object.keys(paths).forEach(path => {
        const pathObj = paths[path];
        if (!pathObj) return;

        // Common HTTP methods
        const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

        methods.forEach(method => {
          if (pathObj[method]) {
            const operation = pathObj[method];

            // Extract parameters
            const parameters = [];
            
            // Add path parameters if they exist
            if (Array.isArray(pathObj.parameters)) {
              parameters.push(...pathObj.parameters);
            }
            
            // Add operation parameters if they exist
            if (Array.isArray(operation.parameters)) {
              parameters.push(...operation.parameters);
            }
            
            const formattedParameters = parameters.map(param => ({
              name: param.name,
              type: (param.schema?.type || param.type || 'string'),
              required: !!param.required,
              description: param.description || ''
            }));

            // Extract responses
            const responses = [];
            if (operation.responses) {
              for (const [statusCode, response] of Object.entries(operation.responses)) {
                if (response) {
                  responses.push({
                    statusCode: parseInt(statusCode, 10) || statusCode,
                    description: response.description || '',
                    schema: response.schema || (response.content ? response.content : null)
                  });
                }
              }
            }

            endpoints.push({
              id: `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
              path,
              method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
              description: operation.summary || operation.description || '',
              parameters: formattedParameters,
              responses
            });
          }
        });
      });
    } else if (format === 'RAML') {
      if (definition.resources) {
        definition.resources.forEach(resource => {
          const basePath = resource.relativeUri || '';

          (resource.methods || []).forEach(method => {
            endpoints.push({
              id: `${method.method}-${basePath}`.replace(/[^a-zA-Z0-9]/g, '-'),
              path: basePath,
              method: method.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
              description: method.description || '',
              parameters: (method.queryParameters || []).map(param => ({
                name: param.name,
                type: param.type || 'string',
                required: !!param.required,
                description: param.description || ''
              })),
              responses: Object.keys(method.responses || {}).map(statusCode => ({
                statusCode: parseInt(statusCode, 10) || statusCode,
                description: method.responses[statusCode].description || '',
                schema: null
              }))
            });
          });
        });
      }
    } else if (format === 'APIBlueprint') {
      if (definition.ast && definition.ast.resourceGroups) {
        definition.ast.resourceGroups.forEach(group => {
          (group.resources || []).forEach(resource => {
            (resource.actions || []).forEach(action => {
              endpoints.push({
                id: `${action.method}-${resource.uriTemplate}`.replace(/[^a-zA-Z0-9]/g, '-'),
                path: resource.uriTemplate || '',
                method: action.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
                description: action.description || resource.description || '',
                parameters: (action.parameters || []).map(param => ({
                  name: param.name,
                  type: 'string',
                  required: !!param.required,
                  description: param.description || ''
                })),
                responses: (action.examples || []).flatMap(example =>
                  (example.responses || []).map(response => ({
                    statusCode: response.status || 200,
                    description: response.description || '',
                    schema: response.body || null
                  }))
                )
              });
            });
          });
        });
      }
    }
    
    // Fallback for simple/custom API definitions
    if (endpoints.length === 0 && typeof definition === 'object') {
      // Try to extract from top-level endpoints array if it exists
      if (Array.isArray(definition.endpoints)) {
        definition.endpoints.forEach((endpoint: any) => {
          if (endpoint.path && endpoint.method) {
            endpoints.push({
              id: `${endpoint.method}-${endpoint.path}`.replace(/[^a-zA-Z0-9]/g, '-'),
              path: endpoint.path,
              method: endpoint.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
              description: endpoint.description || '',
              parameters: Array.isArray(endpoint.parameters) ? endpoint.parameters : [],
              responses: Array.isArray(endpoint.responses) ? endpoint.responses : []
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error extracting endpoints:', error);
  }

  console.log(`Extracted ${endpoints.length} endpoints`);
  return endpoints;
};

// Main validation function
export const validateApiDefinition = async (
  content: string | Buffer | object,
  filename?: string
): Promise<ValidationResult> => {
  console.log(`Validating API definition, content type: ${typeof content}, filename: ${filename}`);
  
  // If content is already an object (pre-parsed), use it directly
  if (content !== null && typeof content === 'object' && !BufferImpl.isBuffer(content)) {
    const format = determineFormatFromObject(content);
    return {
      isValid: true,
      format,
      parsedDefinition: content
    };
  }

  let contentType: 'json' | 'yaml' | 'raml' | 'markdown' | 'unknown';
  let parsedContent: any;
  let format: ApiFormat = 'OpenAPI3';
  let errors: string[] = [];

  // Convert Buffer to string if needed
  if (BufferImpl.isBuffer(content)) {
    content = content.toString();
  } else if (typeof content !== 'string') {
    try {
      content = String(content);
    } catch (e) {
      errors.push('Content could not be converted to string');
      return { isValid: false, format, errors };
    }
  }

  // Detect content type using the filename if available
  contentType = detectContentType(content, filename);
  console.log(`Detected content type: ${contentType}`);

  try {
    parsedContent = parseContent(content, contentType);

    if (!parsedContent) {
      errors.push('Failed to parse API definition');
    } else {
      format = determineApiFormat(parsedContent);
      console.log(`Determined API format: ${format}`);

      // Validate based on format
      switch (format) {
        case 'OpenAPI2':
          errors = validateOpenAPI2(parsedContent);
          break;
        case 'OpenAPI3':
          errors = validateOpenAPI3(parsedContent);
          break;
        case 'RAML':
          errors = validateRAML(parsedContent);
          break;
        case 'APIBlueprint':
          errors = validateAPIBlueprint(parsedContent);
          break;
      }
    }
  } catch (error) {
    console.error('Validation error:', error);
    errors.push((error as Error).message);
  }

  const result = {
    isValid: errors.length === 0,
    format,
    errors: errors.length > 0 ? errors : undefined,
    parsedDefinition: parsedContent
  };
  
  console.log(`Validation result: ${result.isValid ? 'Valid' : 'Invalid'}, format: ${result.format}`);
  return result;
};

// Extract endpoints from URL (this is different from extractEndpoints above)
export const extractEndpointsFromUrl = (apiDefinition: any, format: ApiFormat) => {
  let endpoints: Array<{
    path: string;
    method: string;
    description?: string;
    parameters: Array<any>;
    responses: Array<any>;
  }> = [];

  if (format === 'OpenAPI2' || format === 'OpenAPI3') {
    const paths = apiDefinition.paths || {};

    Object.keys(paths).forEach(path => {
      const pathObj = paths[path];

      // Common HTTP methods
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

      methods.forEach(method => {
        if (pathObj[method]) {
          const operation = pathObj[method];

          // Extract parameters
          const parameters = [...(pathObj.parameters || []), ...(operation.parameters || [])].map(param => ({
            name: param.name,
            type: param.schema?.type || param.type || 'string',
            required: !!param.required,
            description: param.description || ''
          }));

          // Extract responses
          const responses = Object.keys(operation.responses || {}).map(statusCode => ({
            statusCode: parseInt(statusCode, 10),
            description: operation.responses[statusCode].description || '',
            schema: operation.responses[statusCode].schema || operation.responses[statusCode].content
          }));

          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: operation.summary || operation.description || '',
            parameters,
            responses
          });
        }
      });
    });
  } else if (format === 'RAML') {
    // In a real app, add RAML endpoint extraction logic
    // This is a simplified placeholder
    endpoints = [
      {
        path: '/api/example',
        method: 'GET',
        description: 'Example RAML endpoint',
        parameters: [],
        responses: [{ statusCode: 200, description: 'Success' }]
      }
    ];
  } else if (format === 'APIBlueprint') {
    // In a real app, add API Blueprint endpoint extraction logic
    // This is a simplified placeholder
    endpoints = [
      {
        path: '/api/example',
        method: 'GET',
        description: 'Example API Blueprint endpoint',
        parameters: [],
        responses: [{ statusCode: 200, description: 'Success' }]
      }
    ];
  }

  return endpoints;
};

// Helper function to determine API format from an object
function determineFormatFromObject(obj: any): ApiFormat {
  if (!obj) return 'OpenAPI3';

  if (obj.swagger === '2.0') {
    return 'OpenAPI2';
  } else if (obj.openapi && obj.openapi.startsWith('3.')) {
    return 'OpenAPI3';
  } else if (obj.raml) {
    return 'RAML';
  } else if (obj.format && obj.format.toLowerCase().includes('blueprint')) {
    return 'APIBlueprint';
  }

  return 'OpenAPI3';
}

interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
  responses: Array<{ statusCode: number | string; description: string; schema?: any }>;
}