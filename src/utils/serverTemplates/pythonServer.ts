
import type { ServerConfig, GenerationResult, ServerFile } from '../../types';

/**
 * Generates Python server files
 */
export function generatePythonServer(config: ServerConfig): GenerationResult {
  const files: ServerFile[] = [];
  
  // Generate main.py
  files.push({
    name: 'main.py',
    path: '',
    type: 'code',
    content: generateMainFile(config),
    language: 'python'
  });
  
  // Generate requirements.txt
  files.push({
    name: 'requirements.txt',
    path: '',
    type: 'config',
    content: generateRequirementsFile(config),
    language: 'text'
  });
  
  // Generate dependencies directory
  if (config.authentication) {
    files.push({
      name: '__init__.py',
      path: 'dependencies/',
      type: 'code',
      content: '',
      language: 'python'
    });
    
    files.push({
      name: 'auth.py',
      path: 'dependencies/',
      type: 'code',
      content: generateAuthDependencyFile(config),
      language: 'python'
    });
  }
  
  // Generate route files
  generateRouteFiles(config).forEach(file => files.push(file));
  
  // Generate model files
  generateModelFiles(config).forEach(file => files.push(file));
  
  // Generate documentation
  files.push({
    name: 'README.md',
    path: '',
    type: 'docs',
    content: generateReadmeFile(config),
    language: 'markdown'
  });
  
  return {
    files,
    language: 'python',
    deployCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000'
  };
}

/**
 * Generates the main.py file
 */
function generateMainFile(config: ServerConfig): string {
  return `
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
${config.authentication ? 'from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm' : ''}
${config.authentication ? 'import jwt' : ''}
${config.authentication ? 'from datetime import datetime, timedelta' : ''}
${config.authentication ? 'from typing import Optional' : ''}
import uvicorn

# Import route modules
${config.endpoints.map(endpoint => {
  const moduleName = endpoint.path.replace(/\//g, '').replace(/-/g, '_');
  return `from routes import ${moduleName}`;
}).join('\n')}

app = FastAPI(
    title="${config.name || 'API Server'}",
    description="${config.description || 'Generated API Server'}",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

${config.authentication ? `
# Authentication settings
SECRET_KEY = "${config.authSecret || 'your-secret-key'}"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Add token endpoint
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # In a real application, validate credentials against a database
    if form_data.username != "admin" or form_data.password != "password":
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
` : ''}

# Include routers
${config.endpoints.map(endpoint => {
  const moduleName = endpoint.path.replace(/\//g, '').replace(/-/g, '_');
  return `app.include_router(${moduleName}.router${endpoint.path ? `, prefix="${endpoint.path}"` : ''})`;
}).join('\n')}

# Run if executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`;
}

/**
 * Generates requirements.txt file
 */
function generateRequirementsFile(config: ServerConfig): string {
  return `
fastapi>=0.68.0
uvicorn>=0.15.0
pydantic>=1.8.2
${config.authentication ? 'python-jose[cryptography]>=3.3.0' : ''}
${config.authentication ? 'python-multipart>=0.0.5' : ''}
${config.database === 'mongodb' ? 'motor>=2.5.1' : ''}
${config.database === 'postgres' ? 'sqlalchemy>=1.4.23' : ''}
${config.database === 'postgres' ? 'psycopg2-binary>=2.9.1' : ''}
`.trim();
}

/**
 * Generates authentication dependency file
 */
function generateAuthDependencyFile(config: ServerConfig): string {
  return `
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import Optional

# Authentication settings
SECRET_KEY = "${config.authSecret || 'your-secret-key'}"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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

    return user
`;
}

/**
 * Generates route files
 */
function generateRouteFiles(config: ServerConfig): ServerFile[] {
  const files: ServerFile[] = [];
  
  // Add __init__.py for routes package
  files.push({
    name: '__init__.py',
    path: 'routes/',
    type: 'code',
    content: '',
    language: 'python'
  });
  
  // Generate a route file for each endpoint
  config.endpoints.forEach(endpoint => {
    const fileName = `${endpoint.path.replace(/\//g, '').replace(/-/g, '_')}.py`;
    const routePath = `routes/`;
    
    files.push({
      name: fileName,
      path: routePath,
      type: 'code',
      content: generateRouteFile(endpoint, config),
      language: 'python'
    });
  });
  
  return files;
}

