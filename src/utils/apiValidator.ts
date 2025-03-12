
import yaml from 'js-yaml';

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
      const title = lines.find(line => line.trim().startsWith('title:'))?.split('title:')[1].trim() || '';
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

// Main validation function
export const validateApiDefinition = async (content: string, filename: string): Promise<ValidationResult> => {
  try {
    const contentType = detectContentType(content);
    const parsedContent = parseContent(content, contentType);
    
    if (!parsedContent) {
      return { 
        isValid: false, 
        format: 'OpenAPI3', 
        errors: ['Failed to parse API definition'] 
      };
    }
    
    const format = determineApiFormat(parsedContent);
    let errors: string[] = [];
    
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
    
    return {
      isValid: errors.length === 0,
      format,
      errors: errors.length > 0 ? errors : undefined,
      parsedDefinition: parsedContent
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      format: 'OpenAPI3',
      errors: [(error as Error).message]
    };
  }
};

// Extract endpoints from API definition
export const extractEndpoints = (apiDefinition: any, format: ApiFormat) => {
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
