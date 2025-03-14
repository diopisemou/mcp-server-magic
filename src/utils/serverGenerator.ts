
import { generateNodeServer } from './serverTemplates/nodeServer';
import { generatePythonServer } from './serverTemplates/pythonServer';
import { ServerConfig, GenerationResult, ServerFile, ZipPackage } from '@/types';
import JSZip from 'jszip';

/**
 * Generate a server based on the given configuration
 * @param config Server configuration
 * @returns Generated server files
 */
export const generateServer = async (config: ServerConfig): Promise<GenerationResult> => {
  try {
    // Normalize the server configuration
    const normalizedConfig = normalizeServerConfig(config);
    
    // Generate the server files based on the language
    let result: GenerationResult;
    
    switch (normalizedConfig.language) {
      case 'TypeScript':
        result = generateNodeServer(normalizedConfig);
        break;
      case 'Python':
        result = generatePythonServer(normalizedConfig);
        break;
      default:
        return {
          success: false,
          error: `Unsupported language: ${normalizedConfig.language}`
        };
    }
    
    return result;
  } catch (error: any) {
    console.error('Error generating server:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while generating the server'
    };
  }
};

/**
 * Create a zip file containing the generated server files
 * @param files Generated server files
 * @param serverName Name of the server
 * @returns Zip package
 */
export const createServerZip = async (files: ServerFile[], serverName: string): Promise<ZipPackage> => {
  try {
    const zip = new JSZip();
    const rootFolder = zip.folder(serverName.toLowerCase().replace(/\s+/g, '-')) || zip;
    
    // Add each file to the zip
    for (const file of files) {
      const path = file.path;
      const folders = path.split('/');
      const fileName = folders.pop() || '';
      
      if (folders.length > 0) {
        const folder = rootFolder.folder(folders.join('/')) || rootFolder;
        folder.file(fileName, file.content);
      } else {
        rootFolder.file(fileName, file.content);
      }
    }
    
    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    return {
      fileName: `${serverName.toLowerCase().replace(/\s+/g, '-')}.zip`,
      blob,
      name: serverName,
      files
    };
  } catch (error: any) {
    console.error('Error creating zip:', error);
    throw new Error(error.message || 'Failed to create zip file');
  }
};

/**
 * Normalize the server configuration and set default values
 * @param config Input server configuration
 * @returns Normalized server configuration
 */
function normalizeServerConfig(config: ServerConfig): ServerConfig {
  return {
    ...config,
    name: config.name || 'MCP Server',
    description: config.description || 'Generated MCP Server',
    language: config.language || 'TypeScript',
    authentication: config.authentication || {
      type: 'None',
      location: 'header'
    },
    hosting: config.hosting || {
      provider: 'AWS',
      type: 'Serverless'
    },
    endpoints: (config.endpoints || []).map(endpoint => ({
      ...endpoint,
      selected: endpoint.selected !== false,
      mcpType: endpoint.mcpType || (endpoint.method === 'GET' ? 'resource' : 'tool')
    }))
  };
}
