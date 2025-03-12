export const detectFileType = (content: string, filename?: string): 'json' | 'yaml' | 'unknown' => {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  content = content.trim();

  // Check for JSON format first
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json';
  }

  // Check file extension if available
  if (filename) {
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml';
  }

  // Try to parse as JSON
  try {
    JSON.parse(content);
    return 'json';
  } catch (e) {
    // If not JSON, assume YAML
    return 'yaml';
  }
};

export const parseFileContent = (content: string, fileType: 'json' | 'yaml' | 'unknown'): any => {
  if (!content) return null;

  try {
    if (fileType === 'json') {
      return JSON.parse(content);
    } else if (fileType === 'yaml') {
      // This function relies on js-yaml which should be imported in the file that calls this
      const yaml = require('js-yaml');
      return yaml.load(content);
    } else if (fileType === 'unknown') {
      // Try JSON first, then YAML
      try {
        return JSON.parse(content);
      } catch (e) {
        const yaml = require('js-yaml');
        return yaml.load(content);
      }
    }
  } catch (error) {
    console.error(`Error parsing ${fileType} content:`, error);
    throw new Error(`Failed to parse content as ${fileType}: ${(error as Error).message}`);
  }

  return null;
};