
export interface ApiDefinition {
  id: string;
  name: string;
  format: string;
  created_at: string;
  user_id?: string;
  description?: string;
  endpoint_definition?: EndpointDefinition[];
}

export interface EndpointDefinition {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  parameters: Parameter[];
  responses: Response[];
  selected?: boolean;
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
