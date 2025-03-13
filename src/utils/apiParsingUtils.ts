
import type { ApiDefinitionRecord, Endpoint } from "../types";
import { validateApiDefinition } from "./apiValidator";
import { extractEndpoints } from "./endpointExtractor";

/**
 * Parses the API definition and extracts endpoints
 */
export function parseApiDefinition(content: string, filename?: string): { 
  validationResult: any; 
  endpoints: Endpoint[];
} {
  try {
    // Validate and parse the API definition
    const validationResult = validateApiDefinition(content, filename);
    
    // Extract endpoints if the definition is valid
    const endpoints = validationResult.isValid 
      ? extractEndpoints(validationResult.parsedDefinition, validationResult.format)
      : [];
    
    return { validationResult, endpoints };
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return { 
      validationResult: { 
        isValid: false, 
        format: 'Unknown', 
        errors: [(error as Error).message], 
        parsedDefinition: null 
      }, 
      endpoints: [] 
    };
  }
}

/**
 * Maps endpoints to their classification (tool, resource, or skipped)
 */
export function mapEndpointsToDefinition(
  endpoints: Endpoint[], 
  existingDefinitions?: ApiDefinitionRecord['endpoint_definition']
): ApiDefinitionRecord['endpoint_definition'] {
  const mappedEndpoints = endpoints.map(endpoint => {
    // Check if this endpoint already exists in the definitions
    const existingEndpoint = existingDefinitions?.find(def => 
      def.path === endpoint.path && def.method === endpoint.method
    );
    
    return {
      path: endpoint.path,
      method: endpoint.method,
      summary: endpoint.summary,
      operationId: endpoint.operationId,
      type: existingEndpoint?.type || 'endpoint', // Default to 'endpoint' if no existing type
      parameters: endpoint.parameters,
      responses: endpoint.responses,
      requestBody: endpoint.requestBody,
      security: endpoint.security,
      tags: endpoint.tags,
      id: endpoint.id
    };
  });
  
  return mappedEndpoints;
}

/**
 * Updates endpoint definitions with classifications
 */
export function updateEndpointDefinitions(
  endpoints: ApiDefinitionRecord['endpoint_definition'],
  endpointId: string, 
  type: 'tool' | 'resource' | 'endpoint' | 'skipped'
): ApiDefinitionRecord['endpoint_definition'] {
  return endpoints.map(endpoint => {
    if (endpoint.id === endpointId) {
      return { ...endpoint, type };
    }
    return endpoint;
  });
}
