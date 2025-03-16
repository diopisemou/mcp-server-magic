
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
  mode: string;
}
