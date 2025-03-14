import { ApiDefinitionRecord, Endpoint } from '@/types';
import { validateApiDefinition, extractEndpoints } from './apiValidator';

// Function to parse API definition and extract endpoints
export const parseApiDefinition = (apiDefinition: ApiDefinitionRecord): Endpoint[] => {
  try {
    // Try to extract endpoints from endpoint_definition first if it exists
    if (apiDefinition.endpoint_definition) {
      // Check if endpoint_definition is an array
      if (Array.isArray(apiDefinition.endpoint_definition)) {
        return apiDefinition.endpoint_definition.map(ep => ({
          ...ep,
          // Ensure all required properties exist
          responses: ep.responses?.map(r => ({
            ...r,
            schema: r.schema || null
          })) || []
        }));
      }
    }
    
    // Otherwise, try to parse from content
    let parsedContent;
    try {
      // Parse the content as JSON if it's a string
      parsedContent = typeof apiDefinition.content === 'string' 
        ? JSON.parse(apiDefinition.content)
        : apiDefinition.content;
      
      // Check if content contains a parsedDefinition
      if (parsedContent.parsedDefinition) {
        const format = parsedContent.format || 'OpenAPI3';
        return extractEndpoints(parsedContent.parsedDefinition, format);
      }
      
      // If there's no parsedDefinition, try to validate the content
      const contentToValidate = parsedContent.content || apiDefinition.content;
      const validationResult = validateApiDefinition(contentToValidate, apiDefinition.name);
      
      if (validationResult && validationResult.endpoints) {
        // Add default mcpType based on HTTP method
        return validationResult.endpoints.map(endpoint => ({
          ...endpoint,
          // Set default mcpType based on method
          mcpType: endpoint.mcpType || (endpoint.method === 'GET' ? 'resource' : 'tool'),
          // Ensure responses have schema property
          responses: endpoint.responses.map(r => ({
            ...r,
            schema: r.schema || null
          }))
        }));
      }
    } catch (error) {
      console.error('Error parsing API definition content:', error);
    }
    
    // Return empty array if we couldn't extract endpoints
    return [];
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return [];
  }
};

// Export helper functions to fix type issues across the application
export const ensureEndpointResponse = (response: any) => {
  return {
    statusCode: response.statusCode || 200,
    description: response.description || '',
    schema: response.schema || null
  };
};

export const ensureEndpoint = (endpoint: any): Endpoint => {
  return {
    id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2, 9)}`,
    path: endpoint.path || '/',
    method: endpoint.method || 'GET',
    description: endpoint.description || '',
    parameters: endpoint.parameters || [],
    responses: (endpoint.responses || []).map(ensureEndpointResponse),
    selected: endpoint.selected !== undefined ? endpoint.selected : true,
    mcpType: endpoint.mcpType || (endpoint.method === 'GET' ? 'resource' : 'tool')
  };
};
