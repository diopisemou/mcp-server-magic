# MCP Server Magic - Technical Context

## Technology Stack

The MCP Server Magic platform is built using a modern web technology stack designed for performance, scalability, and developer productivity.

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI component library | 18.x |
| TypeScript | Type-safe JavaScript | 5.x |
| Vite | Build tool and dev server | 5.x |
| React Router | Client-side routing | 6.x |
| TanStack Query | Data fetching and caching | 4.x |
| Tailwind CSS | Utility-first CSS framework | 3.x |
| shadcn/ui | Component library | Latest |
| Lucide | Icon library | Latest |
| Sonner | Toast notifications | Latest |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Supabase | Backend-as-a-Service | Latest |
| PostgreSQL | Database | 15.x |
| Edge Functions | Serverless functions | Latest |
| Auth.js | Authentication | Latest |

### Code Generation Technologies

| Technology | Use Case | Notes |
|------------|----------|-------|
| js-yaml | YAML parsing for OpenAPI | For API definition imports |
| handlebars | Template rendering | For code generation templates |
| highlight.js | Code syntax highlighting | For server file previews |
| jszip | ZIP file creation | For downloadable server packages |

### Development & Build Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code linting | With React and TypeScript plugins |
| Prettier | Code formatting | Integrated with ESLint |
| Vitest | Unit testing | Fast, compatible with Vite |
| GitHub Actions | CI/CD | For automated testing and deployment |
| Husky | Git hooks | For pre-commit checks |

## Development Environment Setup

Setting up the development environment requires:

1. **Node.js**: v18.x or higher
2. **npm**: v9.x or higher
3. **Supabase CLI**: For local Supabase development

### Local Development Steps

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-server-magic.git
cd mcp-server-magic

# Install dependencies
npm install

# Start the development server
npm run dev

# In a separate terminal, start local Supabase
npx supabase start
```

### Environment Configuration

The following environment variables are required:

```
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Analytics
VITE_ANALYTICS_KEY=your-analytics-key

# Optional: Deployment
VITE_AWS_REGION=your-aws-region
VITE_GCP_PROJECT=your-gcp-project
```

A `.env.example` file is provided as a template.

## Technical Constraints

### Browser Compatibility

The application targets modern browsers with the following minimum versions:

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

Legacy browser support is not a priority due to the developer-focused nature of the application.

### Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| Lighthouse Performance Score | > 90 |
| Bundle Size (gzipped) | < 300KB initial load |

### Scalability Considerations

- Client-side generation is limited by browser performance
- Edge functions have execution time limits (varies by provider)
- API rate limits may apply for cloud deployments
- Large API definitions may require chunked processing

### Security Considerations

- Authentication is handled via Supabase Auth
- No credentials are stored in client-side code
- API keys and sensitive values are stored securely and never exposed
- Generated code is scanned for security vulnerabilities
- CORS is properly configured to prevent unauthorized access

## Dependencies & Libraries

### Core Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^4.36.1",
    "axios": "^1.6.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "js-yaml": "^4.1.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "sonner": "^1.2.4",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.4.7"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

## API Integration

### Supabase Integration

The application uses the Supabase client library to interact with the Supabase backend:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

This client is used to:
- Authenticate users
- Store and retrieve API definitions
- Manage server configurations
- Track deployments
- Handle marketplace listings

### Database Schema

The Supabase database includes the following key tables:

1. **api_definitions**
   - Stores imported API specifications
   - Links to projects
   - Contains parsed endpoint data

2. **server_configurations**
   - Stores server configuration options
   - Links to projects
   - Contains language, authentication, and hosting preferences

3. **deployments**
   - Tracks server deployments
   - Links to configurations
   - Contains deployment status and URLs

4. **marketplace_listings**
   - Stores published server configurations
   - Links to deployments
   - Contains ratings and reviews

## Code Generation Approach

The code generation system uses a template-based approach:

1. **Template Definition**
   - Each language has a set of templates
   - Templates use Handlebars syntax
   - Files are organized by language and server component

2. **Configuration Processing**
   - Server configuration is validated
   - Configuration is transformed into template context
   - Language-specific processing is applied

3. **Template Rendering**
   - Templates are rendered with the processed context
   - Output is formatted and organized
   - File structure is generated

4. **Validation**
   - Generated code is checked for correctness
   - Dependencies are verified
   - Templates include tests to validate behavior

Example TypeScript server generator template:

```typescript
// server.ts template
const serverTemplate = `
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
{{#if authentication}}
import { authenticateRequest } from './middleware/auth';
{{/if}}

const server = new Server(
  {
    name: '{{serverName}}',
    version: '{{version}}',
  },
  {
    {{#if authentication}}
    middleware: [authenticateRequest],
    {{/if}}
    capabilities: {
      {{#if hasResources}}
      resources: {},
      {{/if}}
      {{#if hasTools}}
      tools: {},
      {{/if}}
    }
  }
);

{{#each endpoints}}
// {{this.description}}
{{#if this.isResource}}
server.setResourceHandler('{{this.path}}', async (request) => {
  // TODO: Implement resource handler
  return {
    /* Resource content */
  };
});
{{else if this.isTool}}
server.setToolHandler('{{this.name}}', async (request) => {
  // TODO: Implement tool handler
  return {
    /* Tool response */
  };
});
{{/if}}
{{/each}}

const transport = new StdioServerTransport();
server.connect(transport);
console.error('Server running on stdio');
`;
```

## Development Workflow

The development workflow for MCP Server Magic follows these principles:

1. **Feature Branches**
   - New features are developed in dedicated branches
   - Branch naming convention: `feature/feature-name`
   - Pull requests are used for code reviews

2. **Testing Strategy**
   - Unit tests for utility functions
   - Component tests for UI elements
   - End-to-end tests for critical user flows
   - Manual testing for generator output

3. **Deployment Pipeline**
   - Automated tests run on pull requests
   - Staging deployment for review
   - Production deployment after approval
   - Version tagging for releases

4. **Code Quality**
   - ESLint rules enforce code quality
   - Prettier ensures consistent formatting
   - TypeScript strict mode enabled
   - Code reviews required for all changes

## Technical Evolution

The technical architecture has evolved over time:

1. **Initial Prototype** (v0.1-v0.3)
   - Client-side only
   - Limited language support (TypeScript only)
   - Basic generation capabilities

2. **Beta Release** (v0.4-v0.7)
   - Added Supabase backend
   - Introduced Python support
   - Added deployment features

3. **Current Version** (v0.8+)
   - Added Go language support
   - Introduced marketplace
   - Edge function generation
   - Enhanced template system

This technical foundation provides the basis for the MCP Server Magic platform, enabling developers to create and deploy MCP servers with minimal effort while maintaining the flexibility to customize and extend the generated code.
