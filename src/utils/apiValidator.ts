import yaml from 'js-yaml';
import { supabase } from '../lib/supabase';
import type { ApiDefinition, EndpointDefinition, Endpoint } from '../types';

// Polyfill for Buffer in browser environments
const BufferPolyfill = {
  isBuffer: (obj: any): boolean => obj instanceof Uint8Array || obj instanceof ArrayBuffer || (obj && typeof obj.byteLength === 'number'),
  from: (data: string | Uint8Array): { toString: () => string } => ({
    toString: () => typeof data === 'string' ? data : new TextDecoder().decode(data)
  })
};
const BufferImpl = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

export type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

interface ValidationResult {
  isValid: boolean;
  format: ApiFormat;
  errors?: string[];
  parsedDefinition: any;
}

// API Definition Management
export async function saveApiDefinition(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[]
): Promise<ApiDefinition> {
  const definition = { ...apiDefinition, endpoint_definition: endpointDefinitions };
  const { data, error } = apiDefinition.id
    ? await supabase.from('api_definitions').update(definition).eq('id', apiDefinition.id).select().single()
    : await supabase.from('api_definitions').insert(definition).select().single();

  if (error) throw new Error(`Failed to save API definition: ${error.message}`);
  return data as ApiDefinition;
}

export async function getApiDefinition(id: string): Promise<ApiDefinition> {
  const { data, error } = await supabase.from('api_definitions').select('*').eq('id', id).single();
  if (error) throw new Error(`Failed to get API definition: ${error.message}`);
  return data as ApiDefinition;
}

export async function getApiDefinitions(): Promise<ApiDefinition[]> {
  const { data, error } = await supabase.from('api_definitions').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to get API definitions: ${error.message}`);
  return data as ApiDefinition[];
}

export async function deleteApiDefinition(id: string): Promise<boolean> {
  const { error } = await supabase.from('api_definitions').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete API definition: ${error.message}`);
  return true;
}

// Content Type Detection and Parsing
function detectContentType(content: string | Uint8Array | object, filename?: string): 'json' | 'yaml' | 'raml' | 'apiblueprint' | 'unknown' {
  if (BufferImpl.isBuffer(content)) content = BufferImpl.from(content).toString();
  if (typeof content === 'object' && content !== null) return 'json';

  const strContent = String(content).trim();
  if (strContent.startsWith('#%RAML')) return 'raml';
  if (strContent.startsWith('# ') || strContent.startsWith('FORMAT:')) return 'apiblueprint';
  if (filename?.endsWith('.raml')) return 'raml';
  if (filename?.endsWith('.md') || filename?.endsWith('.apib')) return 'apiblueprint';

  try {
    JSON.parse(strContent);
    return 'json';
  } catch {
    try {
      yaml.load(strContent);
      return 'yaml';
    } catch {
      return 'unknown';
    }
  }
}

function parseContent(content: string | Uint8Array | object, contentType: ReturnType<typeof detectContentType>): any {
  if (BufferImpl.isBuffer(content)) content = BufferImpl.from(content).toString();
  if (typeof content === 'object' && content !== null) return content;

  const strContent = String(content).trim();
  try {
    switch (contentType) {
      case 'json': return JSON.parse(strContent);
      case 'yaml': return yaml.load(strContent);
      case 'raml': 
        const ramlLines = strContent.split('\n');
        return {
          version: ramlLines.find(l => l.startsWith('#%RAML'))?.split(' ')[1] || '',
          title: ramlLines.find(l => l.startsWith('title:'))?.split(':')[1]?.trim() || '',
          isRaml: true
        };
      case 'apiblueprint':
        return { isApiBlueprint: true, content: strContent };
      case 'unknown':
        try { return JSON.parse(strContent); } 
        catch { return yaml.load(strContent); }
    }
  } catch (error) {
    throw new Error(`Failed to parse content: ${(error as Error).message}`);
  }
}

// Format Detection and Validation
function determineApiFormat(parsedContent: any): ApiFormat {
  if (parsedContent.swagger === '2.0') return 'OpenAPI2';
  if (parsedContent.openapi?.startsWith('3.')) return 'OpenAPI3';
  if (parsedContent.isRaml) return 'RAML';
  if (parsedContent.isApiBlueprint) return 'APIBlueprint';
  return 'OpenAPI3'; // Default
}

