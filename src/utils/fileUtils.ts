import yaml from 'js-yaml';

/**
 * Detects the content type of a file based on content or extension
 * @param content The file content
 * @param filename Optional filename with extension
 * @returns The detected content type
 */
export const detectFileType = (content: string, filename?: string): 'json' | 'yaml' | 'raml' | 'markdown' | 'unknown' => {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  const trimmedContent = content.trim();

  // Check for file extension first
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'json') return 'json';
    if (ext === 'yaml' || ext === 'yml') return 'yaml';
    if (ext === 'raml') return 'raml';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
  }

  // Check content structure
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    try {
      JSON.parse(trimmedContent);
      return 'json';
    } catch (e) {
      // Not valid JSON
    }
  }

  if (trimmedContent.startsWith('#%RAML')) {
    return 'raml';
  } else if (trimmedContent.startsWith('# ') || trimmedContent.startsWith('FORMAT:')) {
    return 'markdown'; // Potential API Blueprint
  }

  // Check for YAML indicators
  if (
    trimmedContent.includes('openapi:') ||
    trimmedContent.includes('swagger:') ||
    trimmedContent.includes('info:') ||
    trimmedContent.includes('paths:')
  ) {
    try {
      yaml.load(trimmedContent);
      return 'yaml';
    } catch (e) {
      // Not valid YAML
    }
  }

  // Try to parse as JSON or YAML
  try {
    JSON.parse(trimmedContent);
    return 'json';
  } catch (jsonError) {
    try {
      yaml.load(trimmedContent);
      return 'yaml';
    } catch (yamlError) {
      return 'unknown';
    }
  }
};

/**
 * Parse file content based on detected type
 * @param content The file content as string
 * @param fileType The detected file type
 * @returns Parsed content as object
 */
export const parseFileContent = (content: string, fileType: 'json' | 'yaml' | 'unknown'): any => {
  try {
    if (fileType === 'json') {
      return JSON.parse(content);
    } else if (fileType === 'yaml') {
      return yaml.load(content);
    } else {
      // Try both formats
      try {
        return JSON.parse(content);
      } catch (e) {
        return yaml.load(content);
      }
    }
  } catch (error) {
    console.error('Error parsing file content:', error);
    throw new Error(`Failed to parse ${fileType} content: ${(error as Error).message}`);
  }
};