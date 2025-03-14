
import yaml from 'js-yaml';
import { Buffer } from 'buffer';
import type { ApiFormat, ValidationResult, ApiDefinition, EndpointDefinition } from '@/types';
import { extractEndpoints } from './endpointExtractor';

// Buffer polyfill for browser environments
const BufferPolyfill = {
  isBuffer: (obj: any): boolean => obj instanceof Uint8Array || obj instanceof ArrayBuffer || (obj && typeof obj.byteLength === 'number'),
  from: (data: string | Uint8Array): { toString: () => string } => ({
    toString: () => typeof data === 'string' ? data : new TextDecoder().decode(data)
  })
};
const BufferImpl = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

/**
 * Validate and parse an API definition
 */
export const validateApiDefinition = async (content: string | Uint8Array, name?: string): Promise<ValidationResult> => {
  try {
    // Detect content type and format
    const contentType = detectContentType(content);
    const parsedContent = parseContent(content, contentType);
    const format = determineApiFormat(parsedContent);
    
    // Validate the API definition
    const errors = validateApiDefinitionContent(parsedContent, format);
    
    if (errors.length > 0) {
      return {
        isValid: false,
        format,
        errors,
        parsedDefinition: parsedContent,
        endpoints: []
      };
    }
    
    // Extract endpoints
    const endpoints = await extractEndpoints(parsedContent, format);
    
    return {
      isValid: true,
      format,
      parsedDefinition: parsedContent,
      endpoints
    };
  } catch (error: any) {
    return {
      isValid: false,
      format: 'OpenAPI3',
      errors: [error.message || 'Failed to validate API definition'],
      parsedDefinition: null,
      endpoints: []
    };
  }
};

/**
 * Detect the content type of an API definition
 */
function detectContentType(content: string | Uint8Array): 'json' | 'yaml' | 'raml' | 'apiblueprint' | 'unknown' {
  if (BufferImpl.isBuffer(content)) {
    content = BufferImpl.from(content).toString();
  }
  
  const strContent = String(content).trim();
  
  if (strContent.startsWith('#%RAML')) return 'raml';
  if (strContent.startsWith('# ') || strContent.startsWith('FORMAT:')) return 'apiblueprint';
  
  try {
    JSON.parse(strContent);
    return 'json';
  } catch {
    try {
      yaml.load(strContent);
      return 'yaml';
    } catch {
      return 'unknown';
    }
  }
}

/**
 * Parse API definition content based on content type
 */
function parseContent(content: string | Uint8Array, contentType: ReturnType<typeof detectContentType>): any {
  if (BufferImpl.isBuffer(content)) {
    content = BufferImpl.from(content).toString();
  }
  
  const strContent = String(content).trim();
  
  try {
    switch (contentType) {
      case 'json':
        return JSON.parse(strContent);
      case 'yaml':
        return yaml.load(strContent);
      case 'raml':
        const ramlLines = strContent.split('\n');
        return {
          version: ramlLines.find(l => l.startsWith('#%RAML'))?.split(' ')[1] || '',
          title: ramlLines.find(l => l.startsWith('title:'))?.split(':')[1]?.trim() || '',
          isRaml: true
        };
      case 'apiblueprint':
        return { isApiBlueprint: true, content: strContent };
      case 'unknown':
        try {
          return JSON.parse(strContent);
        } catch {
          return yaml.load(strContent);
        }
    }
  } catch (error) {
    throw new Error(`Failed to parse content: ${(error as Error).message}`);
  }
}

/**
 * Determine the API format
 */
function determineApiFormat(parsedContent: any): ApiFormat {
  if (parsedContent.swagger === '2.0') return 'OpenAPI2';
  if (parsedContent.openapi?.startsWith('3.')) return 'OpenAPI3';
  if (parsedContent.isRaml) return 'RAML';
  if (parsedContent.isApiBlueprint) return 'APIBlueprint';
  return 'OpenAPI3'; // Default
}

/**
 * Validate API definition content
 */
function validateApiDefinitionContent(parsedContent: any, format: ApiFormat): string[] {
  const errors: string[] = [];
  
  switch (format) {
    case 'OpenAPI2':
      if (parsedContent.swagger !== '2.0') errors.push('Invalid Swagger version');
      if (!parsedContent.info?.title) errors.push('Missing API title');
      if (!parsedContent.info?.version) errors.push('Missing API version');
      if (!Object.keys(parsedContent.paths || {}).length) errors.push('No paths defined');
      break;
    case 'OpenAPI3':
      if (!parsedContent.openapi?.startsWith('3.')) errors.push('Invalid OpenAPI version');
      if (!parsedContent.info?.title) errors.push('Missing API title');
      if (!parsedContent.info?.version) errors.push('Missing API version');
      if (!Object.keys(parsedContent.paths || {}).length) errors.push('No paths defined');
      break;
    case 'RAML':
      if (!parsedContent.version) errors.push('Missing RAML version');
      if (!parsedContent.title) errors.push('Missing API title');
      break;
    case 'APIBlueprint':
      if (!parsedContent.content?.trim()) errors.push('Empty API Blueprint document');
      if (!parsedContent.content.includes('# ') && !parsedContent.content.includes('FORMAT:')) 
        errors.push('Missing API Blueprint header');
      break;
  }
  
  return errors;
}
