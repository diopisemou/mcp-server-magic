
import type { ApiDefinition } from './api';

export interface ServerConfig {
  language: 'typescript' | 'python';
  framework: 'express' | 'fastapi';
  database: 'none' | 'mongodb' | 'postgres';
  authentication: boolean;
  apiDefinition?: ApiDefinition;
}

export interface ServerFile {
  path: string;
  content: string;
  language: string;
}

export interface GenerationResult {
  files: ServerFile[];
  config: ServerConfig;
}
