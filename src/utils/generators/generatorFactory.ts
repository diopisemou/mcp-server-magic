import { ExtendedServerConfig } from '@/types/serverConfig';
import { IServerGenerator } from './baseGenerator';
import { NodeGenerator } from './nodeGenerator';
import { PythonGenerator } from './pythonGenerator';
import { GoGenerator } from './goGenerator';
import { NodeProxyGenerator } from './nodeProxyGenerator';
import { PythonProxyGenerator } from './pythonProxyGenerator';

/**
 * Factory class for creating server generators
 * Uses the factory pattern to create the appropriate generator based on configuration
 */
export class GeneratorFactory {
  /**
   * Create a server generator based on the configuration
   * @param config Server configuration
   * @returns An appropriate server generator instance
   */
  static createGenerator(config: ExtendedServerConfig): IServerGenerator {
    if (config.mode === 'proxy') {
      // Proxy mode generators
      switch (config.language) {
        case 'TypeScript':
          return new NodeProxyGenerator();
        case 'Python':
          return new PythonProxyGenerator();
        case 'Go':
          throw new Error('Proxy mode is not supported for Go language yet');
        default:
          throw new Error(`Unsupported language for proxy mode: ${config.language}`);
      }
    } else {
      // Direct implementation mode generators
      switch (config.language) {
        case 'TypeScript':
          return new NodeGenerator();
        case 'Python':
          return new PythonGenerator();
        case 'Go':
          return new GoGenerator();
        default:
          throw new Error(`Unsupported language: ${config.language}`);
      }
    }
  }
  
  /**
   * Get a list of supported languages for the specified mode
   * @param mode Server mode ('direct' or 'proxy')
   * @returns Array of supported language names
   */
  static getSupportedLanguages(mode: 'direct' | 'proxy'): string[] {
    if (mode === 'proxy') {
      return ['TypeScript', 'Python'];
    } else {
      return ['TypeScript', 'Python', 'Go'];
    }
  }
  
  /**
   * Check if a language is supported for the specified mode
   * @param language Language to check
   * @param mode Server mode ('direct' or 'proxy')
   * @returns True if the language is supported, false otherwise
   */
  static isLanguageSupported(language: string, mode: 'direct' | 'proxy'): boolean {
    return this.getSupportedLanguages(mode).includes(language);
  }
}