/**
 * Generates a single route file
 */
function generateRouteFile(endpoint: any, config: ServerConfig): string {
  const needsRequestModel = endpoint.method === 'POST' || endpoint.method === 'PUT';
  const modelName = endpoint.operationId.charAt(0).toUpperCase() + endpoint.operationId.slice(1);
  
  return `
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
${config.authentication ? 'from dependencies.auth import get_current_user' : ''}

router = APIRouter()

${needsRequestModel ? `
class ${modelName}Request(BaseModel):
    ${endpoint.parameters?.filter((p: any) => p.in === 'body').map((p: any) => `${p.name}: ${mapTypeToModel(p.type)}`).join('\n    ') || 'pass'}
` : ''}

class ${modelName}Response(BaseModel):
    id: str
    ${endpoint.responses?.[0]?.schema?.properties ? 
      Object.entries(endpoint.responses[0].schema.properties)
        .map(([name, prop]: [string, any]) => `${name}: ${mapTypeToModel(prop.type)}`)
        .join('\n    ') 
      : 'message: str'}

@router.${endpoint.method.toLowerCase()}("${endpoint.path.replace(/^\/+/, '')}"${endpoint.method === 'GET' ? ', response_model=List[' + modelName + 'Response]' : ', response_model=' + modelName + 'Response'}${config.authentication ? ', dependencies=[Depends(get_current_user)]' : ''})
async def ${endpoint.operationId}(${generateFunctionParameters(endpoint, needsRequestModel, modelName)}):
    """
    ${endpoint.summary || endpoint.description || endpoint.operationId}
    """
    # This is where you would implement your business logic
    ${endpoint.method === 'GET' ? 'return [{"id": "1", "message": "Example response"}]' : 'return {"id": "1", "message": "Success"}'}
`;
}

/**
 * Generates function parameters for route handlers
 */
function generateFunctionParameters(endpoint: any, needsRequestModel: boolean, modelName: string): string {
  const pathParams = endpoint.parameters
    ?.filter((p: any) => p.in === 'path')
    .map((p: any) => `${p.name}: ${mapTypeToModel(p.type)}`)
    .join(', ');
  
  const queryParams = endpoint.parameters
    ?.filter((p: any) => p.in === 'query')
    .map((p: any) => `${p.name}: ${mapTypeToModel(p.type)}${p.required ? '' : ' = None'}`)
    .join(', ');
  
  const bodyParam = needsRequestModel ? `request: ${modelName}Request` : '';
  
  const allParams = [pathParams, queryParams, bodyParam].filter(Boolean).join(', ');
  
  return allParams;
}

/**
 * Maps OpenAPI types to Python/Pydantic types
 */
function mapTypeToModel(type: string): string {
  switch (type?.toLowerCase()) {
    case 'integer': return 'int';
    case 'number': return 'float';
    case 'boolean': return 'bool';
    case 'array': return 'List[str]';
    case 'object': return 'dict';
    default: return 'str';
  }
}

/**
 * Generates model files
 */
function generateModelFiles(config: ServerConfig): ServerFile[] {
  return []; // Simplified for this example; would need additional logic for real model files
}

/**
 * Generates README.md
 */
function generateReadmeFile(config: ServerConfig): string {
  return `# ${config.name || 'API Server'}

${config.description || 'Generated API Server'}

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Running the Server

\`\`\`bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

The API will be available at http://localhost:8000

Documentation will be available at http://localhost:8000/docs

## API Endpoints

${config.endpoints.map(endpoint => `### ${endpoint.operationId}
- Path: ${endpoint.path}
- Method: ${endpoint.method}
- Description: ${endpoint.summary || endpoint.description || ''}
`).join('\n')}

## Authentication

${config.authentication ? 'This API uses JWT authentication. To get a token, send a POST request to /token with username and password.' : 'Authentication is not enabled for this API.'}
`;
}
