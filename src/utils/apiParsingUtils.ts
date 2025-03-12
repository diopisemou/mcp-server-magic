import { ApiDefinition, ValidationResult } from "../types/api";
import { extractEndpointsFromDefinition } from "./apiValidator";

/**
 * Parse an API definition from its string content
 * @param apiDefinition The API definition record from the database
 * @returns An array of endpoints extracted from the API definition
 */
//export async function parseApiDefinition(apiDefinition: ApiDefinition | null): Promise<Endpoint[]> {
export function parseApiDefinition(apiDefinition: ApiDefinition | null): ValidationResult {
  if (!apiDefinition?.content) return { endpoints: [], isValid: false, error: 'No content detected', format: apiDefinition.format, parsedDefinition: apiDefinition } as ValidationResult;

  try {
    return { endpoints: extractEndpointsFromDefinition(apiDefinition.content), isValid: true, error: null, format: apiDefinition.format, parsedDefinition: apiDefinition } as ValidationResult;
  } catch (error) {
    console.error('Error parsing API definition:', error);
    return { endpoints: [], isValid: false, error: error, format: apiDefinition.format, parsedDefinition: apiDefinition } as ValidationResult;
  }
}