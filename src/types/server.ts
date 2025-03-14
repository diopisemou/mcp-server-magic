
import type { ApiDefinition } from './api';

export interface ServerConfig {
  language: 'TypeScript' | 'Python';
  framework: 'express' | 'fastapi';
  database: 'none' | 'mongodb' | 'postgres';
  authentication: boolean;
  apiDefinition?: ApiDefinition;
  name?: string;
  description?: string;
  authSecret?: string;
}

export interface ServerFile {
  path: string;
  content: string;
  language: string;
  type: 'code' | 'config' | 'documentation';
}

export interface GenerationResult {
  files: ServerFile[];
  config: ServerConfig;
  language?: string;
}
