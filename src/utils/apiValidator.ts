import yaml from 'js-yaml';
import { supabase } from '../integrations/supabase/client';
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

// Content Type Detection and Parsing
export function detectContentType(content: string | Uint8Array | object, filename?: string): 'json' | 'yaml' | 'raml' | 'apiblueprint' | 'unknown' {
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

export function parseContent(content: string | Uint8Array | object, contentType: ReturnType<typeof detectContentType>): any {
  if (BufferImpl.isBuffer(content)) content = BufferImpl.from(content).toString();
  if (typeof content === 'object' && content !== null) return content;

  const strContent = String(content).trim();
  try {
    switch (contentType) {
      case 'json': return JSON.parse(strContent);
      case 'yaml': return yaml.load(strContent);
      case 'raml': 
      case 'apiblueprint':
      case 'unknown':
      default:
        return strContent;
    }
  } catch (err) {
    console.error('Error parsing content:', err);
    return strContent;
  }
}

// API Definition Validation
export function validateApiDefinition(content: string | Uint8Array | object, filename?: string): ValidationResult {
  const contentType = detectContentType(content, filename);
  const parsedContent = parseContent(content, contentType);

  // Simple validation based on content structure
  if (typeof parsedContent === 'object' && parsedContent !== null) {
    if (parsedContent.swagger === '2.0') {
      return { isValid: true, format: 'OpenAPI2', parsedDefinition: parsedContent };
    }
    if (parsedContent.openapi && parsedContent.openapi.startsWith('3.')) {
      return { isValid: true, format: 'OpenAPI3', parsedDefinition: parsedContent };
    }
    if (parsedContent.raml_version || String(content).startsWith('#%RAML')) {
      return { isValid: true, format: 'RAML', parsedDefinition: parsedContent };
    }
  }

  if (contentType === 'apiblueprint') {
    return { isValid: true, format: 'APIBlueprint', parsedDefinition: parsedContent };
  }

  return { 
    isValid: false, 
    format: 'OpenAPI3', 
    errors: ['Could not determine API format or invalid structure'],
    parsedDefinition: parsedContent
  };
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

// Extract parameters from OpenAPI/Swagger definitions
function extractParameters(pathObj: any, operation: any): any[] {
  return [
    ...(pathObj.parameters || []),
    ...(operation.parameters || [])
  ].map(param => ({
    name: param.name,
    type: param.schema?.type || param.type || 'string',
    required: !!param.required,
    description: param.description || ''
  }));
}

// Extract responses from OpenAPI/Swagger definitions
function extractResponses(operation: any): any[] {
  return Object.entries(operation.responses || {}).map(([status, resp]: [string, any]) => ({
    statusCode: parseInt(status) || status,
    description: resp.description || '',
    schema: resp.schema || resp.content || null
  }));
}

// Extract endpoints from OpenAPI/Swagger definitions
function extractOpenApiEndpoints(parsedContent: any): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

  for (const [path, pathObj] of Object.entries(parsedContent.paths || {})) {
    for (const method of methods) {
      const operation = pathObj?.[method];
      if (!operation) continue;

      const parameters = extractParameters(pathObj, operation);
      const responses = extractResponses(operation);

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

  return endpoints;
}

// Extract endpoints from RAML definitions
function extractRamlEndpoints(parsedContent: any, content: string | Uint8Array | object): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const ramlLines = (parsedContent.content || String(content)).split('\n');
  let currentPath = '';

  ramlLines.forEach(line => {
    if (line.match(/^\/[^:]+:/)) {
      currentPath = line.split(':')[0].trim();
    }
    const methodMatch = line.match(/^\s+(get|post|put|delete|patch|options|head):/);
    if (methodMatch) {
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

  return endpoints;
}

// Extract endpoints from API Blueprint definitions
function extractApiBlueprintEndpoints(parsedContent: any, content: string | Uint8Array | object): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const apibLines = (parsedContent.content || String(content)).split('\n');
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

  return endpoints;
}

// Main endpoint extraction function
export function extractEndpointsFromDefinition(
  content: string | Uint8Array | object,
  filename?: string
): Endpoint[] {
  try {
    const { isValid, format, parsedDefinition } = validateApiDefinition(content, filename);

    if (!isValid) {
      throw new Error(`Invalid API definition: Could not determine API format or invalid structure`);
    }

    let endpoints: Endpoint[] = [];

    switch (format) {
      case 'OpenAPI2':
      case 'OpenAPI3':
        endpoints = extractOpenApiEndpoints(parsedDefinition);
        break;

      case 'RAML':
        endpoints = extractRamlEndpoints(parsedDefinition, content);
        break;

      case 'APIBlueprint':
        endpoints = extractApiBlueprintEndpoints(parsedDefinition, content);
        break;
    }

    return endpoints.map(endpoint => ({
      ...endpoint,
      id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2)}`,
      description: endpoint.description || '',
      parameters: endpoint.parameters || [],
      responses: endpoint.responses || []
    }));
  } catch (error) {
    console.error('Error extracting endpoints:', error);
    throw new Error(`Failed to extract endpoints: ${(error as Error).message}`);
  }
}

// Utility Functions
export function extractSwaggerUrl(htmlContent: string, baseUrl: string): string | null {
  const patterns = [
    /url:\s*['"](.*?)['"]/,
    /spec:\s*{"url":\s*['"](.*?)['"]}/,
    /"swagger-ui".*?["'].*?["'](.*\.json|.*\.yaml|.*\.yml)["']/i,
    /href=["'](.*\.json|.*\.yaml|.*\.yml)["']/i
  ];

  for (const pattern of patterns) {
    const match = htmlContent.match(pattern);
    if (match?.[1]) {
      try {
        return new URL(match[1], baseUrl).href;
      } catch (e) {
        console.error('Error resolving URL:', e);
      }
    }
  }
  return null;
}