import type { ServerConfig, GenerationResult, ServerFile } from '../../types';

/**
 * Generates Go server files
 */
export function generateGoServer(config: ServerConfig): GenerationResult {
  const files: ServerFile[] = [];
  
  // Generate main.go
  files.push({
    name: 'main.go',
    path: '',
    type: 'code',
    content: generateMainFile(config),
    language: 'go'
  });
  
  // Generate go.mod
  files.push({
    name: 'go.mod',
    path: '',
    type: 'config',
    content: generateGoMod(config),
    language: 'go'
  });
  
  // Generate handlers directory
  generateHandlerFiles(config).forEach(file => files.push(file));
  
  // Generate middleware directory
  if (config.authentication) {
    files.push({
      name: 'auth.go',
      path: 'middleware/',
      type: 'code',
      content: generateAuthMiddleware(config),
      language: 'go'
    });
  }
  
  // Generate models directory
  generateModelFiles(config).forEach(file => files.push(file));
  
  // Generate README.md
  const readmeContent = generateReadmeFile(config);
  files.push({
    name: 'README.md',
    path: "README.md",
    content: readmeContent,
    type: "documentation",
    language: "markdown"
  });
  
  return {
    files,
    language: 'go',
    deployCommand: 'go run main.go'
  };
}

/**
 * Generates main.go file
 */
function generateMainFile(config: ServerConfig): string {
  return `
package main

import (
	"log"
	"net/http"
	${config.authentication ? `"os"` : ''}
	
	"github.com/gorilla/mux"
	${config.authentication ? `"github.com/dgrijalva/jwt-go"` : ''}
	${config.endpoints.length > 0 ? `"${config.name || 'api-server'}/handlers"` : ''}
	${config.authentication ? `"${config.name || 'api-server'}/middleware"` : ''}
)

func main() {
	r := mux.NewRouter()
	
	// Set up routes
	${config.endpoints.map(endpoint => {
    const handlerName = pascalCase(`${endpoint.method}${endpoint.path.replace(/\//g, '')}`);
    return config.authentication
      ? `r.HandleFunc("${endpoint.path}", middleware.AuthMiddleware(handlers.${handlerName})).Methods("${endpoint.method}")`
      : `r.HandleFunc("${endpoint.path}", handlers.${handlerName}).Methods("${endpoint.method}")`;
  }).join('\n\t')}
	
	${config.authentication ? `
	// Authentication route
	r.HandleFunc("/login", handlers.Login).Methods("POST")
	` : ''}
	
	// Start server
	port := ":8000"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
`;
}

/**
 * Generates go.mod file
 */
function generateGoMod(config: ServerConfig): string {
  return `
module ${config.name || 'api-server'}

go 1.18

require (
	github.com/gorilla/mux v1.8.0
	${config.authentication ? 'github.com/dgrijalva/jwt-go v3.2.0+incompatible' : ''}
	${config.database === 'mongodb' ? 'go.mongodb.org/mongo-driver v1.11.0' : ''}
	${config.database === 'postgres' ? 'github.com/lib/pq v1.10.7' : ''}
)
`;
}

/**
 * Generates handler files
 */
function generateHandlerFiles(config: ServerConfig): ServerFile[] {
  const files: ServerFile[] = [];
  
  // Base handler file
  files.push({
    name: 'handlers.go',
    path: 'handlers/',
    type: 'code',
    content: generateBaseHandlerFile(config),
    language: 'go'
  });
  
  // Generate authentication handlers if needed
  if (config.authentication) {
    files.push({
      name: 'auth.go',
      path: 'handlers/',
      type: 'code',
      content: generateAuthHandlerFile(config),
      language: 'go'
    });
  }
  
  return files;
}

/**
 * Generates base handler file
 */
function generateBaseHandlerFile(config: ServerConfig): string {
  const handlers = config.endpoints.map(endpoint => {
    const handlerName = pascalCase(`${endpoint.method}${endpoint.path.replace(/\//g, '')}`);
    return `
// ${endpoint.summary || endpoint.description || handlerName} handler
func ${handlerName}(w http.ResponseWriter, r *http.Request) {
	${endpoint.method === 'GET' ? `
	// Example response data
	data := []map[string]interface{}{
		{"id": "1", "message": "Example response"},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)` : `
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id": "1",
		"message": "Success",
	})`}
}`;
  }).join('\n\n');
  
  return `
package handlers

import (
	"encoding/json"
	"net/http"
)

${handlers}
`;
}

/**
 * Generates auth handler file
 */
function generateAuthHandlerFile(config: ServerConfig): string {
  return `
package handlers

import (
	"encoding/json"
	"net/http"
	"time
	
	"github.com/dgrijalva/jwt-go"
)

// JWT secret key
var secretKey = []byte("${config.authSecret || 'your_secret_key'}")

// Login credentials
type Credentials struct {
	Username string \`json:"username"\`
	Password string \`json:"password"\`
}

// JWT Claims
type Claims struct {
	Username string \`json:"username"\`
	jwt.StandardClaims
}

// Login handler
func Login(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	
	// In a real app, validate against database
	if creds.Username != "admin" || creds.Password != "password" {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid credentials"})
		return
	}
	
	// Set expiration time
	expirationTime := time.Now().Add(30 * time.Minute)
	
	// Create claims
	claims := &Claims{
		Username: creds.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	
	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	
	// Return token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
`;
}

/**
 * Generates auth middleware
 */
function generateAuthMiddleware(config: ServerConfig): string {
  return `
package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings
	
	"github.com/dgrijalva/jwt-go"
)

// JWT secret key
var secretKey = []byte("${config.authSecret || 'your_secret_key'}")

// JWT Claims
type Claims struct {
	Username string \`json:"username"\`
	jwt.StandardClaims
}

// Authentication middleware
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}
		
		// Extract token
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}
		
		tokenString := tokenParts[1]
		
		// Parse and validate token
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return secretKey, nil
		})
		
		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}
		
		// Add user context
		ctx := context.WithValue(r.Context(), "user", claims.Username)
		next(w, r.WithContext(ctx))
	}
}
`;
}

/**
 * Generates model files
 */
function generateModelFiles(config: ServerConfig): ServerFile[] {
  return []; // Simplified for this example
}

/**
 * Generates README.md
 */
function generateReadmeFile(config: ServerConfig): string {
  return `# ${config.name || 'API Server'}

${config.description || 'Generated API Server'}

## Getting Started

### Prerequisites

- Go 1.18+

### Installation

1. Clone the repository
2. Download dependencies:

\`\`\`bash
go mod download
\`\`\`

### Running the Server

\`\`\`bash
go run main.go
\`\`\`

The API will be available at http://localhost:8000

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

/**
 * Converts a string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .replace(/[-_/{}]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
