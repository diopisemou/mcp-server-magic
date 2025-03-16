# MCP Server Generator Architecture

## Overview

The MCP Server Generator is a core component of our application that creates MCP-compliant servers in multiple programming languages. The generator uses a modular, object-oriented architecture to provide flexibility, maintainability, and extensibility.

![Architecture Diagram](https://mermaid.ink/img/pako:eNqFk01PwzAMhv9K5NMe2i-JHdAOHEDiABqHXUhjbaUuTao4HSvbf8dpByg9kFyc2M_rxI5zVFoRZGBNWUpR00-tbFvzKnb0pLCUNc1eUKxDPPAcHx-ioWwdtZZ7Y0Rb7fIaO6f3xsJOS0flujJt5fWu1cZQDr2OVu5xhxm_lJz-QHDGIORmqA8PuS-MnkZgBPERRKKJoAZ38yZBrJ_IOsocTtg3zrohpGMFIbJeqxoZNN7eYxPP6PxkfL2eXU_m8-vLCQ6JJ2qVb3BvlNkCa7yaNqxZsm4Y2bBmMl2SxS3a2jnlEJxPsXTN8b81xgvXK_kveN3G3SRyUeqdNwx63bkm47pI4XnBF8K3sDC1ZrBR3HCnCqmADYWRjvlCUalcZSzk1FoybwxyqMk6YJBzlsKrQLWGnHcGMoETTaGvwI3uPkP2FtTLgVvkbE_7VWqQDgcO8QG_AfuZvmQ?type=png)

## Components

### 1. Server Configuration Types

The `serverConfig.ts` file defines the structure and types for server configuration:

- `BaseServerConfig`: Base interface with common properties
- `DirectServerConfig`: For direct implementation servers
- `ProxyServerConfig`: For proxy servers that forward to existing APIs
- `ExtendedServerConfig`: Union type of DirectServerConfig and ProxyServerConfig

### 2. Generator Interface and Base Class

The `baseGenerator.ts` file defines:

- `IServerGenerator` interface: Contract for all generators
- `BaseGenerator` abstract class: Common functionality for all generators

### 3. Template Manager

The `templateManager.ts` file implements a template system:

- Template registration and storage
- Template rendering with context variables
- Language-specific template collections

### 4. Generator Factory

The `generatorFactory.ts` file implements the factory pattern:

- Creates appropriate generator based on configuration
- Handles language and mode selection
- Provides utility methods for supported languages

### 5. Language-Specific Generators

Each language has dedicated generator implementations:

- **TypeScript/Node.js**: `nodeGenerator.ts` and `nodeProxyGenerator.ts`
- **Python/FastAPI**: `pythonGenerator.ts` and `pythonProxyGenerator.ts`
- **Go/Gorilla Mux**: `goGenerator.ts`

### 6. Main Generator Entry Point

The `serverGenerator.ts` file is the main entry point:

- Normalizes server configuration
- Uses the generator factory to create appropriate generator
- Provides zip file creation functionality

## Generator Workflow

1. User provides a server configuration
2. The main generator normalizes the configuration
3. The generator factory creates the appropriate generator instance
4. The generator validates the configuration
5. The generator uses the template manager to create server files
6. The generator returns the generated files

## Supported Languages and Modes

| Language | Direct Mode | Proxy Mode |
|----------|-------------|------------|
| TypeScript | ✓ | ✓ |
| Python | ✓ | ✓ |
| Go | ✓ | ❌ |

## Future Extensions

The architecture is designed to be easily extended:

1. **New Languages**: Add a new generator class and templates
2. **New Modes**: Extend the configuration types and add generator implementations
3. **New Features**: Add them to base generator or specific implementations

## Design Patterns Used

1. **Factory Pattern**: For creating appropriate generators
2. **Template Method Pattern**: In the abstract base generator
3. **Strategy Pattern**: Different implementations for different languages
4. **Dependency Injection**: Templates injected into generators

For detailed information on the architecture design decisions, see the [ADR document](./adr/001-server-generator-architecture.md).
