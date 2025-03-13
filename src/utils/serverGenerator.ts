import type { ServerConfig, GenerationResult, ServerFile } from '../types';
import { generatePythonServer } from './serverTemplates/pythonServer';
import { generateNodeServer } from './serverTemplates/nodeServer';
import { generateGoServer } from './serverTemplates/goServer';

/**
 * Main function to generate server code based on configuration
 */
export function generateServer(config: ServerConfig): Promise<GenerationResult> {
  // Validate configuration
  if (!config.language || !config.endpoints) {
    return Promise.reject(new Error('Invalid server configuration'));
  }

  try {
    // Generate server based on selected language
    switch (config.language.toLowerCase()) {
      case 'python':
        return Promise.resolve(generatePythonServer(config));
      case 'node':
      case 'javascript':
      case 'typescript':
        return Promise.resolve(generateNodeServer(config));
      case 'go':
        return Promise.resolve(generateGoServer(config));
      default:
        return Promise.reject(new Error(`Unsupported language: ${config.language}`));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

export default {
  generateServer
};