function validateApiDefinitionContent(parsedContent: any, format: ApiFormat): string[] {
  const errors: string[] = [];

  switch (format) {
    case 'OpenAPI2':
      if (parsedContent.swagger !== '2.0') errors.push('Invalid Swagger version');
      if (!parsedContent.info?.title) errors.push('Missing API title');
      if (!parsedContent.info?.version) errors.push('Missing API version');
      if (!Object.keys(parsedContent.paths || {}).length) errors.push('No paths defined');
      break;
    case 'OpenAPI3':
      if (!parsedContent.openapi?.startsWith('3.')) errors.push('Invalid OpenAPI version');
      if (!parsedContent.info?.title) errors.push('Missing API title');
      if (!parsedContent.info?.version) errors.push('Missing API version');
      if (!Object.keys(parsedContent.paths || {}).length) errors.push('No paths defined');
      break;
    case 'RAML':
      if (!parsedContent.version) errors.push('Missing RAML version');
      if (!parsedContent.title) errors.push('Missing API title');
      break;
    case 'APIBlueprint':
      if (!parsedContent.content?.trim()) errors.push('Empty API Blueprint document');
      if (!parsedContent.content.includes('# ') && !parsedContent.content.includes('FORMAT:')) 
        errors.push('Missing API Blueprint header');
      break;
  }
  return errors;
}

// Main validation function
export const validateApiDefinition = async (
  content: string | Buffer | object,
  filename?: string
): Promise<ValidationResult> => {
  try {
    const contentType = detectContentType(content, filename);
    const parsedContent = parseContent(content, contentType);
    const format = determineApiFormat(parsedContent);
    const errors = validateApiDefinitionContent(parsedContent, format);

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
      errors: [(error as Error).message],
      parsedDefinition: null
    };
  }
};

