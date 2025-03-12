import { ApiDefinitionRecord, Endpoint } from "@/types";
import { extractEndpoints } from "./apiValidator";

import { validateApiDefinition } from './apiValidator';
import { detectFileType, parseFileContent } from './fileUtils';
import yaml from 'js-yaml';
import { ApiFormat } from '../types';

// Detect the API format from content
export const detectApiFormat = (content: any): ApiFormat => {
  if (!content) {
    return 'OpenAPI3'; // Default assumption
  }

  // Check for OpenAPI 3.0
  if (content.openapi && content.openapi.startsWith('3.')) {
    return 'OpenAPI3';
  }

  // Check for Swagger / OpenAPI 2.0
  if (content.swagger && content.swagger.startsWith('2.')) {
    return 'OpenAPI2';
  }

  // Check for RAML
  if (typeof content === 'string' && content.includes('#%RAML')) {
    return 'RAML';
  }

  // Check for API Blueprint
  if (typeof content === 'string' && 
      (content.includes('FORMAT: 1A') || content.includes('# API Blueprint'))) {
    return 'APIBlueprint';
  }

  // Default to OpenAPI 3.0 if we can't determine
  return 'OpenAPI3';
};

// Helper function to determine if content is JSON or YAML
export const detectContentType = (content: string): 'json' | 'yaml' | 'raml' | 'markdown' => {
  content = content.trim();
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json';
  } else if (content.startsWith('#%RAML')) {
    return 'raml';
  } else if (content.startsWith('# ') || content.startsWith('FORMAT:')) {
    return 'markdown'; // Potential API Blueprint
  } else {
    return 'yaml';
  }
};

// Parse content based on detected type
export const parseApiContent = (content: string): any => {
  if (!content || typeof content !== 'string') {
    console.error('Invalid content provided to parser');
    return null;
  }

  const contentType = detectContentType(content);

  try {
    if (contentType === 'json') {
      return JSON.parse(content);
    } else if (contentType === 'yaml') {
      return yaml.load(content);
    } else if (contentType === 'raml' || contentType === 'markdown') {
      // For RAML and API Blueprint, we might need specialized parsers
      // For now, we'll return an object with the raw content
      return { rawContent: content };
    } else {
      // Try YAML as fallback
      try {
        return yaml.load(content);
      } catch (yamlError) {
        console.error('Failed to parse content as YAML:', yamlError);
        return null;
      }
    }
  } catch (error) {
    console.error('Error parsing API content:', error);
    return null;
  }
};

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