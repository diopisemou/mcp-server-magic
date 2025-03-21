/**
 * Template manager for server generators
 * Provides a standardized way to manage and render templates for different languages
 */
export class TemplateManager {
  private templates: Map<string, string> = new Map();
  private language: string;
  
  /**
   * Create a new template manager for a specific language
   * @param language The programming language for the templates
   */
  constructor(language: string) {
    this.language = language.toLowerCase();
    this.loadTemplates();
  }
  
  /**
   * Load templates for the specified language
   * This method can be extended to load templates from external files
   */
  private loadTemplates(): void {
    // Load common templates
    this.registerTemplate('readme', this.getReadmeTemplate());
    this.registerTemplate('env', this.getEnvTemplate());
    
    // Load language-specific templates
    switch (this.language) {
      case 'typescript':
        this.loadTypeScriptTemplates();
        break;
      case 'python':
        this.loadPythonTemplates();
        break;
      case 'go':
        this.loadGoTemplates();
        break;
      default:
        throw new Error(`Unsupported language: ${this.language}`);
    }
  }
  
  /**
   * Register a template with a name
   * @param name Template name
   * @param template Template content
   */
  private registerTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }
  
  /**
   * Get a template by name
   * @param name Template name
   * @returns Template content or empty string if not found
   */
  getTemplate(name: string): string {
    return this.templates.get(name) || '';
  }
  
  /**
   * Render a template with context variables
   * @param name Template name
   * @param context Template context variables
   * @returns Rendered template
   */
  renderTemplate(name: string, context: Record<string, any>): string {
    const template = this.getTemplate(name);
    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }
    return this.render(template, context);
  }
  
  /**
   * Render a template string with context variables
   * @param template Template string
   * @param context Template context variables
   * @returns Rendered template
   */
  private render(template: string, context: Record<string, any>): string {
    let result = template;
    
    // Replace variables in the format {{ variable }}
    return result.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      // Handle nested properties (e.g., config.name)
      const value = this.getNestedProperty(context, trimmedKey);
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get a nested property from an object using dot notation
   * @param obj The object to get the property from
   * @param path Property path in dot notation (e.g., 'config.name')
   * @returns The property value or undefined if not found
   */
  private getNestedProperty(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }
  
  /**
   * Load TypeScript/Node.js templates
   */
  private loadTypeScriptTemplates(): void {
    this.registerTemplate('packageJson', this.getTypeScriptPackageJsonTemplate());
    this.registerTemplate('tsConfig', this.getTypeScriptTsConfigTemplate());
    this.registerTemplate('indexTs', this.getTypeScriptIndexTemplate());
    this.registerTemplate('resourceRoutes', this.getTypeScriptResourceRoutesTemplate());
    this.registerTemplate('toolRoutes', this.getTypeScriptToolRoutesTemplate());
    this.registerTemplate('auth', this.getTypeScriptAuthTemplate());
  }
  
  /**
   * Load Python templates
   */
  private loadPythonTemplates(): void {
    this.registerTemplate('requirements', this.getPythonRequirementsTemplate());
    this.registerTemplate('mainPy', this.getPythonMainTemplate());
    this.registerTemplate('resourceRoutes', this.getPythonResourceRoutesTemplate());
    this.registerTemplate('toolRoutes', this.getPythonToolRoutesTemplate());
    this.registerTemplate('auth', this.getPythonAuthTemplate());
  }
  
  /**
   * Load Go templates
   */
  private loadGoTemplates(): void {
    this.registerTemplate('goMod', this.getGoModTemplate());
    this.registerTemplate('mainGo', this.getGoMainTemplate());
    this.registerTemplate('handlersGo', this.getGoHandlersTemplate());
    this.registerTemplate('dockerfile', this.getGoDockerfileTemplate());
  }
  
  // Template definitions for different languages
  
  /**
   * README template - common for all languages
   */
  private getReadmeTemplate(): string {
    return `# {{ config.name }}

This is a Model Context Protocol (MCP) server generated by MCP Server Generator.

## Description

{{ config.description }}

## Getting Started

{{ startingInstructions }}

## Available Endpoints

{{ endpoints }}

## Authentication

{{ authenticationInfo }}
`;
  }
  
  /**
   * .env template - common for all languages
   */
  private getEnvTemplate(): string {
    return `# MCP Server Configuration
PORT={{ port }}
{{ authKey }}
{{ additionalEnvVars }}
`;
  }
  
  /**
   * TypeScript package.json template
   */
  private getTypeScriptPackageJsonTemplate(): string {
    return `{
  "name": "{{ packageName }}",
  "version": "1.0.0",
  "description": "{{ description }}",
  "main": "{{ mainFile }}",
  "type": "{{ moduleType }}",
  "scripts": {
    "start": "{{ startScript }}",
    "build": "{{ buildScript }}",
    "dev": "{{ devScript }}"
  },
  "dependencies": {
    {{ dependencies }}
  }
}`;
  }
  
  /**
   * TypeScript tsconfig.json template
   */
  private getTypeScriptTsConfigTemplate(): string {
    return `{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`;
  }
  
  /**
   * TypeScript index.ts template
   */
  private getTypeScriptIndexTemplate(): string {
    return `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resourceRoutes } from './routes/resourceRoutes';
import { toolRoutes } from './routes/toolRoutes';
{{ authImport }}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MCP Server endpoints
app.get('/', (req, res) => {
  res.json({
    name: '{{ config.name }}',
    version: '1.0.0',
    description: '{{ config.description }}',
    capabilities: {
      resources: [{{ resourcesList }}],
      tools: [{{ toolsList }}]
    }
  });
});

{{ authMiddleware }}
app.use('/mcp/resources', resourceRoutes);
app.use('/mcp/tools', toolRoutes);

app.listen(port, () => {
  console.log(\`MCP Server running at http://localhost:\${port}\`);
});`;
  }
  
  /**
   * TypeScript resource routes template
   */
  private getTypeScriptResourceRoutesTemplate(): string {
    return `import express from 'express';

const router = express.Router();

{{ resourceRoutes }}

export { router as resourceRoutes };`;
  }
  
  /**
   * TypeScript tool routes template
   */
  private getTypeScriptToolRoutesTemplate(): string {
    return `import express from 'express';

const router = express.Router();

{{ toolRoutes }}

export { router as toolRoutes };`;
  }
  
  /**
   * TypeScript auth middleware template
   */
  private getTypeScriptAuthTemplate(): string {
    return `import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = {{ apiKeySource }};
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};`;
  }
  
  /**
   * Python requirements.txt template
   */
  private getPythonRequirementsTemplate(): string {
    return `fastapi==0.103.1
uvicorn==0.23.2
python-dotenv==1.0.0
httpx==0.25.0
pydantic==2.3.0
{{ additionalRequirements }}`;
  }
  
  /**
   * Python main.py template
   */
  private getPythonMainTemplate(): string {
    return `from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
import os
from dotenv import load_dotenv

{{ authImport }}
from routes.resources import router as resource_router
from routes.tools import router as tool_router

load_dotenv()

app = FastAPI(
    title="{{ config.name }}",
    description="{{ config.description }}",
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

@app.get("/")
async def root():
    """Return information about the MCP server"""
    return {
        "name": "{{ config.name }}",
        "version": "1.0.0",
        "description": "{{ config.description }}",
        "capabilities": {
            "resources": [{{ resourcesList }}],
            "tools": [{{ toolsList }}]
        }
    }

{{ routerRegistration }}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)`;
  }
  
  /**
   * Python resource routes template
   */
  private getPythonResourceRoutesTemplate(): string {
    return `from fastapi import APIRouter, Query, HTTPException, Request, Response, Depends
from typing import Dict, Any, Optional, List

router = APIRouter()

{{ resourceRoutes }}`;
  }
  
  /**
   * Python tool routes template
   */
  private getPythonToolRoutesTemplate(): string {
    return `from fastapi import APIRouter, HTTPException, Request, Response, Depends
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

router = APIRouter()

{{ toolModels }}

{{ toolRoutes }}`;
  }
  
  /**
   * Python auth middleware template
   */
  private getPythonAuthTemplate(): string {
    return `from fastapi import Header, HTTPException, Request, Depends
import os
from typing import Optional

async def api_key_auth({{ apiKeyParam }}):
    """Validate API key for protected endpoints"""
    api_key = {{ apiKeySource }}
    expected_api_key = os.getenv("API_KEY")
    
    if not api_key or api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    return True`;
  }
  
  /**
   * Go go.mod template
   */
  private getGoModTemplate(): string {
    return `module github.com/{{ moduleName }}

go 1.21

require (
	github.com/gorilla/mux v1.8.1
	github.com/joho/godotenv v1.5.1
	github.com/rs/cors v1.10.1
)`;
  }
  
  /**
   * Go main.go template
   */
  private getGoMainTemplate(): string {
    return `package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

// ServerInfo represents information about the MCP server
type ServerInfo struct {
	Name         string   \`json:"name"\`
	Description  string   \`json:"description"\`
	Capabilities struct {
		Resources []string \`json:"resources"\`
		Tools     []string \`json:"tools"\`
	} \`json:"capabilities"\`
}

func main() {
	// Load .env file if it exists
	loadEnv()

	// Create router
	r := mux.NewRouter()

	// Get port from environment or use default
	port := getEnvWithDefault("PORT", "8080")

	// Server info
	serverInfo := ServerInfo{
		Name:        "{{ config.name }}",
		Description: "{{ config.description }}",
	}
	
	// Register capabilities
	serverInfo.Capabilities.Resources = []string{{{ resourcesList }}}
	serverInfo.Capabilities.Tools = []string{{{ toolsList }}}

	// Root endpoint returns server info
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		respondWithJSON(w, http.StatusOK, serverInfo)
	})

	// MCP Base routes
	mcpRouter := r.PathPrefix("/mcp").Subrouter()
{{ authMiddleware }}

	// MCP Resources router
	resourceRouter := mcpRouter.PathPrefix("/resources").Subrouter()
	
	// MCP Tools router
	toolRouter := mcpRouter.PathPrefix("/tools").Subrouter()

	// Register resource endpoints
{{ resourceRoutes }}

	// Register tool endpoints
{{ toolRoutes }}

	// Apply CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	handler := c.Handler(r)
	log.Printf("MCP Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":" + port, handler))
}

// Helper functions
{{ helperFunctions }}`;
  }
  
  /**
   * Go handlers.go template
   */
  private getGoHandlersTemplate(): string {
    return `package main

import (
	"encoding/json"
	"net/http"
	"github.com/gorilla/mux"
)

// Standard response format
type Response struct {
	Success bool        \`json:"success"\`
	Data    interface{} \`json:"data,omitempty"\`
	Error   string      \`json:"error,omitempty"\`
}

// Resource handlers
{{ resourceHandlers }}

// Tool handlers
{{ toolHandlers }}`;
  }
  
  /**
   * Go Dockerfile template
   */
  private getGoDockerfileTemplate(): string {
    return `FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY *.go ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o mcp-server .

# Use a minimal image for the final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/mcp-server .

# Copy .env file if it exists
COPY .env* ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["./mcp-server"]`;
  }
}
