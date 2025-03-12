import { ApiDefinitionRecord, Endpoint } from "@/types";
import { extractEndpoints, validateApiDefinition } from "./apiValidator";

/**
 * Parse an API definition from its string content
 * @param apiDefinition The API definition record from the database
 * @returns An array of endpoints extracted from the API definition
 */
export const parseApiDefinition = async (apiDefinition: ApiDefinitionRecord | null): Promise<Endpoint[]> => {
  if (!apiDefinition) return [];

  try {
    // Validate the API definition
    const validationResult = await validateApiDefinition(apiDefinition.content);

    // Extract endpoints using the validated definition
    return extractEndpoints(validationResult, validationResult.format);
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return [];
  }
};