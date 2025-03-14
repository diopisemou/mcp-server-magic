
import { ApiDefinition, EndpointDefinition, Endpoint } from '@/types';

// Helper to safely convert database JSON to endpoint definitions
export function convertJsonToEndpointDefinitions(jsonData: any): EndpointDefinition[] {
  if (!jsonData) return [];
  
  try {
    if (Array.isArray(jsonData)) {
      return jsonData.map(endpoint => ({
        id: endpoint.id || '',
        path: endpoint.path || '',
        method: endpoint.method || 'GET',
        description: endpoint.description || '',
        parameters: endpoint.parameters || [],
        responses: endpoint.responses?.map((r: any) => ({
          ...r,
          schema: r.schema || null
        })) || [],
        selected: endpoint.selected !== undefined ? endpoint.selected : true,
        mcpType: endpoint.mcpType || 'none'
      }));
    }
    return [];
  } catch (e) {
    console.error('Error converting JSON to endpoint definitions:', e);
    return [];
  }
}

// Helper to safely convert database record to ApiDefinition
export function convertRecordToApiDefinition(record: any): ApiDefinition {
  return {
    id: record.id || '',
    name: record.name || '',
    format: record.format || 'OpenAPI3',
    content: record.content || '',
    created_at: record.created_at || new Date().toISOString(),
    user_id: record.user_id,
    description: record.description,
    project_id: record.project_id,
    parsedDefinition: record.parsedDefinition || tryParseContent(record.content),
    endpoint_definition: convertJsonToEndpointDefinitions(record.endpoint_definition),
  };
}

// Try to parse JSON content if possible
function tryParseContent(content: string): any {
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

// Convert endpoints array to database-safe format
export function convertEndpointsToJson(endpoints: Endpoint[]): any {
  return endpoints.map(endpoint => ({
    ...endpoint,
    responses: endpoint.responses.map(response => ({
      ...response,
      schema: response.schema || null
    }))
  }));
}
