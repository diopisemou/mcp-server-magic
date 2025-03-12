export interface ApiDefinition {
  name: string;
  format: 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';
  content: string;
  parsedDefinition?: any;
  file?: File;
  url?: string;
}

export interface Endpoint {
  id?: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description?: string;
  parameters: Parameter[];
  responses: Response[];
  mcpType: 'resource' | 'tool' | 'none';
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Response {
  statusCode: number;
  description: string;
  schema?: any;
}

export interface ServerConfig {
  name: string;
  description: string;
  language: 'Python' | 'TypeScript';
  authentication: {
    type: 'ApiKey' | 'Basic' | 'Bearer' | 'None';
    location?: 'header' | 'query';
    name?: string;
    value?: string;
  };
  hosting: {
    provider: 'AWS' | 'GCP' | 'Azure' | 'Supabase' | 'Self-hosted';
    type: 'Shared' | 'Dedicated';
    region?: string;
  };
  endpoints: Endpoint[];
}

export interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  error?: string;
  files?: ServerFile[];
}

export interface ServerFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation';
}

export interface User {
  id: string;
  email: string;
  username?: string;
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
}

export interface ServerConfigRecord {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  language: 'Python' | 'TypeScript';
  authentication_type: string;
  authentication_details: Record<string, any>;
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
  status: 'pending' | 'success' | 'failed';
  server_url?: string;
  logs?: string;
  created_at: string;
  updated_at: string;
}
