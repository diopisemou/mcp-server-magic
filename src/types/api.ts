

export type ApiFormat = 'OpenAPI2' | 'OpenAPI3' | 'RAML' | 'APIBlueprint';

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
}


export interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: Parameter[];
  responses: Response[];
  selected?: boolean;
  mcpType?: 'resource' | 'tool' | 'none';
}

export interface EndpointDefinition {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: Parameter[];
  responses: Response[];
  selected?: boolean;
  mcpType?: 'resource' | 'tool' | 'none';
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
}

