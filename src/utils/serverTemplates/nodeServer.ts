
import type { ServerConfig, GenerationResult, ServerFile } from '../../types';

/**
 * Generates Node.js/Express server files
 */
export function generateNodeServer(config: ServerConfig): GenerationResult {
  const files: ServerFile[] = [];
  const isTypescript = config.language === 'typescript';
  const extension = isTypescript ? 'ts' : 'js';
  
  // Generate main server file
  files.push({
    name: `index.${extension}`,
    path: '',
    type: 'code',
    content: generateMainFile(config, isTypescript),
    language: isTypescript ? 'typescript' : 'javascript'
  });
  
  // Generate package.json
  files.push({
    name: 'package.json',
    path: '',
    type: 'config',
    content: generatePackageJson(config, isTypescript),
    language: 'json'
  });
  
  // Generate tsconfig.json if using TypeScript
  if (isTypescript) {
    files.push({
      name: 'tsconfig.json',
      path: '',
      type: 'config',
      content: generateTsConfig(),
      language: 'json'
    });
  }
  
  // Generate route files
  generateRouteFiles(config, isTypescript).forEach(file => files.push(file));
  
  // Generate middleware files
  if (config.authentication) {
    files.push({
      name: `auth.${extension}`,
      path: 'middleware/',
      type: 'code',
      content: generateAuthMiddleware(config, isTypescript),
      language: isTypescript ? 'typescript' : 'javascript'
    });
  }
  
  // Generate documentation
  files.push({
    name: 'README.md',
    path: '',
    type: 'docs',
    content: generateReadmeFile(config, isTypescript),
    language: 'markdown'
  });
  
  return {
    files,
    language: isTypescript ? 'typescript' : 'javascript',
    deployCommand: isTypescript ? 'npm run build && npm start' : 'npm start'
  };
}

/**
 * Generates the main server file
 */
