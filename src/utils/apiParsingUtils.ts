
import { ApiDefinitionRecord, Endpoint } from "@/types";
import { extractEndpoints } from "./apiValidator";

import { validateApiDefinition } from './apiValidator';
import { detectFileType, parseFileContent } from './fileUtils';

/**
 * Parse an API definition from its string content
 * @param apiDefinition The API definition record from the database
 * @returns An array of endpoints extracted from the API definition
 */
export const parseApiDefinition = async (apiDefinition: ApiDefinitionRecord | null): Promise<Endpoint[]> => {
  if (!apiDefinition) return [];

  try {
    let parsedContent;
    let format;
    let extractedEndpoints: Endpoint[] = [];

    // Check if content is already a string or needs parsing
    if (typeof apiDefinition.content === 'string') {
      try {
        // Try to parse as JSON first
        parsedContent = JSON.parse(apiDefinition.content);

        // If this is already a parsed validation result with format
        if (parsedContent.format && parsedContent.parsedDefinition) {
          format = parsedContent.format;
          console.log("Found pre-parsed content with format:", format);

          // Extract endpoints from the pre-parsed definition
          extractedEndpoints = extractEndpoints(parsedContent, format);
        } else {
          // This is raw JSON API definition, validate it
          console.log("Raw JSON content found, validating...");
          const validationResult = await validateApiDefinition(parsedContent);
          format = validationResult.format;

          // Extract endpoints from the validated definition
          extractedEndpoints = extractEndpoints(validationResult, format);
        }
      } catch (jsonError) {
        // Not JSON, might be YAML or other format
        console.log("Content is not JSON, trying to validate as other format...");
        const fileType = detectFileType(apiDefinition.content);

        if (fileType === 'yaml') {
          // Parse YAML content
          const yamlContent = parseFileContent(apiDefinition.content, 'yaml');
          const validationResult = await validateApiDefinition(yamlContent);
          format = validationResult.format;

          // Extract endpoints from the validated definition
          extractedEndpoints = extractEndpoints(validationResult, format);
        } else {
          // Try direct validation
          const validationResult = await validateApiDefinition(apiDefinition.content);
          format = validationResult.format;

          // Extract endpoints from the validated definition
          extractedEndpoints = extractEndpoints(validationResult, format);
        }
      }
    } else {
      // Handle case where content might be an object already
      console.error('API definition content is not a string:', typeof apiDefinition.content);
      return [];
    }

    // Map extracted endpoints to the expected format
    const formattedEndpoints = extractedEndpoints.map((endpoint) => ({
      ...endpoint,
      id: endpoint.id || `endpoint-${Math.random().toString(36).substring(2)}`,
      method: endpoint.method.toUpperCase() as Endpoint['method'],
      mcpType: endpoint.method.toLowerCase() === 'get' ? 'resource' : 'tool',
      description: endpoint.description || '',
      parameters: endpoint.parameters || [],
      responses: endpoint.responses || []
    }));

    console.log(`Parsed ${formattedEndpoints.length} endpoints`);
    return formattedEndpoints;
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return [];
  }
}
