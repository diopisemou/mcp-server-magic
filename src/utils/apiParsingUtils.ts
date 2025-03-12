
import { ApiDefinitionRecord, Endpoint } from "@/types";
import { extractEndpoints } from "./apiValidator";

/**
 * Parse an API definition from its string content
 * @param apiDefinition The API definition record from the database
 * @returns An array of endpoints extracted from the API definition
 */
export const parseApiDefinition = (apiDefinition: ApiDefinitionRecord | null): Endpoint[] => {
  if (!apiDefinition) return [];
  
  try {
    // Parse the stored content
    const parsedContent = JSON.parse(apiDefinition.content);
    let extractedEndpoints: Endpoint[] = [];
    
    if (parsedContent.parsedDefinition) {
      extractedEndpoints = extractEndpoints(parsedContent.parsedDefinition, parsedContent.format)
        .map((endpoint) => ({
          ...endpoint,
          id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2)}`,
          method: endpoint.method.toUpperCase() as Endpoint['method'],
          mcpType: endpoint.method.toLowerCase() === 'get' ? 'resource' : 'tool',
          description: endpoint.description || '',
          parameters: endpoint.parameters || [],
          responses: endpoint.responses || []
        }));
    }
    
    console.log("Parsed endpoints:", extractedEndpoints);
    return extractedEndpoints;
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return [];
  }
}