function generateMainFile(config: ServerConfig, isTypescript: boolean): string {
  const ext = isTypescript ? 'ts' : 'js';
  
  return `
${isTypescript ? 'import express, { Request, Response, NextFunction } from "express";' : 'const express = require("express");'}
${isTypescript ? 'import cors from "cors";' : 'const cors = require("cors");'}
${isTypescript ? 'import bodyParser from "body-parser";' : 'const bodyParser = require("body-parser");'}
${config.authentication ? (isTypescript ? 'import jwt from "jsonwebtoken";' : 'const jwt = require("jsonwebtoken");') : ''}
${config.authentication ? (isTypescript ? 'import { authenticateToken } from "./middleware/auth";' : 'const { authenticateToken } = require("./middleware/auth");') : ''}

// Import routes
${config.endpoints.map(endpoint => {
  const routeName = endpoint.path.replace(/\//g, '').replace(/-/g, '_');
  return isTypescript 
    ? `import ${routeName}Router from "./routes/${routeName}";`
    : `const ${routeName}Router = require("./routes/${routeName}");`;
}).join('\n')}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
${config.endpoints.map(endpoint => {
  const routeName = endpoint.path.replace(/\//g, '').replace(/-/g, '_');
  return `app.use("${endpoint.path}", ${routeName}Router);`;
}).join('\n')}

${config.authentication ? `
// Authentication endpoint
app.post("/login", (${isTypescript ? 'req: Request, res: Response' : 'req, res'}) => {
  const { username, password } = req.body;
  
  // In a real app, validate credentials against a database
  if (username !== "admin" || password !== "password") {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  const token = jwt.sign({ username }, "${config.authSecret || 'your_jwt_secret'}", { 
    expiresIn: "1h" 
  });
  
  res.json({ token });
});
` : ''}

// Error handling middleware
app.use((${isTypescript ? 'err: Error, req: Request, res: Response, next: NextFunction' : 'err, req, res, next'}) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

${isTypescript ? 'export default app;' : 'module.exports = app;'}
`;
}

/**
 * Generates package.json
 */
function generatePackageJson(config: ServerConfig, isTypescript: boolean): string {
  return JSON.stringify({
    name: config.name?.toLowerCase().replace(/\s+/g, '-') || 'api-server',
    version: '1.0.0',
    description: config.description || 'Generated API Server',
    main: isTypescript ? 'dist/index.js' : 'index.js',
    scripts: {
      ...(isTypescript ? {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'ts-node-dev --respawn index.ts'
      } : {
        start: 'node index.js',
        dev: 'nodemon index.js'
      })
    },
    dependencies: {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "body-parser": "^1.20.1",
      ...(config.authentication ? { "jsonwebtoken": "^9.0.0" } : {}),
      ...(config.database === 'mongodb' ? { "mongoose": "^7.0.0" } : {}),
      ...(config.database === 'postgres' ? { 
        "pg": "^8.9.0",
        "sequelize": "^6.28.0"
      } : {})
    },
    devDependencies: {
      ...(isTypescript ? {
        "typescript": "^4.9.5",
        "ts-node-dev": "^2.0.0",
        "@types/express": "^4.17.17",
        "@types/cors": "^2.8.13",
        "@types/node": "^18.14.0",
        ...(config.authentication ? { "@types/jsonwebtoken": "^9.0.1" } : {})
      } : {
        "nodemon": "^2.0.20"
      })
    }
  }, null, 2);
}

/**
 * Generates tsconfig.json
 */
function generateTsConfig(): string {
  return JSON.stringify({
    "compilerOptions": {
      "target": "es2018",
      "module": "commonjs",
      "outDir": "./dist",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["./**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }, null, 2);
}

/**
 * Generates route files
 */
function generateRouteFiles(config: ServerConfig, isTypescript: boolean): ServerFile[] {
  const files: ServerFile[] = [];
  const ext = isTypescript ? 'ts' : 'js';
  
  config.endpoints.forEach(endpoint => {
    const fileName = `${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}.${ext}`;
    const routePath = 'routes/';
    
    files.push({
      name: fileName,
      path: routePath,
      type: 'code',
      content: generateRouteFile(endpoint, config, isTypescript),
      language: isTypescript ? 'typescript' : 'javascript'
    });
  });
  
  return files;
}

/**
 * Generates a single route file
 */
function generateRouteFile(endpoint: any, config: ServerConfig, isTypescript: boolean): string {
  return `
${isTypescript ? 'import express, { Request, Response } from "express";' : 'const express = require("express");'}
${config.authentication ? (isTypescript ? 'import { authenticateToken } from "../middleware/auth";' : 'const { authenticateToken } = require("../middleware/auth");') : ''}

const router = express.Router();

${isTypescript && endpoint.method === 'POST' ? `
interface ${capitalize(endpoint.operationId)}Request {
  ${endpoint.parameters?.filter((p: any) => p.in === 'body').map((p: any) => `${p.name}: ${mapTypeToTypescript(p.type)};`).join('\n  ') || '// No parameters'}
}
` : ''}

/**
 * ${endpoint.summary || endpoint.description || endpoint.operationId}
 */
router.${endpoint.method.toLowerCase()}('/${endpoint.path.replace(/^\/+/, '')}', ${config.authentication ? 'authenticateToken, ' : ''}(${isTypescript ? 'req: Request, res: Response' : 'req, res'}) => {
  try {
    ${endpoint.method === 'GET' 
      ? 'const data = [{ id: "1", message: "Example response" }];\n    res.json(data);' 
      : 'res.status(201).json({ id: "1", message: "Success" });'}
  } catch (error) {
    ${isTypescript ? 'const err = error as Error;' : ''}
    res.status(500).json({ message: ${isTypescript ? 'err.message' : 'error.message'} });
  }
});

${isTypescript ? 'export default router;' : 'module.exports = router;'}
`;
}

/**
 * Generates authentication middleware
 */
function generateAuthMiddleware(config: ServerConfig, isTypescript: boolean): string {
  return `
${isTypescript ? 'import { Request, Response, NextFunction } from "express";' : ''}
${isTypescript ? 'import jwt from "jsonwebtoken";' : 'const jwt = require("jsonwebtoken");'}

${isTypescript ? `
// Extend Request type to include user property
interface AuthRequest extends Request {
  user?: any;
}
` : ''}

export const authenticateToken = (${isTypescript ? 'req: AuthRequest, res: Response, next: NextFunction' : 'req, res, next'}) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const secret = process.env.JWT_SECRET || '${config.authSecret || 'your_jwt_secret'}';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

${isTypescript ? 'export { AuthRequest };' : ''}
`;
}

/**
 * Maps OpenAPI types to TypeScript types
 */
function mapTypeToTypescript(type: string): string {
  switch (type?.toLowerCase()) {
    case 'integer': return 'number';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return 'any[]';
    case 'object': return 'Record<string, any>';
    default: return 'string';
  }
}

/**
 * Capitalizes a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates README.md
 */
function generateReadmeFile(config: ServerConfig, isTypescript: boolean): string {
  return `# ${config.name || 'API Server'}

${config.description || 'Generated API Server'}

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

### Running the Server

${isTypescript ? `
Development mode:
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm run build
npm start
\`\`\`
` : `
Development mode:
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm start
\`\`\`
`}

The API will be available at http://localhost:3000

## API Endpoints

${config.endpoints.map(endpoint => `### ${endpoint.operationId}
- Path: ${endpoint.path}
- Method: ${endpoint.method}
- Description: ${endpoint.summary || endpoint.description || ''}
`).join('\n')}

## Authentication

${config.authentication ? 'This API uses JWT authentication. To get a token, send a POST request to /login with username and password.' : 'Authentication is not enabled for this API.'}
`;
}
