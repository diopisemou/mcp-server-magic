
export interface ApiDefinition {
  name: string;
  format: 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';
  content: string;
  file?: File;
  url?: string;
}

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
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
  };
  hosting: {
    provider: 'AWS' | 'GCP' | 'Azure' | 'Self-hosted';
    type: 'Shared' | 'Dedicated';
  };
}
