import * as fs from 'fs';
import * as path from 'path';
import { ServerFile, ServerConfig, GenerationResult } from '../src/types';

/**
 * MCP Server Validator
 * This utility validates that generated MCP servers follow protocol requirements
 * and contain all necessary components to be runnable.
 */
export class MCPServerValidator {
  /**
   * Validate an MCP server generation result
   * @param result The generation result to validate
   * @returns Validation results with any errors found
   */
  static validateGenerationResult(result: GenerationResult): ValidationResult {
    if (!result.success) {
      return {
        valid: false,
        errors: [result.error || 'Unknown generation error'],
      };
    }

    if (!result.files || result.files.length === 0) {
      return {
        valid: false,
        errors: ['No files generated'],
      };
    }

    // Collect all validation errors
    const validationErrors: string[] = [];

    // Validate essential files exist
    const errors = this.validateEssentialFiles(result.files);
    validationErrors.push(...errors);

    // Validate MCP protocol implementation
    const mcpErrors = this.validateMCPImplementation(result.files);
    validationErrors.push(...mcpErrors);

    // Validate code syntax (simplified)
    const syntaxErrors = this.validateSyntax(result.files);
    validationErrors.push(...syntaxErrors);

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    };
  }

  /**
   * Validate that essential files exist in the generated codebase
   * @param files Generated server files
   * @returns Array of errors, empty if validation passes
   */
  private static validateEssentialFiles(files: ServerFile[]): string[] {
    const errors: string[] = [];
    const filePaths = files.map(f => f.path + f.name);
    
    // Check for TypeScript project
    if (filePaths.some(p => p.endsWith('.ts') || p.endsWith('tsconfig.json'))) {
      if (!filePaths.some(p => p.includes('package.json'))) {
        errors.push('Missing package.json for TypeScript project');
      }
      
      if (!filePaths.some(p => p.includes('tsconfig.json'))) {
        errors.push('Missing tsconfig.json for TypeScript project');
      }
    }
    
    // Check for Python project
    if (filePaths.some(p => p.endsWith('.py'))) {
      if (!filePaths.some(p => p.includes('requirements.txt'))) {
        errors.push('Missing requirements.txt for Python project');
      }
    }
    
    // Check for README
    if (!filePaths.some(p => p.includes('README.md'))) {
      errors.push('Missing README.md documentation');
    }
    
    return errors;
  }

  /**
   * Validate that the MCP protocol is properly implemented
   * @param files Generated server files
   * @returns Array of errors, empty if validation passes
   */
  private static validateMCPImplementation(files: ServerFile[]): string[] {
    const errors: string[] = [];
    let hasServerImplementation = false;
    
    // Check for MCP imports and registrations
    for (const file of files) {
      const content = file.content;
      
      // Check TypeScript files
      if (file.path.endsWith('.ts') || file.path.endsWith('.js')) {
        if (content.includes('MCPServer') || 
            content.includes('registerResource') || 
            content.includes('registerTool')) {
          hasServerImplementation = true;
        }
      }
      
      // Check Python files
      if (file.path.endsWith('.py')) {
        if (content.includes('MCPServer') || 
            content.includes('register_resource') || 
            content.includes('register_tool')) {
          hasServerImplementation = true;
        }
      }
    }
    
    if (!hasServerImplementation) {
      errors.push('No MCP server implementation found');
    }
    
    return errors;
  }

  /**
   * Basic syntax validation for generated code
   * This is a simplified check that just looks for obvious syntax issues
   * @param files Generated server files
   * @returns Array of errors, empty if validation passes
   */
  private static validateSyntax(files: ServerFile[]): string[] {
    const errors: string[] = [];
    
    for (const file of files) {
      // For TypeScript/JavaScript files
      if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        try {
          // Basic syntax checks
          if (
            (file.content.includes('{') && !this.balancedBraces(file.content)) ||
            file.content.includes('import') && !file.content.includes('from') ||
            file.content.includes('function') && !file.content.includes('{')
          ) {
            errors.push(`Syntax error detected in ${file.path}${file.name}`);
          }
        } catch (error) {
          errors.push(`Error validating ${file.path}${file.name}: ${error}`);
        }
      }
      
      // For Python files
      if (file.name.endsWith('.py')) {
        try {
          // Basic syntax checks
          if (
            (file.content.includes('def ') && !file.content.includes(':')) ||
            (file.content.includes('class ') && !file.content.includes(':')) ||
            file.content.includes('import') && file.content.includes('from') && !file.content.includes(' import ')
          ) {
            errors.push(`Syntax error detected in ${file.path}${file.name}`);
          }
        } catch (error) {
          errors.push(`Error validating ${file.path}${file.name}: ${error}`);
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Helper method to check if braces are balanced
   * @param code Code to check
   * @returns True if braces are balanced
   */
  private static balancedBraces(code: string): boolean {
    const stack: string[] = [];
    const openBraces = ['(', '{', '['];
    const closeBraces = [')', '}', ']'];
    
    for (const char of code) {
      if (openBraces.includes(char)) {
        stack.push(char);
      } else if (closeBraces.includes(char)) {
        const index = closeBraces.indexOf(char);
        if (stack.length === 0 || stack.pop() !== openBraces[index]) {
          return false;
        }
      }
    }
    
    return stack.length === 0;
  }
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
