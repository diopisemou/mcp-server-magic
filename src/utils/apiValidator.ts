
import yaml from 'js-yaml';
import type { ApiDefinition, EndpointDefinition, Endpoint } from '../types';
import { ApiFormat } from '@/types/api';

// Buffer polyfill for browser environments
const BufferPolyfill = {
  isBuffer: (obj: any): boolean => obj instanceof Uint8Array || obj instanceof ArrayBuffer || (obj && typeof obj.byteLength === 'number'),
  from: (data: string | Uint8Array | object): { toString: () => string } => ({
    toString: () => typeof data === 'string' ? data : new TextDecoder().decode(data)
  })
};
const BufferImpl = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

// Content Type Detection
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

// Content Parsing
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

// API Format Detection
function determineApiFormat(parsedContent: any): ApiFormat {
  if (parsedContent.swagger === '2.0') return 'OpenAPI2';
  if (parsedContent.openapi?.startsWith('3.')) return 'OpenAPI3';
  if (parsedContent.isRaml) return 'RAML';
  if (parsedContent.isApiBlueprint) return 'APIBlueprint';
  return 'OpenAPI3'; // Default
}

// API Definition Validation
export function validateApiDefinitionContent(parsedContent: any, format: ApiFormat): string[] {
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
    const contentType = detectContentType(content, filename);
    const parsedContent = parseContent(content, contentType);
    const format = determineApiFormat(parsedContent);
    const validationErrors = validateApiDefinitionContent(parsedContent, format);

    if (validationErrors.length && validationErrors!.length > 0) {
      throw new Error(`Invalid API definition: ${validationErrors.join(', ')}`);
    }

    let endpoints: Endpoint[] = [];

    switch (format) {
      case 'OpenAPI2':
      case 'OpenAPI3':
        endpoints = extractOpenApiEndpoints(parsedContent);
        break;

      case 'RAML':
        endpoints = extractRamlEndpoints(parsedContent, content);
        break;

      case 'APIBlueprint':
        endpoints = extractApiBlueprintEndpoints(parsedContent, content);
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
