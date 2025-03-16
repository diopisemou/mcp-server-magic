import { generateNodeServer } from './serverTemplates/nodeServer';
import { generatePythonServer } from './serverTemplates/pythonServer';
import { generateGoServer } from './serverTemplates/goServer';
import type { GenerationResult, ServerConfig } from "@/types";

/**
 * Core server generation function - used by both local and edge function implementations
 * 
 * This function selects the appropriate generator based on the language specified
 * in the server configuration and returns a standardized result.
 */
export function generateServerCode(config: ServerConfig): GenerationResult {
  try {
    // Validate the configuration
    if (!config.language) {
      throw new Error("Language is required");
    }

    // Call the appropriate generator based on language
    let result: GenerationResult;
    switch (config.language) {
      case "TypeScript":
        result = generateNodeServer(config);
        break;
      case "Python":
        result = generatePythonServer(config);
        break;
      case "Go":
        result = generateGoServer(config);
        break;
      default:
        throw new Error(`Unsupported language: ${config.language}`);
    }

    // Add the server URL to the result
    return {
      ...result,
      serverUrl: `https://mcp-${
        config.name ? config.name.toLowerCase().replace(/\s+/g, "-") : "server"
      }.example.com`,
    };
  } catch (error) {
    console.error("Error generating server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
