import { ServerConfig, ServerFile } from '@/types';

export function generateNodeServer(config: ServerConfig): ServerFile[] {
  const { name, description, language, authentication, database, framework } = config;
  const authType = authentication.type;
  const authName = authentication.name || 'Authorization';
  const authLocation = authentication.location || 'header';
  const useMongo = database === 'mongodb';
  const usePostgres = database === 'postgres';
  const isTypescript = language === 'TypeScript';

  const srcExtension = isTypescript ? 'ts' : 'js';

  const dependencies = [
    'express',
    'cors',
    'morgan',
    'helmet',
  ];

  const devDependencies = [
    '@types/express',
    '@types/cors',
    '@types/morgan',
    '@types/node',
    'nodemon',
    'ts-node',
    'typescript',
  ];

  if (useMongo) {
    dependencies.push('mongoose');
  }

  if (usePostgres) {
    dependencies.push('pg', 'sequelize');
  }

  if (authType === 'Bearer Token' || authType === 'API Key' || authType === 'Basic Auth') {
    dependencies.push('jsonwebtoken');
    devDependencies.push('@types/jsonwebtoken');
  }

  const packageJsonContent = `{
  "name": "${name.toLowerCase().replace(/ /g, '-')}",
  "version": "1.0.0",
  "description": "${description}",
  "main": "src/index.${srcExtension}",
  "scripts": {
    "dev": "nodemon src/index.${srcExtension}",
    "start": "node dist/index.js",
    "build": "tsc",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    ${dependencies.map(dep => `"${dep}": "latest"`).join(',\n    ')}
  },
  "devDependencies": {
    ${devDependencies.map(dep => `"${dep}": "latest"`).join(',\n    ')}
  }
}`;

  const indexContent = isTypescript ? `import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MCP Server is running!');
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
` : `const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MCP Server is running!');
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
`;

  const tsconfigContent = `{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`;

  const readmeContent = `# ${name}

## Description
${description}

## Technologies Used
- Express.js
- CORS
- Morgan
- Helmet
- [Add more as needed]

## Getting Started
1. Clone the repository
2. Install dependencies: \`npm install\`
3. Run the server: \`npm run dev\`
`;

  return [
    {
      path: "package.json",
      content: packageJsonContent,
      type: "config"
    },
    {
      path: `src/index.${srcExtension}`,
      content: indexContent,
      type: "code",
      language: isTypescript ? "typescript" : "javascript"
    },
    {
      path: "tsconfig.json",
      content: tsconfigContent,
      type: "config",
      language: "json"
    },
    {
      path: "README.md",
      content: readmeContent,
      type: "documentation",
      language: "markdown"
    }
  ];
}
