
import { Json } from './json';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    recognition: any; // For storing the recognition instance
  }
}

export type ApiFormat = "OpenAPI2" | "OpenAPI3" | "RAML" | "APIBlueprint";

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ApiDefinition {
  id: string;
  name: string;
  format: ApiFormat | string;
  content: string;
  parsedDefinition?: any;
  file?: File;
  url?: string;
  created_at: string;
  user_id?: string;
  description?: string;
  endpoint_definition?: EndpointDefinition[];
  project_id?: string; // Added project_id
}

export interface EndpointDefinition {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  description: string;
  parameters: Parameter[];
  responses: Response[];
  selected?: boolean;
  mcpType?: "resource" | "tool" | "none";
  summary?: string; // Added optional properties
  operationId?: string;
  requestBody?: any;
  security?: any;
  tags?: string[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Response {
  statusCode: number | string;
  description: string;
  schema: any;
}

export interface ValidationResult {
  isValid: boolean;
  format: ApiFormat;
  errors?: string[];
  parsedDefinition: any;
  endpoints: EndpointDefinition[];
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

export interface Endpoint {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  description: string;
  parameters: Parameter[];
  responses: Response[];
  selected?: boolean;
  mcpType?: "resource" | "tool" | "none";
  summary?: string;
  operationId?: string;
  requestBody?: any;
  security?: any;
  tags?: string[];
}

// Updated types for auth and hosting
export type AuthType = "None" | "API Key" | "Bearer Token" | "Basic Auth";
export type AuthLocation = "header" | "query" | "cookie";

export interface AuthConfig {
  type: AuthType;
  location?: AuthLocation;
  name?: string;
  value?: string;
}

// Hosting types
export type HostingProvider = "AWS" | "GCP" | "Azure" | "Self-hosted" | "Supabase";
export type HostingType = "Serverless" | "Container" | "VM" | "Shared" | "Dedicated";

export interface HostingConfig {
  provider: HostingProvider;
  type: HostingType;
  region?: string;
}

export interface ServerConfig {
  name: string;
  description: string;
  language: "Python" | "TypeScript";
  authentication: AuthConfig;
  hosting: HostingConfig;
  endpoints: Endpoint[];
  authSecret?: string; 
  database?: string;
  framework?: string;
}

export interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  error?: string;
  files?: ServerFile[];
  parameters?: EndpointParameter[];
  responses?: EndpointResponse[];
  mcpType?: "none" | "resource" | "tool";
  selected?: boolean;
}

export interface ServerFile {
  name: string;
  path: string;
  content: string;
  type: "code" | "config" | "documentation";
  language?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  user_metadata?: {
    username?: string;
  };
}

export interface McpProject {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDefinitionRecord {
  id: string;
  project_id: string;
  name: string;
  format: string;
  content: string;
  created_at: string;
  updated_at: string;
  endpoint_definition?: Json;
  endpoints?: EndpointDefinition[];
}

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

export interface Deployment {
  id: string;
  project_id: string;
  configuration_id: string;
  status: "pending" | "processing" | "success" | "failed";
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
  fileName: string;
  blob: Blob;
  name?: string; 
  files?: ServerFile[];
}

export interface MCPCapability {
  type: 'resource' | 'tool';
  name: string;
  description: string;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  stars: number;
  downloads: number;
  capabilities: MCPCapability[];
  tags: string[];
  updatedAt: string;
}

// Re-export from server.ts for backward compatibility
export { ServerConfigRecord } from './serverTypes';
