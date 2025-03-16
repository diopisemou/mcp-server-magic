import { ApiDefinition, Endpoint } from '@/types';

/**
 * Base server configuration properties
 */
export interface BaseServerConfig {
  name: string;
  description?: string;
  language: 'TypeScript' | 'Python' | 'Go';
  authentication: {
    type: 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
    location?: 'header' | 'query';
    name?: string;
  };
  hosting: {
    provider: string;
    type: string;
  };
  endpoints: Endpoint[];
  authSecret?: string;
  database?: string;
  framework?: string;
  apiDefinition?: ApiDefinition;
}


/**
 * Standard server configuration that extends the base
 */
export interface ServerConfig extends BaseServerConfig {
  // Base properties are inherited
}

/**
 * Configuration for proxy mode servers that connect to existing APIs
 */
export interface ProxyServerConfig extends ServerConfig {
  mode: 'proxy';
  targetBaseUrl: string;
  cacheEnabled?: boolean;
  rateLimitingEnabled?: boolean;
}

/**
 * Configuration for direct implementation mode servers
 */
export interface DirectServerConfig extends ServerConfig {
  mode: 'direct';
}

/**
 * Combined server configuration type that supports all modes
 */
export type ExtendedServerConfig = ProxyServerConfig | DirectServerConfig;
