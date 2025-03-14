import type {
  GenerationResult,
  ServerConfig,
  ServerFile,
} from "../types/server";

export const generateServer = async (
  config: ServerConfig,
): Promise<GenerationResult> => {
  // In a real application, this would be a more sophisticated code generator
  // or would call an API to generate the server code

  const { language, framework, apiDefinition } = config;

  // Use the endpoint_definition from apiDefinition
  const endpoints = apiDefinition.endpoint_definition ||
    apiDefinition.endpoints || [];

  // Only generate code for selected endpoints
  const selectedEndpoints = endpoints.filter((endpoint: any) =>
    endpoint.selected !== false
  );

  let files: ServerFile[] = [];

  if (language === "typescript" && framework === "express") {
    files = generateTypescriptExpressServer(selectedEndpoints, config);
  } else if (language === "python" && framework === "fastapi") {
    files = generatePythonFastAPIServer(selectedEndpoints, config);
  }

  try {
    console.log("Generating MCP server with config:", config);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      serverUrl: `https://mcp-${
        config.name.toLowerCase().replace(/\s+/g, "-")
      }.example.com`,
      files,
    };
  } catch (error) {
    console.error("Error generating server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

function generateTypescriptExpressServer(
  endpoints: any[],
  config: ServerConfig,
): ServerFile[] {
  const files: ServerFile[] = [];

  // package.json
  files.push({
    path: "package.json",
    content: `{
  "name": "mcp-generated-server",
  "version": "1.0.0",
  "description": "Generated API server",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"${
      config.database === "mongodb" ? ',\n    "mongoose": "^7.0.3"' : ""
    }${config.database === "postgres" ? ',\n    "pg": "^8.10.0"' : ""}${
      config.authentication
        ? ',\n    "jsonwebtoken": "^9.0.0",\n    "bcrypt": "^5.1.0"'
        : ""
    }
  },
  "devDependencies": {
    "typescript": "^5.0.4",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/node": "^18.15.11"${
      config.database === "postgres" ? ',\n    "@types/pg": "^8.6.6"' : ""
    }${
      config.authentication
        ? ',\n    "@types/jsonwebtoken": "^9.0.1",\n    "@types/bcrypt": "^5.0.0"'
        : ""
    }
  }
}`,
    language: "json",
  });

  // tsconfig.json
  files.push({
    path: "tsconfig.json",
    content: `{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}`,
    language: "json",
  });

  // Main app file
  files.push({
    path: "src/index.ts",
    content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
${config.database === "mongodb" ? "import mongoose from 'mongoose';" : ""}${
      config.database === "postgres" ? "import { Pool } from 'pg';" : ""
    }

// Import routes
${
      endpoints.map((endpoint, index) =>
        `import ${
          endpoint.path.replace(/\//g, "").replace(/-/g, "_")
        }Routes from './routes${endpoint.path}';`
      ).join("\n")
    }

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

${
      config.database === "mongodb"
        ? `
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-server')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
`
        : ""
    }

${
      config.database === "postgres"
        ? `
// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mcp-server',
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));
`
        : ""
    }

// Routes
${
      endpoints.map((endpoint) =>
        `app.use('${endpoint.path}', ${
          endpoint.path.replace(/\//g, "").replace(/-/g, "_")
        }Routes);`
      ).join("\n")
    }

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
    language: "typescript",
  });

  // Create route files for each endpoint
  endpoints.forEach((endpoint) => {
    const routePath = `src/routes${endpoint.path}.ts`;
    const controllerPath = `src/controllers${endpoint.path}.ts`;

    // Route file
    files.push({
      path: routePath,
      content: `import express from 'express';
import * as ${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      }Controller from '../controllers${endpoint.path}';
${
        config.authentication
          ? "import { authenticateToken } from '../middleware/auth';"
          : ""
      }

const router = express.Router();

/**
 * @route ${endpoint.method} ${endpoint.path}
 * @description ${endpoint.description || "Endpoint for " + endpoint.path}
 */
router.${endpoint.method.toLowerCase()}('/', ${
        config.authentication ? "authenticateToken, " : ""
      }${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      }Controller.${endpoint.method.toLowerCase()}${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      });

export default router;`,
      language: "typescript",
    });

    // Controller file
    files.push({
      path: controllerPath,
      content: `import { Request, Response } from 'express';

/**
 * ${endpoint.description || "Handler for " + endpoint.path}
 */
export const ${endpoint.method.toLowerCase()}${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      } = async (req: Request, res: Response) => {
  try {
    // Implementation for ${endpoint.method} ${endpoint.path}
    ${
        endpoint.method === "GET"
          ? `
    // Sample response data
    const data = {
      message: 'Success',
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };

    return res.status(200).json(data);`
          : ""
      }
    ${
        endpoint.method === "POST"
          ? `
    // Sample request handling
    const { name, value } = req.body;

    // Validate request
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Process request
    const result = {
      id: Date.now(),
      name,
      value,
      created: new Date().toISOString()
    };

    return res.status(201).json(result);`
          : ""
      }
    ${
        endpoint.method === "PUT"
          ? `
    // Sample update handling
    const { id } = req.params;
    const { name, value } = req.body;

    // Validate request
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    // Process update
    const updated = {
      id,
      name,
      value,
      updated: new Date().toISOString()
    };

    return res.status(200).json(updated);`
          : ""
      }
    ${
        endpoint.method === "DELETE"
          ? `
    // Sample delete handling
    const { id } = req.params;

    // Validate request
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    // Process deletion
    return res.status(200).json({ message: 'Resource deleted successfully' });`
          : ""
      }
  } catch (error) {
    console.error('Error in ${endpoint.method.toLowerCase()}${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      }:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};`,
      language: "typescript",
    });
  });

  // Add authentication middleware if needed
  if (config.authentication) {
    files.push({
      path: "src/middleware/auth.ts",
      content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};`,
      language: "typescript",
    });
  }

  return files;
}

function generatePythonFastAPIServer(
  endpoints: any[],
  config: ServerConfig,
): ServerFile[] {
  const files: ServerFile[] = [];

  // requirements.txt
  files.push({
    path: "requirements.txt",
    content: `fastapi>=0.95.1
uvicorn>=0.22.0
pydantic>=1.10.7
python-dotenv>=1.0.0${config.database === "mongodb" ? "\npymongo>=4.3.3" : ""}${
      config.database === "postgres"
        ? "\npsycopg2-binary>=2.9.6\nsqlalchemy>=2.0.0"
        : ""
    }${
      config.authentication
        ? "\npython-jose>=3.3.0\npasslib>=1.7.4\nbcrypt>=4.0.1"
        : ""
    }`,
    language: "text",
  });

  // Main app file
  files.push({
    path: "main.py",
    content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
${config.database === "mongodb" ? "from pymongo import MongoClient" : ""}
${
      config.database === "postgres"
        ? "from sqlalchemy import create_engine\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import sessionmaker"
        : ""
    }

# Import routes
${
      endpoints.map((endpoint) =>
        `from routes.${
          endpoint.path.replace(/\//g, "").replace(/-/g, "_")
        } import router as ${
          endpoint.path.replace(/\//g, "").replace(/-/g, "_")
        }_router`
      ).join("\n")
    }

# Load environment variables
load_dotenv()

app = FastAPI(
    title="MCP Generated API",
    description="Generated FastAPI server",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

${
      config.database === "mongodb"
        ? `
# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["mcp_server"]
`
        : ""
    }

${
      config.database === "postgres"
        ? `
# PostgreSQL connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mcp-server")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create database tables
Base.metadata.create_all(bind=engine)
`
        : ""
    }

# Register routes
${
      endpoints.map((endpoint) =>
        `app.include_router(${
          endpoint.path.replace(/\//g, "").replace(/-/g, "_")
        }_router, prefix="${endpoint.path}", tags=["${
          endpoint.path.replace(/\//g, "").replace(/-/g, " ").trim()
        }"])`
      ).join("\n")
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`,
    language: "python",
  });

  // Create routes directory
  files.push({
    path: "routes/__init__.py",
    content: "",
    language: "python",
  });

  // Create route files for each endpoint
  endpoints.forEach((endpoint) => {
    const routePath = `routes/${
      endpoint.path.replace(/\//g, "").replace(/-/g, "_")
    }.py`;

    files.push({
      path: routePath,
      content: `from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
${config.authentication ? "from dependencies.auth import get_current_user" : ""}

router = APIRouter()

${
        endpoint.method === "POST" || endpoint.method === "PUT"
          ? `
class ${
            endpoint.path.replace(/\//g, "").replace(/-/g, "_").charAt(0)
              .toUpperCase() +
            endpoint.path.replace(/\//g, "").replace(/-/g, "_").slice(1)
          }Request(BaseModel):
    name: str
    value: Optional[str] = None
`
          : ""
      }

class ${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_").charAt(0)
          .toUpperCase() +
        endpoint.path.replace(/\//g, "").replace(/-/g, "_").slice(1)
      }Response(BaseModel):
    id: int
    name: str
    value: Optional[str] = None

@router.${endpoint.method.toLowerCase()}("/")
async def ${endpoint.method.toLowerCase()}_${
        endpoint.path.replace(/\//g, "").replace(/-/g, "_")
      }(
    ${
        endpoint.method === "POST" || endpoint.method === "PUT"
          ? `request: ${
            endpoint.path.replace(/\//g, "").replace(/-/g, "_").charAt(0)
              .toUpperCase() +
            endpoint.path.replace(/\//g, "").replace(/-/g, "_").slice(1)
          }Request`
          : ""
      }
    ${
        config.authentication
          ? `${
            endpoint.method === "POST" || endpoint.method === "PUT" ? "," : ""
          }user = Depends(get_current_user)`
          : ""
      }
):
    """
    ${
        endpoint.description ||
        endpoint.path.replace(/\//g, " ").trim() + " endpoint"
      }
    """
    ${
        endpoint.method === "GET"
          ? `
    # Sample data
    items = [
        {"id": 1, "name": "Item 1", "value": "Value 1"},
        {"id": 2, "name": "Item 2", "value": "Value 2"}
    ]

    return items`
          : ""
      }
    ${
        endpoint.method === "POST"
          ? `
    # Process the request
    new_item = {
        "id": 3,  # In a real app, this would be generated
        "name": request.name,
        "value": request.value
    }

    return new_item`
          : ""
      }
    ${
        endpoint.method === "PUT"
          ? `
    # Update an item
    updated_item = {
        "id": 1,  # In a real app, this would be from the route parameter
        "name": request.name,
        "value": request.value
    }

    return updated_item`
          : ""
      }
    ${
        endpoint.method === "DELETE"
          ? `
    # Delete an item
    # In a real app, you would use a path parameter for the ID

    return {"message": "Item deleted successfully"}`
          : ""
      }`,
      language: "python",
    });
  });

  // Add authentication dependencies if needed
  if (config.authentication) {
    files.push({
      path: "dependencies/__init__.py",
      content: "",
      language: "python",
    });

    files.push({
      path: "dependencies/auth.py",
      content: `from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In a real app, these would be in environment variables
SECRET_KEY = os.getenv("JWT_SECRET", "your_jwt_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return {"username": username}
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = verify_token(token)
    if user is None:
        raise credentials_exception

    return user`,
      language: "python",
    });
  }

  return files;
}

export default {
  generateServer,
};
