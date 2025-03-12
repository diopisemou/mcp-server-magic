
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
      // First detect the file type without trying to parse
      const fileType = detectFileType(apiDefinition.content);
      console.log("Detected file type:", fileType);
      
      if (fileType === 'json') {
        try {
          // Parse as JSON
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
        console.log("JSON parsing error:", jsonError);
        console.log("Content is not valid JSON, trying as YAML...");
      }
      } else if (fileType === 'yaml') {
        console.log("Content appears to be YAML, parsing...");
        try {
          // Parse YAML content
          const yamlContent = parseFileContent(apiDefinition.content, 'yaml');
          console.log("YAML parsed successfully:", typeof yamlContent);
          
          const validationResult = await validateApiDefinition(yamlContent);
          format = validationResult.format;
          console.log("YAML validation result format:", format);
          
          // Extract endpoints from the validated definition
          extractedEndpoints = extractEndpoints(validationResult, format);
        } catch (yamlError) {
          console.error("Error parsing YAML:", yamlError);
          // Fall back to direct validation
          const validationResult = await validateApiDefinition(apiDefinition.content);
          format = validationResult.format;
          extractedEndpoints = extractEndpoints(validationResult, format);
        }
      } else {
        // Try direct validation for other formats
        console.log("Content appears to be neither JSON nor YAML, trying direct validation...");
        const validationResult = await validateApiDefinition(apiDefinition.content);
        format = validationResult.format;
        extractedEndpoints = extractEndpoints(validationResult, format);
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
      // Ensure mcpType is always set correctly
      mcpType: endpoint.mcpType || (endpoint.method.toLowerCase() === 'get' ? 'resource' : 'tool'),
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
