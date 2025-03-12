import yaml from 'js-yaml';

type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

// Validate API definition from different formats
export const validateApiDefinition = async (content: string, fileName: string) => {
  console.log("Validating API definition:", { fileName, contentPreview: content.substring(0, 100) });

  try {
    const contentType = getContentType(fileName);
    console.log("Detected content type:", contentType);

    // Parse the content based on its type
    const parsedDefinition = parseContent(content, contentType);
    console.log("Content parsed successfully");

    if (!parsedDefinition) {
      return { isValid: false, errors: ['Failed to parse definition'] };
    }

    // Detect API format
    const format = detectApiFormat(parsedDefinition);
    console.log("Detected API format:", format);

    if (!format) {
      return { isValid: false, errors: ['Unsupported API definition format'] };
    }

    // Extract API basic info
    const info = extractApiInfo(parsedDefinition, format);
    console.log("Extracted API info:", info);

    return {
      isValid: true,
      format,
      info,
      parsedDefinition
    };
  } catch (error: any) {
    console.error("API validation error:", error);
    return {
      isValid: false,
      errors: [error.message || 'Invalid API definition']
    };
  }
};

// Determine content type from file extension
const getContentType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    return 'json';
  } else if (['yaml', 'yml'].includes(extension || '')) {
    return 'yaml';
  } else if (extension === 'raml') {
    return 'raml';
  } else if (extension === 'apib') {
    return 'apib';
  }

  // Try to guess from content if no file extension
  return 'yaml'; // Default to yaml for OpenAPI
};

// Parse content based on its type
const parseContent = (content: string, contentType: string): any => {
  try {
    // First, detect if it's JSON by checking if it starts with curly brace
    if (content.trim().startsWith('{')) {
      return JSON.parse(content);
    } 
    // If it starts with 'openapi:' or 'swagger:', it's likely YAML
    else if (content.trim().startsWith('openapi:') || content.trim().startsWith('swagger:')) {
      return yaml.load(content);
    }
    // Otherwise, use the detected content type
    else if (contentType === 'json') {
      return JSON.parse(content);
    } else if (contentType === 'yaml') {
      return yaml.load(content);
    } else if (contentType === 'raml') {
      // Basic RAML parsing - in a real app, use raml-parser
      // For now, extract basic info from RAML header
      const lines = content.split('\n');
      const ramlObj: any = { title: '', version: '', baseUri: '' };

      lines.forEach(line => {
        if (line.startsWith('title:')) ramlObj.title = line.replace('title:', '').trim();
        if (line.startsWith('version:')) ramlObj.version = line.replace('version:', '').trim();
        if (line.startsWith('baseUri:')) ramlObj.baseUri = line.replace('baseUri:', '').trim();
      });

      return ramlObj;
    } else if (contentType === 'apib') {
      // Basic API Blueprint parsing - in a real app, use a full parser
      const lines = content.split('\n');
      const apibObj: any = { title: '', description: '' };

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

    return {
      content,
      contentType: contentType.includes('json') ? 'json' : 'yaml'
    };
  } catch (error) {
    console.error('Error fetching API definition:', error);
    throw new Error('Failed to fetch API definition');
  }
};

// Test an API endpoint (mocked for demo)
export const testApiEndpoint = async (url: string, method: string, headers: any, body: any) => {
  console.log('Testing endpoint:', { url, method, headers, body });
  // In a real app, make an actual request to the endpoint
  return {
    status: 200,
    data: { message: 'Endpoint test successful' }
  };
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
  console.log("Extracting endpoints from parsed definition:", { format, definitionKeys: Object.keys(parsedDefinition) });

  try {
    if (format === 'OpenAPI2' || format === 'OpenAPI3') {
      const paths = parsedDefinition.paths || {};
      console.log("Processing paths:", Object.keys(paths));

      Object.entries(paths).forEach(([path, pathObj]: [string, any]) => {
        console.log(`Processing path: ${path}, methods:`, Object.keys(pathObj || {}));

        Object.entries(pathObj || {}).forEach(([method, operation]: [string, any]) => {
          // Skip non-HTTP method properties like 'parameters'
          if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
            return;
          }

          if (operation) {
            console.log(`Processing endpoint: ${method.toUpperCase()} ${path}`);

            // Extract parameters
            const parameters: ApiEndpoint['parameters'] = [];

            // Add path parameters from the path object level
            if (pathObj.parameters) {
              pathObj.parameters.forEach((param: any) => {
                parameters.push({
                  name: param.name,
                  in: param.in,
                  required: !!param.required,
                  type: param.schema?.type || param.type || 'string',
                  description: param.description || ''
                });
              });
            }

            // Add operation specific parameters
            if (operation.parameters) {
              operation.parameters.forEach((param: any) => {
                parameters.push({
                  name: param.name,
                  in: param.in,
                  required: !!param.required,
                  type: param.schema?.type || param.type || 'string',
                  description: param.description || ''
                });
              });
            }

            // OpenAPI 3 - Add request body as parameters
            if (format === 'OpenAPI3' && operation.requestBody) {
              const contentType = Object.keys(operation.requestBody.content || {})[0] || 'application/json';
              const schema = operation.requestBody.content?.[contentType]?.schema;

              if (schema) {
                if (schema.properties) {
                  Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
                    parameters.push({
                      name: propName,
                      in: 'body',
                      required: schema.required?.includes(propName) || false,
                      type: propSchema.type || 'object',
                      description: propSchema.description || ''
                    });
                  });
                } else {
                  // Handle non-object schemas
                  parameters.push({
                    name: 'body',
                    in: 'body',
                    required: operation.requestBody.required || false,
                    type: schema.type || 'object',
                    description: operation.requestBody.description || ''
                  });
                }
              }
            }

            // Extract responses
            const responses: { code: string; description: string }[] = [];
            if (operation.responses) {
              Object.entries(operation.responses).forEach(([code, response]: [string, any]) => {
                responses.push({
                  code,
                  description: response.description || `Response ${code}`
                });
              });
            }

            endpoints.push({
              id: `${path}-${method}`,
              path,
              method: method.toUpperCase(),
              description: operation.summary || operation.description || '',
              parameters,
              responses,
              tags: operation.tags || [],
              operationId: operation.operationId
            });
          }
        });
      });
    } else if (format === 'RAML') {
      console.log("RAML endpoint extraction not fully implemented");
      // Simplified RAML handling - would need more complete implementation
    } else if (format === 'APIBlueprint') {
      console.log("API Blueprint endpoint extraction not fully implemented");
      // Basic API Blueprint parsing - in a real app, use a full parser
    }

    console.log(`Extracted ${endpoints.length} endpoints:`, endpoints);
  } catch (error) {
    console.error('Error extracting endpoints:', error);
  }

  return endpoints;
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