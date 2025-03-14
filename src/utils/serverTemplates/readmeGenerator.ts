
import { ServerConfig, Endpoint } from '@/types';

interface ReadmeConfig {
  name: string;
  description: string;
  language: string;
  framework: string;
  authentication: string;
  endpoints?: Endpoint[];
}

export const generateReadme = (config: ReadmeConfig): string => {
  const { name, description, language, framework, authentication, endpoints = [] } = config;
  
  const endpointDocs = endpoints.map(endpoint => {
    const params = endpoint.parameters.map(p => 
      `| ${p.name} | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description} |`
    ).join('\n');
    
    const responses = endpoint.responses.map(r => 
      `| ${r.statusCode} | ${r.description} |`
    ).join('\n');
    
    return `
### ${endpoint.method.toUpperCase()} ${endpoint.path}

${endpoint.description}

${endpoint.parameters.length > 0 ? `
**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
${params}` : ''}

${endpoint.responses.length > 0 ? `
**Responses:**

| Status | Description |
|--------|-------------|
${responses}` : ''}
`;
  }).join('\n');
  
  return `# ${name}

${description}

## Overview

This server was generated automatically by the MCP Server Generator. It provides a Model Context Protocol (MCP) server that can be used to integrate your API with AI models.

- **Language:** ${language}
- **Framework:** ${framework}
- **Authentication:** ${authentication}
- **Endpoints:** ${endpoints.length}

## Getting Started

### Prerequisites

- ${language === 'Python' ? 'Python 3.8+' : 'Node.js 14+'}
- ${language === 'Python' ? 'pip' : 'npm or yarn'}

### Installation

${language === 'Python' 
  ? '```bash\npip install -r requirements.txt\n```' 
  : '```bash\nnpm install\n# or\nyarn install\n```'}

### Running the Server

${language === 'Python' 
  ? '```bash\nuvicorn main:app --reload\n```' 
  : '```bash\nnpm start\n# or\nyarn start\n```'}

## API Endpoints

${endpointDocs || 'No endpoints available.'}

## Authentication

${authentication === 'None' 
  ? 'This server does not require authentication.' 
  : `This server uses ${authentication} authentication.`}

## License

This project is open-source and available under the MIT License.
`;
};
