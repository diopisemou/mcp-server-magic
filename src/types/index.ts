
// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// API definition types
export interface ApiDefinition {
  id?: string;
  project_id?: string;
  name: string;
  format: string;
  content: string;
  parsedDefinition?: any;
  created_at?: string;
  updated_at?: string;
}

// Endpoint parameter
export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

// Endpoint response
export interface EndpointResponse {
  statusCode: number | string;
  description: string;
  schema: any;
}

// Endpoint type
export interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: EndpointParameter[];
  responses: EndpointResponse[];
  mcpType: 'none' | 'resource' | 'tool';
  selected?: boolean;
}

// Authentication types
export type AuthType = 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
export type AuthLocation = 'header' | 'query' | 'cookie';

export interface AuthConfig {
  type: AuthType;
  location?: AuthLocation;
  name?: string;
  value?: string;
}

// Hosting types
export type HostingProvider = 'AWS' | 'GCP' | 'Azure' | 'Self-hosted';
export type HostingType = 'Serverless' | 'Container' | 'VM';

export interface HostingConfig {
  provider: HostingProvider;
  type: HostingType;
  region?: string;
}

// Server configuration
export interface ServerConfig {
  name: string;
  description: string;
  language: 'TypeScript' | 'Python';
  authentication: AuthConfig;
  hosting: HostingConfig;
  endpoints: Endpoint[];
}

// Server file 
export interface ServerFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation';
}

// Generation result
export interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  files?: ServerFile[];
  error?: string;
}

// Server configuration from database
export interface ServerConfiguration {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  language: string;
  authentication_type: string;
  authentication_details?: any;
  hosting_provider: string;
  hosting_type: string;
  hosting_region?: string;
  created_at: string;
  updated_at: string;
}

// Deployment status
export interface Deployment {
  id: string;
  project_id: string;
  configuration_id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  server_url?: string;
  logs?: string;
  created_at: string;
  updated_at: string;
  files?: ServerFile[];
}

// Archive format for downloading files
export interface ArchiveFile {
  name: string;
  path: string;
  content: string;
}

// Zip package format
export interface ZipPackage {
  name: string;
  files: ArchiveFile[];
}
