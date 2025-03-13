
import type { Endpoint } from '../types';

// Extracts endpoints from the parsed OpenAPI definition
export function extractEndpoints(parsedDefinition: any, format: string): Endpoint[] {
  if (!parsedDefinition) return [];
  
  switch (format) {
    case 'OpenAPI2':
      return extractOpenAPI2Endpoints(parsedDefinition);
    case 'OpenAPI3':
      return extractOpenAPI3Endpoints(parsedDefinition);
    case 'RAML':
      return extractRamlEndpoints(parsedDefinition);
    case 'APIBlueprint':
      return extractApiBlueprintEndpoints(parsedDefinition);
    default:
      return [];
  }
}

function extractOpenAPI2Endpoints(parsedDefinition: any): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const basePath = parsedDefinition.basePath || '';
  
  if (!parsedDefinition.paths) return endpoints;
  
  Object.entries(parsedDefinition.paths).forEach(([path, pathObj]: [string, any]) => {
    Object.entries(pathObj || {}).forEach(([method, operationObj]: [string, any]) => {
      if (method === 'parameters') return; // Skip path-level parameters
      
      const endpoint: Endpoint = {
        id: `${method}-${path}`,
        path: `${basePath}${path}`,
        method: method.toUpperCase(),
        summary: operationObj.summary || '',
        description: operationObj.description || '',
        parameters: [],
        responses: [],
        security: operationObj.security || [],
        tags: operationObj.tags || [],
        operationId: operationObj.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
        requestBody: null,
        type: 'endpoint',
      };
      
      // Extract parameters
      const parameters = [...(operationObj.parameters || []), ...(pathObj.parameters || [])];
      endpoint.parameters = parameters.map((param: any) => ({
        name: param.name,
        in: param.in,
        required: !!param.required,
        type: param.type || (param.schema ? param.schema.type : 'string'),
        description: param.description || '',
      }));
      
      // Extract responses
      if (operationObj.responses) {
        endpoint.responses = Object.entries(operationObj.responses).map(([code, response]: [string, any]) => ({
          code,
          description: response.description || '',
          schema: response.schema || null,
        }));
      }
      
      endpoints.push(endpoint);
    });
  });
  
  return endpoints;
}

function extractOpenAPI3Endpoints(parsedDefinition: any): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const servers = parsedDefinition.servers || [];
  const basePath = servers.length > 0 ? new URL(servers[0].url).pathname : '';
  
  if (!parsedDefinition.paths) return endpoints;
  
  Object.entries(parsedDefinition.paths).forEach(([path, pathObj]: [string, any]) => {
    Object.entries(pathObj || {}).forEach(([method, operationObj]: [string, any]) => {
      if (['parameters', 'summary', 'description', 'servers', '$ref'].includes(method)) return; // Skip non-operation fields
      
      const endpoint: Endpoint = {
        id: `${method}-${path}`,
        path: `${basePath}${path}`,
        method: method.toUpperCase(),
        summary: operationObj.summary || '',
        description: operationObj.description || '',
        parameters: [],
        responses: [],
        security: operationObj.security || [],
        tags: operationObj.tags || [],
        operationId: operationObj.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
        requestBody: operationObj.requestBody ? {
          description: operationObj.requestBody.description || '',
          required: !!operationObj.requestBody.required,
          content: operationObj.requestBody.content || {},
        } : null,
        type: 'endpoint',
      };
      
      // Extract parameters
      const parameters = [...(operationObj.parameters || []), ...(pathObj.parameters || [])];
      endpoint.parameters = parameters.map((param: any) => ({
        name: param.name,
        in: param.in,
        required: !!param.required,
        type: param.schema ? param.schema.type : 'string',
        description: param.description || '',
      }));
      
      // Extract responses
      if (operationObj.responses) {
        endpoint.responses = Object.entries(operationObj.responses).map(([code, response]: [string, any]) => ({
          code,
          description: (response as any).description || '',
          content: (response as any).content || {},
        }));
      }
      
      endpoints.push(endpoint);
    });
  });
  
  return endpoints;
}

function extractRamlEndpoints(parsedDefinition: any): Endpoint[] {
  // Basic RAML parsing - would need to be expanded for full RAML support
  const endpoints: Endpoint[] = [];
  // Implementation depends on the structure of the RAML parser output
  return endpoints;
}

function extractApiBlueprintEndpoints(parsedDefinition: any): Endpoint[] {
  // Basic API Blueprint parsing - would need to be expanded for full API Blueprint support
  const endpoints: Endpoint[] = [];
  // Implementation depends on the structure of the API Blueprint parser output
  return endpoints;
}
