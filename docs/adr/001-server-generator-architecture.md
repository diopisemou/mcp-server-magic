# ADR 001: Server Generator Architecture Refactoring

## Status

Accepted

## Date

March 15, 2025

## Context

The MCP Server Generator is a core component of our application that creates MCP servers in different programming languages. The original implementation used a direct approach with several issues:

1. Limited abstraction and reuse between language generators
2. Hard-coded templates inside generator functions
3. Scattered type definitions across files
4. Limited separation of concerns
5. Difficulty adding new languages or features
6. Insufficient testing support

## Decision

We've refactored the server generator to use a more modular, object-oriented architecture with the following components:

1. **Centralized Type Definitions**: All server configuration types are now defined in `src/types/serverConfig.ts`
2. **Base Generator Interface and Abstract Class**: Defined in `baseGenerator.ts`, providing common functionality
3. **Template Manager**: A dedicated class in `templateManager.ts` to manage and render templates
4. **Generator Factory**: Implemented in `generatorFactory.ts` to create the appropriate generator
5. **Language-Specific Generators**: Individual implementations for each supported language and mode

### Component Responsibilities

- **ServerConfig Types**: Define the structure and types for server configuration
- **BaseGenerator**: Provide shared functionality and enforce a common interface
- **TemplateManager**: Manage templates and handle template rendering
- **GeneratorFactory**: Create the appropriate generator based on configuration
- **Language Generators**: Implement language-specific generation logic

### Design Patterns Used

1. **Factory Pattern**: Used in the generator factory to create appropriate generator instances
2. **Template Method Pattern**: Used in the abstract base generator class
3. **Strategy Pattern**: Different generator implementations for different languages
4. **Dependency Injection**: Templates are injected into generators

## Consequences

### Positive

- **Better Separation of Concerns**: Each component has a clear responsibility
- **Improved Maintainability**: Easier to modify and extend
- **Easier Testing**: Components can be tested in isolation
- **More Flexible**: New languages and modes can be added more easily
- **More Consistent Output**: Template-based generation ensures consistent output
- **Better Type Safety**: Improved TypeScript typing throughout the system

### Negative

- **More Complex Architecture**: More files and abstractions to understand
- **Learning Curve**: New developers need to understand the patterns used
- **Template Management**: Templates need to be kept in sync with code changes

## Implementation Details

### ServerConfig Types

```typescript
// Base configuration
export interface BaseServerConfig {
  name: string;
  description?: string;
  language: 'TypeScript' | 'Python' | 'Go';
  authentication: {
    type: 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
    location?: 'header' | 'query';
    name?: string;
  };
  // ...
}

// Mode-specific configurations
export interface ProxyServerConfig extends ServerConfig {
  mode: 'proxy';
  targetBaseUrl: string;
  // ...
}

export interface DirectServerConfig extends ServerConfig {
  mode: 'direct';
}

export type ExtendedServerConfig = ProxyServerConfig | DirectServerConfig;
```

### Generator Interface

```typescript
export interface IServerGenerator {
  generateServer(config: ExtendedServerConfig): GenerationResult;
  validateConfig(config: ExtendedServerConfig): boolean;
  getSupportedFeatures(): string[];
}
```

### Generator Factory

```typescript
export class GeneratorFactory {
  static createGenerator(config: ExtendedServerConfig): IServerGenerator {
    if (config.mode === 'proxy') {
      switch (config.language) {
        case 'TypeScript': return new NodeProxyGenerator();
        case 'Python': return new PythonProxyGenerator();
        // ...
      }
    } else {
      switch (config.language) {
        case 'TypeScript': return new NodeGenerator();
        case 'Python': return new PythonGenerator();
        case 'Go': return new GoGenerator();
        // ...
      }
    }
    
    throw new Error(`Unsupported language: ${config.language}`);
  }
}
```

### Template Manager

```typescript
export class TemplateManager {
  constructor(language: string) {
    // Initialize templates for the specified language
  }
  
  getTemplate(name: string): string {
    // Get a template by name
  }
  
  renderTemplate(name: string, context: any): string {
    // Render a template with context variables
  }
}
```

### Language-Specific Generator (Example)

```typescript
export class NodeGenerator extends BaseGenerator {
  private templateManager: TemplateManager;
  
  constructor() {
    super();
    this.templateManager = new TemplateManager('typescript');
  }
  
  generateServer(config: ExtendedServerConfig): GenerationResult {
    // Generate server files using templates
  }
  
  // Additional methods...
}
```

## Alternatives Considered

1. **Code Generation Libraries**: We considered using existing code generation libraries, but they added complexity without offering enough benefits for our specific use case.
2. **External Templates**: We considered storing templates as external files, but embedding them in the code provides better type safety and easier refactoring.
3. **Single Generator Class**: We considered a single generator class with conditional logic, but this approach was less maintainable and harder to extend.

## Future Work

1. **Dynamic Template Loading**: Consider loading templates from external files for better flexibility
2. **Additional Languages**: Add support for more languages (Ruby, PHP, Java, Rust)
3. **Custom Template Support**: Allow users to provide custom templates
4. **Enhanced Template Variables**: Add more contextual variables to templates
5. **Testing Framework**: Develop a comprehensive testing framework for generators
