import yaml from 'js-yaml';

/**
 * Detects the content type of a file based on content or extension
 * @param content The file content
 * @param filename Optional filename with extension
 * @returns The detected content type
 */
export const detectFileType = (content: string, filename?: string): 'json' | 'yaml' | 'raml' | 'markdown' | 'unknown' => {
  // Check file extension first if available
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'json') return 'json';
    if (ext === 'yaml' || ext === 'yml') return 'yaml';
    if (ext === 'raml') return 'raml';
    if (ext === 'md' || ext === 'apib') return 'markdown';
  }

  // Try to guess from content
  content = content.trim();
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json';
  } else if (content.startsWith('#%RAML')) {
    return 'raml';
  } else if ((content.startsWith('FORMAT:') || content.startsWith('# FORMAT:')) && content.includes('API Blueprint')) {
    return 'markdown';
  } else if (
    content.includes('swagger:') || 
    content.includes('openapi:') || 
    content.startsWith('openapi:') || 
    content.startsWith('swagger:')
  ) {
    return 'yaml';
  }

  // Try to parse as JSON as a final check
  try {
    JSON.parse(content);
    return 'json';
  } catch (e) {
    // If it's not valid JSON, default to YAML
    return 'yaml';
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