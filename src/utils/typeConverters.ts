
import { ApiDefinition, EndpointDefinition, Endpoint, Response, Parameter } from '@/types';
import { Json } from '@/types/json';

/**
 * Convert an API definition record from the database to the app format
 */
export const convertApiDefinitionRecord = (record: any): ApiDefinition => {
  return {
    id: record.id,
    name: record.name,
    format: record.format,
    content: record.content,
    created_at: record.created_at,
    updated_at: record.updated_at,
    project_id: record.project_id,
    endpoint_definition: convertEndpointDefinitionFromJson(record.endpoint_definition)
  };
};

/**
 * Convert endpoints from API definition to endpoint definitions
 */
export const convertEndpointsToDefinitions = (
  endpoints: Endpoint[]
): EndpointDefinition[] => {
  return endpoints.map((endpoint) => ({
    id: endpoint.id,
    path: endpoint.path,
    method: endpoint.method,
    description: endpoint.description,
    parameters: endpoint.parameters.map((param) => ({
      name: param.name,
      type: param.type,
      required: param.required,
      description: param.description
    })),
    responses: endpoint.responses.map((resp) => ({
      statusCode: resp.statusCode,
      description: resp.description,
      schema: resp.schema || {}
    })),
    selected: endpoint.selected,
    mcpType: endpoint.mcpType
  }));
};

/**
 * Convert JSON endpoint definitions to typed endpoint definitions
 */
export const convertJsonToEndpointDefinitions = (json: Json | null): EndpointDefinition[] => {
  if (!json) return [];
  
  // Handle array of endpoints
  if (Array.isArray(json)) {
    return json.map((endpoint: any) => ({
      id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2, 9)}`,
      path: endpoint.path || '/',
      method: endpoint.method || 'GET',
      description: endpoint.description || '',
      parameters: Array.isArray(endpoint.parameters) ? endpoint.parameters.map((param: any) => ({
        name: param.name || '',
        type: param.type || 'string',
        required: !!param.required,
        description: param.description || ''
      })) : [],
      responses: Array.isArray(endpoint.responses) ? endpoint.responses.map((resp: any) => ({
        statusCode: resp.statusCode || 200,
        description: resp.description || '',
        schema: resp.schema || {}
      })) : [],
      selected: endpoint.selected !== undefined ? endpoint.selected : true,
      mcpType: endpoint.mcpType || (endpoint.method === 'GET' ? 'resource' : 'tool')
    }));
  }
  
  // Handle string, which could be a stringified JSON
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return convertJsonToEndpointDefinitions(parsed);
    } catch (e) {
      console.error('Error parsing endpoint JSON', e);
      return [];
    }
  }
  
  // Handle object (likely a single endpoint)
  if (typeof json === 'object' && json !== null) {
    try {
      // If it has an endpoints property, use that
      if ('endpoints' in json && Array.isArray(json.endpoints)) {
        return convertJsonToEndpointDefinitions(json.endpoints);
      }
      
      // If it looks like a single endpoint
      if ('path' in json && 'method' in json) {
        return [{
          id: json.id || `endpoint-${Math.random().toString(36).substring(2, 9)}`,
          path: json.path || '/',
          method: json.method || 'GET',
          description: json.description || '',
          parameters: Array.isArray(json.parameters) ? json.parameters.map((param: any) => ({
            name: param.name || '',
            type: param.type || 'string',
            required: !!param.required,
            description: param.description || ''
          })) : [],
          responses: Array.isArray(json.responses) ? json.responses.map((resp: any) => ({
            statusCode: resp.statusCode || 200,
            description: resp.description || '',
            schema: resp.schema || {}
          })) : [],
          selected: json.selected !== undefined ? json.selected : true,
          mcpType: json.mcpType || (json.method === 'GET' ? 'resource' : 'tool')
        }];
      }
    } catch (e) {
      console.error('Error converting endpoint object', e);
      return [];
    }
  }
  
  return [];
};

/**
 * Convert endpoint definition from JSON to typed format
 */
export const convertEndpointDefinitionFromJson = (json: Json | null): EndpointDefinition[] => {
  return convertJsonToEndpointDefinitions(json);
};