// Endpoint Extraction
export const extractEndpoints = (apiDefinition: any, format: ApiFormat): Endpoint[] => {
  try {
    const endpoints: Endpoint[] = [];
    console.log('Extracting endpoints from format:', format);

    // Get the actual definition object
    let definition = apiDefinition;
    if (apiDefinition.parsedDefinition) {
      definition = apiDefinition.parsedDefinition;
    } else if (apiDefinition.content && typeof apiDefinition.content === 'string') {
      try {
        // Try parsing content if it's a string
        const contentType = detectContentType(apiDefinition.content);
        definition = parseContent(apiDefinition.content, contentType);
      } catch (e) {
        console.error('Error parsing content:', e);
      }
    }

    if (!definition) {
      console.error('No valid definition found');
      return [];
    }

    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

    switch (format) {
      case 'OpenAPI2':
      case 'OpenAPI3':
        for (const [path, pathObj] of Object.entries(definition.paths || {})) {
          for (const method of methods) {
            const operation = pathObj?.[method];
            if (!operation) continue;

            const parameters = [
              ...(pathObj.parameters || []),
              ...(operation.parameters || [])
            ].map(param => ({
              name: param.name,
              type: param.schema?.type || param.type || 'string',
              required: !!param.required,
              description: param.description || ''
            }));

            const responses = Object.entries(operation.responses || {}).map(([status, resp]: [string, any]) => ({
              statusCode: parseInt(status) || status,
              description: resp.description || '',
              schema: resp.schema || (resp.content ? resp.content : null)
            }));

            endpoints.push({
              id: `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
              path,
              method: method.toUpperCase() as Endpoint['method'],
              description: operation.summary || operation.description || '',
              parameters,
              responses,
              mcpType: method === 'get' ? 'resource' : 'tool'
            });
          }
        }
        break;

      case 'RAML':
        // Simplified RAML parsing
        if (definition.resources) {
          definition.resources.forEach(resource => {
            const basePath = resource.relativeUri || '';
            (resource.methods || []).forEach(method => {
              endpoints.push({
                id: `${method.method}-${basePath}`.replace(/[^a-zA-Z0-9]/g, '-'),
                path: basePath,
                method: method.method.toUpperCase() as Endpoint['method'],
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
                })),
                mcpType: method.method.toLowerCase() === 'get' ? 'resource' : 'tool'
              });
            });
          });
        } else {
          // Fallback using raw content parsing
          const ramlLines = definition.content?.split('\n') || [];
          let currentPath = '';
          ramlLines.forEach(line => {
            if (line.match(/^\/[^:]+:/)) {
              currentPath = line.split(':')[0].trim();
            }
            const methodMatch = line.match(/^\s+(get|post|put|delete|patch|options|head):/);
            if (methodMatch && currentPath) {
              const method = methodMatch[1];
              endpoints.push({
                id: `${method}-${currentPath}`.replace(/[^a-zA-Z0-9]/g, '-'),
                path: currentPath,
                method: method.toUpperCase() as Endpoint['method'],
                description: '',
                parameters: [],
                responses: [{ statusCode: 200, description: 'Success' }],
                mcpType: method === 'get' ? 'resource' : 'tool'
              });
            }
          });
        }
        break;

      case 'APIBlueprint':
        if (definition.ast && definition.ast.resourceGroups) {
          definition.ast.resourceGroups.forEach(group => {
            (group.resources || []).forEach(resource => {
              (resource.actions || []).forEach(action => {
                endpoints.push({
                  id: `${action.method}-${resource.uriTemplate}`.replace(/[^a-zA-Z0-9]/g, '-'),
                  path: resource.uriTemplate || '',
                  method: action.method.toUpperCase() as Endpoint['method'],
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
                  ),
                  mcpType: action.method.toLowerCase() === 'get' ? 'resource' : 'tool'
                });
              });
            });
          });
        } else {
          // Fallback using raw content parsing
          const apibLines = definition.content?.split('\n') || [];
          let currentGroup = '';
          apibLines.forEach(line => {
            if (line.startsWith('# Group')) currentGroup = line.split('Group')[1].trim();
            const endpointMatch = line.match(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+(.+)$/);
            if (endpointMatch) {
              const [, method, path] = endpointMatch;
              endpoints.push({
                id: `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
                path: path.trim(),
                method: method as Endpoint['method'],
                description: currentGroup,
                parameters: [],
                responses: [{ statusCode: 200, description: 'Success' }],
                mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool'
              });
            }
          });
        }
        break;
    }

    // Fallback for simple/custom API definitions
    if (endpoints.length === 0 && typeof definition === 'object') {
      if (Array.isArray(definition.endpoints)) {
        definition.endpoints.forEach((endpoint: any) => {
          if (endpoint.path && endpoint.method) {
            endpoints.push({
              id: `${endpoint.method}-${endpoint.path}`.replace(/[^a-zA-Z0-9]/g, '-'),
              path: endpoint.path,
              method: endpoint.method.toUpperCase() as Endpoint['method'],
              description: endpoint.description || '',
              parameters: Array.isArray(endpoint.parameters) ? endpoint.parameters : [],
              responses: Array.isArray(endpoint.responses) ? endpoint.responses : [],
              mcpType: endpoint.method.toLowerCase() === 'get' ? 'resource' : 'tool'
            });
          }
        });
      }
    }

    console.log(`Extracted ${endpoints.length} endpoints`);
    return endpoints.map(endpoint => ({
      ...endpoint,
      id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2)}`,
      mcpType: endpoint.mcpType || (endpoint.method.toLowerCase() === 'get' ? 'resource' : 'tool')
    }));
  } catch (error) {
    console.error('Error extracting endpoints:', error);
    return [];
  }
};

// Main parsing function for API definitions
export const parseApiDefinition = async (apiDefinition: any): Promise<Endpoint[]> => {
  if (!apiDefinition?.content) return [];

  try {
    // Detect content type and parse
    const contentType = detectContentType(apiDefinition.content);
    const parsedContent = parseContent(apiDefinition.content, contentType);
    const format = determineApiFormat(parsedContent);

    // Extract endpoints using the parsed content
    return extractEndpoints({
      parsedDefinition: parsedContent
    }, format);
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return [];
  }
};

// Extract Swagger URL from HTML content
export const extractSwaggerUrl = (htmlContent: string, baseUrl: string): string | null => {
  const patterns = [
    /url:\s*['"](.*?)['"]/,
    /spec:\s*{"url":\s*['"](.*?)['"]}/,
    /"swagger-ui".*?["'].*?["'](.*\.json|.*\.yaml|.*\.yml)["']/i,
    /href=["'](.*\.json|.*\.yaml|.*\.yml)["']/i
  ];

  for (const pattern of patterns) {
    const matches = htmlContent.match(pattern);
    if (matches && matches[1]) {
      try {
        return new URL(matches[1], baseUrl).href;
      } catch (e) {
        console.error('Error resolving URL:', e);
      }
    }
  }
  return null;
};

interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
  responses: Array<{ statusCode: number | string; description: string; schema?: any }>;
  mcpType?: 'resource' | 'tool' | 'none';
}
type Parameter = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type Response = {
  statusCode: number;
  description: string;
};