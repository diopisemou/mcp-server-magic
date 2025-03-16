import * as fs from 'fs';
import * as path from 'path';
import { extractEndpoints } from '../src/utils/endpointExtractor';
import { generateServer } from '../src/utils/serverGeneratorv1';
import { MCPServerValidator, ValidationResult } from './mcp-server-validator';
import type { 
  ApiDefinition, 
  ApiFormat, 
  Endpoint, 
  ServerConfig 
} from '../src/types';

/**
 * Test utility for the MCP server generation process
 * This class provides functionality to test the entire pipeline from
 * OpenAPI parsing to server generation and validation
 */
export class ServerGenerationTester {
  private openApiContent: string;
  private apiFormat: ApiFormat;
  private endpoints: Endpoint[] = [];
  private serverConfig: ServerConfig | null = null;
  private fullConfig: any = null;

  /**
   * Initialize with an OpenAPI definition file
   * @param openApiFilePath Path to the OpenAPI definition JSON/YAML file
   * @param apiFormat The format of the API definition (OpenAPI2, OpenAPI3, etc.)
   */
  constructor(openApiFilePath: string, apiFormat: ApiFormat = 'OpenAPI3') {
    this.openApiContent = fs.readFileSync(openApiFilePath, 'utf8');
    this.apiFormat = apiFormat;
  }

  /**
   * Parse the OpenAPI definition and extract endpoints
   * @returns The extracted endpoints
   */
  public parseOpenApiDefinition(): Endpoint[] {
    try {
      // First, parse the content as JSON
      const parsedDefinition = JSON.parse(this.openApiContent);
      
      // Then extract endpoints using the utility function
      this.endpoints = extractEndpoints(parsedDefinition, this.apiFormat);
      
      // Mark all endpoints as selected by default and classify them
      this.endpoints = this.endpoints.map(endpoint => ({
        ...endpoint,
        selected: true,
        mcpType: this.determineMcpType(endpoint)
      }));
      
      return this.endpoints;
    } catch (error) {
      console.error('Error parsing OpenAPI definition:', error);
      throw error;
    }
  }

  /**
   * Determine the appropriate MCP type for an endpoint
   * @param endpoint The endpoint to categorize
   * @returns The MCP type (resource, tool, or none)
   */
  private determineMcpType(endpoint: Endpoint): 'resource' | 'tool' | 'none' {
    // GET methods are usually resources, others are tools
    if (endpoint.method === 'GET') {
      return 'resource';
    } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(endpoint.method)) {
      return 'tool';
    } else {
      return 'none';
    }
  }

  /**
   * Create a server configuration with the given settings
   * @param language The programming language to use
   * @param name Server name
   * @param description Server description
   * @param authType Authentication type
   * @returns The created server configuration
   */
  public createServerConfig(
    language: 'TypeScript' | 'Python' = 'TypeScript',
    name: string = 'Test MCP Server',
    description: string = 'Generated for testing',
    authType: 'None' | 'API Key' | 'Bearer Token' = 'API Key'
  ): ServerConfig {
    // Make sure endpoints are extracted first
    if (this.endpoints.length === 0) {
      this.parseOpenApiDefinition();
    }

    // Create a minimal API definition object
    const apiDefinition: ApiDefinition = {
      id: 'test-api',
      name: 'Test API',
      format: this.apiFormat,
      content: this.openApiContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      endpoint_definition: this.endpoints
    };

    // Create the server configuration
    this.serverConfig = {
      name,
      description,
      language: language,
      framework: language === 'TypeScript' ? 'express' : 'fastapi',
      authentication: {
        type: authType,
        location: 'header',
        name: authType === 'API Key' ? 'x-api-key' : authType === 'Bearer Token' ? 'Authorization' : undefined,
      },
      hosting: {
        provider: 'AWS',
        type: 'Serverless',
        region: 'us-east-1',
      },
      endpoints: this.endpoints
    };
    
    // Store the API definition separately to pass to the generator
    const fullConfig = {
      ...this.serverConfig,
      apiDefinition
    };

    // Save the full config including API definition
    this.fullConfig = fullConfig;

    return this.serverConfig;
  }

  /**
   * Generate an MCP server with the current configuration
   * @returns The generation result
   */
  public async generateMcpServer() {
    if (!this.serverConfig) {
      throw new Error('Server configuration has not been created. Call createServerConfig() first.');
    }

    try {
      // Use the full config that includes apiDefinition
      if (!this.fullConfig) {
        throw new Error('fullConfig is not initialized');
      }
      return await generateServer(this.fullConfig);
    } catch (error) {
      console.error('Error generating MCP server:', error);
      throw error;
    }
  }

  /**
   * Run the full test pipeline: parse OpenAPI, create config, generate server, validate
   * @param language The programming language to use
   * @param authType Authentication type to use
   * @returns Validation results
   */
  public async runFullTest(
    language: 'TypeScript' | 'Python' = 'TypeScript',
    authType: 'None' | 'API Key' | 'Bearer Token' = 'API Key'
  ): Promise<ValidationResult> {
    try {
      // Step 1: Parse OpenAPI
      console.log('Parsing OpenAPI definition...');
      const endpoints = this.parseOpenApiDefinition();
      console.log(`Extracted ${endpoints.length} endpoints`);
      
      // Step 2: Create server config
      console.log(`Creating ${language} server configuration with ${authType} authentication...`);
      this.createServerConfig(
        language, 
        `Test ${language} MCP Server`,
        `Generated ${language} MCP server for testing`,
        authType
      );
      
      // Step 3: Generate server
      console.log('Generating MCP server...');
      const generationResult = await this.generateMcpServer();
      
      if (!generationResult.success) {
        console.error('Server generation failed:', generationResult.error);
        return {
          valid: false,
          errors: [generationResult.error || 'Unknown generation error']
        };
      }
      
      console.log('Server generated successfully!');
      
      // Step 4: Validate the generated server
      console.log('Validating generated server...');
      const validationResult = MCPServerValidator.validateGenerationResult(generationResult);
      
      if (validationResult.valid) {
        console.log('Server validation passed! Generated a valid MCP server.');
      } else {
        console.error('Server validation failed with errors:', validationResult.errors);
      }
      
      return validationResult;
    } catch (error) {
      console.error('Test execution failed:', error);
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

// Export a function to run the test with a file path
export async function runServerGenerationTest(openApiFilePath: string): Promise<ValidationResult> {
  const tester = new ServerGenerationTester(openApiFilePath);
  return await tester.runFullTest();
}
