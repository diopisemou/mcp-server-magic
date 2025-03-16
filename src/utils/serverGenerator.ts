
import { ServerConfig, GenerationResult, ServerFile, ZipPackage, ArchiveFile } from '@/types';
import { ExtendedServerConfig, DirectServerConfig, ProxyServerConfig } from '@/types/serverConfig';
import { GeneratorFactory } from './generators/generatorFactory';
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
    
    // Get the appropriate generator using the factory
    const generator = GeneratorFactory.createGenerator(normalizedConfig);
    
    // Validate the configuration
    if (!generator.validateConfig(normalizedConfig)) {
      return {
        success: false,
        error: 'Invalid server configuration'
      };
    }
    
    // Generate the server files
    return generator.generateServer(normalizedConfig);
  } catch (error) {
    console.error('Error generating server:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the server';
    return {
      success: false,
      error: errorMessage
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
    
    // Convert ServerFiles to ArchiveFiles
    const archiveFiles: ArchiveFile[] = files.map(file => ({
      name: file.name,
      path: file.path,
      content: file.content
    }));
    
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
      files,
      archivefiles: archiveFiles
    };
  } catch (error) {
    console.error('Error creating zip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create zip file';
    throw new Error(errorMessage);
  }
};

/**
 * Normalize the server configuration and set default values
 * @param config Input server configuration
 * @returns Normalized server configuration
 */
function normalizeServerConfig(config: ServerConfig): ExtendedServerConfig {
  // Determine the mode
  const mode = (config as ExtendedServerConfig).mode || 'direct';
  
  // Base normalized config
  const baseConfig = {
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
  
  // Create mode-specific config
  if (mode === 'proxy') {
    return {
      ...baseConfig,
      mode: 'proxy',
      targetBaseUrl: (config as ProxyServerConfig).targetBaseUrl || 'https://api.example.com',
      cacheEnabled: (config as ProxyServerConfig).cacheEnabled || false,
      rateLimitingEnabled: (config as ProxyServerConfig).rateLimitingEnabled || false
    } as ProxyServerConfig;
  } else {
    return {
      ...baseConfig,
      mode: 'direct'
    } as DirectServerConfig;
  }
}
