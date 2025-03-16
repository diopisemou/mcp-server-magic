import { generateServerCode } from './serverGeneratorCore';
import type { GenerationResult, ServerConfig } from "@/types";

/**
 * Generate a server based on the provided configuration.
 * 
 * This function serves as the main entry point for server generation,
 * using the core generator function to create server files based on
 * the specified language and configuration.
 */
export const generateServer = async (
  config: ServerConfig,
): Promise<GenerationResult> => {
  try {
    console.log("Generating MCP server with config:", config);
    
    // Generate server code using the core function
    const result = generateServerCode(config);
    
    // Simulate server generation time (for UI consistency)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return result;
  } catch (error) {
    console.error("Error generating server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default {
  generateServer,
};
