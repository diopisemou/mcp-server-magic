import yaml from 'js-yaml';

type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

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

const validateAPIBlueprint = (parsedContent: any): string[] => {
  const errors: string[] = [];

  if (!parsedContent.content) {
    errors.push('Missing API Blueprint content');
  }

  return errors;
};

interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  description: string;
  parameters: {
    name: string;
    in: string;
    required: boolean;
    type: string;
    description?: string;
  }[];
  responses: { code: string; description: string }[];
  tags?: string[];
  operationId?: string;
}

// Extract endpoints from different API definition formats
export const extractEndpoints = (parsedDefinition: any, format: ApiFormat): ApiEndpoint[] => {
  const endpoints: ApiEndpoint[] = [];

  try {
    if (format === 'OpenAPI2' || format === 'OpenAPI3') {
      const paths = parsedDefinition.paths || {};

      Object.entries(paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
            // Extract parameters from both the operation and any request body
            const parameters = (operation.parameters || []).map((param: any) => ({
              name: param.name,
              in: param.in,
              required: !!param.required,
              type: param.schema?.type || param.type || 'string',
              description: param.description || ''
            }));

            // Extract any request body parameters
            if (operation.requestBody && operation.requestBody.content) {
              const contentTypes = Object.keys(operation.requestBody.content);
              if (contentTypes.length > 0) {
                const firstContentType = contentTypes[0];
                const schema = operation.requestBody.content[firstContentType].schema;

                if (schema && schema.properties) {
                  Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
                    parameters.push({
                      name: propName,
                      in: 'body',
                      required: schema.required?.includes(propName) || false,
                      type: propSchema.type || 'string',
                      description: propSchema.description || ''
                    });
                  });
                }
              }
            }

            const responses = Object.entries(operation.responses || {}).map(([code, response]: [string, any]) => ({
              code,
              description: response.description || ''
            }));

            endpoints.push({
              id: `${path}-${method}`,
              path,
              method,
              description: operation.summary || operation.description || '',
              parameters,
              responses,
              tags: operation.tags || []
            });
          }
        });
      });
    } else if (format === 'RAML') {
      // Simplified RAML handling - would need more complete implementation
      // const resources = parsedDefinition.resources || [];
      // Extract endpoints from RAML resources
    } else if (format === 'APIBlueprint') {
      // Basic API Blueprint parsing - in a real app, use a full parser
      const content = parsedDefinition.content;
      const lines = content.split('\n');
    }
  } catch (error) {
    console.error('Error extracting endpoints:', error);
  }

  return endpoints;
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



/**
 * Fetches an API definition from a URL
 * @param url URL of the API definition
 * @param authHeaders Optional auth headers for the request
 * @returns The API definition JSON or null if fetch fails
 */
export const fetchApiDefinition = async (url: string, authHeaders?: Record<string, string>) => {
  try {
    const headers = new Headers();

    if (authHeaders) {
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.append(key, value);
      });
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch API definition: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      // This might be a Swagger UI page
      const html = await response.text();
      return parseSwaggerHtmlPage(html);
    }

    // Assume it's JSON
    return await response.json();
  } catch (error) {
    console.error('Error fetching API definition:', error);
    return null;
  }
};

/**
 * Attempts to extract a Swagger/OpenAPI definition from an HTML page
 * @param html HTML content of a Swagger UI page
 * @returns Extracted OpenAPI definition or null
 */
const parseSwaggerHtmlPage = (html: string) => {
  try {
    // Common patterns for Swagger UI
    const swaggerJsonUrlPattern = /url\s*:\s*['"](.*?\.json)['"]/;
    const swaggerYamlUrlPattern = /url\s*:\s*['"](.*?\.yaml)['"]/;
    const swaggerSpecPattern = /spec\s*:\s*({[\s\S]*?})/;

    // Try to find Swagger JSON URL
    const jsonUrlMatch = html.match(swaggerJsonUrlPattern);
    if (jsonUrlMatch && jsonUrlMatch[1]) {
      // Return the URL to be fetched separately
      return { swaggerUrl: jsonUrlMatch[1] };
    }

    // Try to find Swagger YAML URL
    const yamlUrlMatch = html.match(swaggerYamlUrlPattern);
    if (yamlUrlMatch && yamlUrlMatch[1]) {
      return { swaggerUrl: yamlUrlMatch[1] };
    }

    // Try to extract inline spec
    const specMatch = html.match(swaggerSpecPattern);
    if (specMatch && specMatch[1]) {
      try {
        return JSON.parse(specMatch[1]);
      } catch (e) {
        console.error('Error parsing inline Swagger spec:', e);
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing Swagger HTML:', error);
    return null;
  }
};

/**
 * Test an API endpoint with the provided parameters
 * @param url The endpoint URL
 * @param method HTTP method
 * @param params Request parameters
 * @param headers Request headers
 * @returns Response status and data
 */
export const testApiEndpoint = async (
  url: string, 
  method: string, 
  params?: Record<string, any>,
  headers?: Record<string, string>
) => {
  try {
    const options: RequestInit = {
      method,
      headers: headers ? new Headers(headers) : undefined,
    };

    // Add body for non-GET requests if params exist
    if (method !== 'GET' && params) {
      options.body = JSON.stringify(params);
      if (!options.headers) options.headers = new Headers();
      (options.headers as Headers).append('Content-Type', 'application/json');
    }

    // Add query params for GET requests
    let fetchUrl = url;
    if (method === 'GET' && params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      fetchUrl = `${url}?${queryParams.toString()}`;
    }

    const response = await fetch(fetchUrl, options);
    const responseData = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      data: responseData
    };
  } catch (error) {
    console.error('Error testing API endpoint:', error);
    return {
      status: 0,
      ok: false,
      error: (error as Error).message
    };
  }
};