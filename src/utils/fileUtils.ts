
import yaml from 'js-yaml';

/**
 * Detects the content type of a file based on content or extension
 * @param content The file content
 * @param filename Optional filename with extension
 * @returns The detected content type
 */
export const detectFileType = (content: string, filename?: string): 'json' | 'yaml' | 'unknown' => {
  // Check by file extension first
  if (filename) {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.endsWith('.json')) return 'json';
    if (lowerFilename.endsWith('.yaml') || lowerFilename.endsWith('.yml')) return 'yaml';
  }

  // Check content patterns
  try {
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      // Try parsing as JSON to confirm
      JSON.parse(trimmedContent);
      return 'json';
    } else if (
      trimmedContent.includes('swagger:') || 
      trimmedContent.includes('openapi:') ||
      trimmedContent.includes('title:')
    ) {
      // Try parsing as YAML to confirm
      yaml.load(trimmedContent);
      return 'yaml';
    }
  } catch (e) {
    // Parsing failed, continue with other checks
  }

  // More aggressive checking
  try {
    JSON.parse(content);
    return 'json';
  } catch (e) {
    try {
      yaml.load(content);
      return 'yaml';
    } catch (e) {
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
