
import type { Endpoint, Response } from '../types';

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
      
      const methodUpper = method.toUpperCase() as Endpoint['method'];
      
      const endpoint: Endpoint = {
        id: `${method}-${path}`,
        path: `${basePath}${path}`,
        method: methodUpper,
        description: operationObj.description || '',
        parameters: [],
        responses: [],
        mcpType: methodUpper === 'GET' ? 'resource' : 'tool',
        selected: true
      };
      
      // Extract parameters
      const parameters = [...(operationObj.parameters || []), ...(pathObj.parameters || [])];
      endpoint.parameters = parameters.map((param: any) => ({
        name: param.name,
        type: param.type || (param.schema ? param.schema.type : 'string'),
        required: !!param.required,
        description: param.description || ''
      }));
      
      // Extract responses
      if (operationObj.responses) {
        endpoint.responses = Object.entries(operationObj.responses).map(([code, response]: [string, any]) => ({
          statusCode: parseInt(code) || code,
          description: response.description || '',
          schema: response.schema || null
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
      
      const methodUpper = method.toUpperCase() as Endpoint['method'];
      
      const endpoint: Endpoint = {
        id: `${method}-${path}`,
        path: `${basePath}${path}`,
        method: methodUpper,
        description: operationObj.description || '',
        parameters: [],
        responses: [],
        mcpType: methodUpper === 'GET' ? 'resource' : 'tool',
        selected: true
      };
      
      // Extract parameters
      const parameters = [...(operationObj.parameters || []), ...(pathObj.parameters || [])];
      endpoint.parameters = parameters.map((param: any) => ({
        name: param.name,
        type: param.schema ? param.schema.type : 'string',
        required: !!param.required,
        description: param.description || ''
      }));
      
      // Extract responses
      if (operationObj.responses) {
        endpoint.responses = Object.entries(operationObj.responses).map(([code, response]: [string, any]) => ({
          statusCode: parseInt(code) || code,
          description: (response as any).description || '',
          schema: (response as any).content || null
        }));
      }
      
      endpoints.push(endpoint);
    });
  });
  
  return endpoints;
}

function extractRamlEndpoints(parsedDefinition: any): Endpoint[] {
  // Basic RAML parsing implementation
  const endpoints: Endpoint[] = [];
  return endpoints;
}

function extractApiBlueprintEndpoints(parsedDefinition: any): Endpoint[] {
  // Basic API Blueprint parsing implementation
  const endpoints: Endpoint[] = [];
  return endpoints;
}
