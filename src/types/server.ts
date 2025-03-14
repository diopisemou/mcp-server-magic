
import type { ApiDefinition } from './api';

export interface ServerConfig {
  language: 'TypeScript' | 'Python';
  framework: 'express' | 'fastapi';
  database: 'none' | 'mongodb' | 'postgres';
  authentication: AuthConfig;
  hosting: HostingConfig;
  apiDefinition?: ApiDefinition;
  name?: string;
  description?: string;
  authSecret?: string;
  endpoints?: any[];
}

export interface AuthConfig {
  type: 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
  location?: 'header' | 'query' | 'cookie';
  name?: string;
  value?: string;
}

export interface HostingConfig {
  provider: 'AWS' | 'GCP' | 'Azure' | 'Self-hosted' | 'Supabase';
  type: 'Serverless' | 'Container' | 'VM' | 'Shared' | 'Dedicated';
  region?: string;
}

export interface ServerFile {
  name: string;
  path: string;
  content: string;
  language: string;
  type: 'code' | 'config' | 'documentation';
}

export interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  error?: string;
  files?: ServerFile[];
  config?: ServerConfig;
  parameters?: any[];
  responses?: any[];
  mcpType?: 'none' | 'resource' | 'tool';
  selected?: boolean;
}

export interface ZipPackage {
  fileName: string;
  blob: Blob;
  name?: string;
  files?: ServerFile[];
}

export interface ServerConfigRecord {
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
