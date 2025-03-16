import { GenerationResult, ServerFile } from '@/types';
import { ExtendedServerConfig, DirectServerConfig } from '@/types/serverConfig';
import { BaseGenerator } from './baseGenerator';
import { TemplateManager } from './templateManager';

/**
 * Generator for Go/Gorilla Mux servers
 * Implements the standard Go server generation
 */
export class GoGenerator extends BaseGenerator {
  private templateManager: TemplateManager;
  
  constructor() {
    super();
    this.templateManager = new TemplateManager('go');
  }
  
  /**
   * Generate server files for Go
   * @param config Server configuration
   * @returns Generation result
   */
  generateServer(config: ExtendedServerConfig): GenerationResult {
    if (config.mode !== 'direct') {
      throw new Error('GoGenerator only supports direct mode. Proxy mode is not supported for Go yet.');
    }
    
    try {
      const serverFiles: ServerFile[] = [];
      const { authentication, endpoints } = config;
      
      // Add standard files
      serverFiles.push(this.generateGoMod(config));
      serverFiles.push(this.generateReadme(config));
      serverFiles.push(this.generateEnvFile(config));
      serverFiles.push(this.generateMainFile(config));
      serverFiles.push(this.generateHandlersFile(config));
      serverFiles.push(this.generateDockerfile(config));
      
      return {
        success: true,
        files: serverFiles
      };
    } catch (error) {
      console.error('Error generating Go server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating Go server'
      };
    }
  }
  
  /**
   * Generate go.mod file
   * @param config Server configuration
   * @returns ServerFile for go.mod
   */
  private generateGoMod(config: DirectServerConfig): ServerFile {
    const moduleName = config.name.toLowerCase().replace(/\s+/g, '-');
    
    const context = {
      moduleName,
      config
    };
    
    return {
      name: 'go.mod',
      path: '/',
      content: this.templateManager.renderTemplate('goMod', context),
      type: 'config',
      language: 'go'
    };
  }
  
  /**
   * Generate main.go file
   * @param config Server configuration
   * @returns ServerFile for main.go
   */
  private generateMainFile(config: DirectServerConfig): ServerFile {
    const { authentication, endpoints } = config;
    
    // Prepare resource and tool lists for server info
    const resourcesList = endpoints
      .filter(e => e.mcpType === 'resource')
      .map(e => `"${e.path}"`)
      .join(', ');
      
    const toolsList = endpoints
      .filter(e => e.mcpType === 'tool')
      .map(e => `"${e.path}"`)
      .join(', ');
    
    // Auth middleware
    const authMiddleware = authentication.type !== 'None' 
      ? '\n\t// Add authentication middleware if needed\n\tmcpRouter.Use(authMiddleware)' 
      : '';
    
    // Generate resource and tool routes
    const resourceRoutes = endpoints
      .filter(endpoint => endpoint.mcpType === 'resource' && endpoint.selected !== false)
      .map(endpoint => {
        const path = endpoint.path.replace(/\{([^}]+)\}/g, '{$1}');
        const funcName = 'handle' + this.camelize(path.replace(/\//g, '_'));
        return `\tresourceRouter.HandleFunc("${path}", ${funcName}).Methods("GET")\n`;
      }).join('');
    
    const toolRoutes = endpoints
      .filter(endpoint => endpoint.mcpType === 'tool' && endpoint.selected !== false)
      .map(endpoint => {
        const path = endpoint.path.replace(/\{([^}]+)\}/g, '{$1}');
        const funcName = 'handle' + this.camelize(path.replace(/\//g, '_'));
        return `\ttoolRouter.HandleFunc("${path}", ${funcName}).Methods("${endpoint.method}")\n`;
      }).join('');
    
    // Helper functions
    const helperFunctions = this.generateGoHelperFunctions(authentication);
    
    const context = {
      config,
      resourcesList,
      toolsList,
      authMiddleware,
      resourceRoutes,
      toolRoutes,
      helperFunctions
    };
    
    return {
      name: 'main.go',
      path: '/',
      content: this.templateManager.renderTemplate('mainGo', context),
      type: 'code',
      language: 'go'
    };
  }
  
  /**
   * Generate handlers.go file
   * @param config Server configuration
   * @returns ServerFile for handlers.go
   */
  private generateHandlersFile(config: DirectServerConfig): ServerFile {
    const { endpoints } = config;
    
    // Generate resource handlers
    const resourceHandlers = endpoints
      .filter(endpoint => endpoint.mcpType === 'resource' && endpoint.selected !== false)
      .map(endpoint => {
        const path = endpoint.path;
        const funcName = 'handle' + this.camelize(path.replace(/\//g, '_'));
        const pathParams = this.extractPathParams(path);
        
        return `
// ${endpoint.description || 'Handler for ' + path}
func ${funcName}(w http.ResponseWriter, r *http.Request) {
	// Get path parameters
	vars := mux.Vars(r)
${pathParams.map(param => `\t${param} := vars["${param}"]`).join('\n')}
	
	// Get query parameters${endpoint.parameters
    .filter(param => !pathParams.includes(param.name) && param.required)
    .map(param => `
	${param.name} := r.URL.Query().Get("${param.name}")
	if ${param.name} == "" {
		http.Error(w, "Missing required parameter: ${param.name}", http.StatusBadRequest)
		return
	}`).join('')}
	
	// Return sample response
	response := Response{
		Success: true,
		Data: map[string]interface{}{
			"resourceId": "${path}",${pathParams.length ? `
			"params": map[string]string{
				${pathParams.map(param => `"${param}": ${param}`).join(',\n\t\t\t\t')}
			},` : ''}
			// TODO: Add your resource data here
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": "Sample resource data for ${path}",
				},
			},
		},
	}
	
	respondWithJSON(w, http.StatusOK, response)
}`;
      }).join('\n');
    
    // Generate tool handlers
    const toolHandlers = endpoints
      .filter(endpoint => endpoint.mcpType === 'tool' && endpoint.selected !== false)
      .map(endpoint => {
        const path = endpoint.path;
        const funcName = 'handle' + this.camelize(path.replace(/\//g, '_'));
        const pathParams = this.extractPathParams(path);
        
        return `
// ${endpoint.description || 'Handler for ' + path}
func ${funcName}(w http.ResponseWriter, r *http.Request) {
	// Get path parameters
	vars := mux.Vars(r)
${pathParams.map(param => `\t${param} := vars["${param}"]`).join('\n')}
	
	// Parse request body
	var requestData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil && r.ContentLength > 0 {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Return sample response
	response := Response{
		Success: true,
		Data: map[string]interface{}{
			"toolId": "${path}",${pathParams.length ? `
			"params": map[string]string{
				${pathParams.map(param => `"${param}": ${param}`).join(',\n\t\t\t\t')}
			},` : ''}
			"requestData": requestData,
			// TODO: Add your tool result data here
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": "Sample tool result for ${path}",
				},
			},
		},
	}
	
	respondWithJSON(w, http.StatusOK, response)
}`;
      }).join('\n');
    
    const context = {
      resourceHandlers,
      toolHandlers,
      config
    };
    
    return {
      name: 'handlers.go',
      path: '/',
      content: this.templateManager.renderTemplate('handlersGo', context),
      type: 'code',
      language: 'go'
    };
  }
  
  /**
   * Generate Dockerfile
   * @param config Server configuration
   * @returns ServerFile for Dockerfile
   */
  private generateDockerfile(config: DirectServerConfig): ServerFile {
    return {
      name: 'Dockerfile',
      path: '/',
      content: this.templateManager.renderTemplate('dockerfile', {}),
      type: 'config',
      language: 'docker'
    };
  }
  
  /**
   * Generate Go helper functions
   * @param authentication Authentication configuration
   * @returns Helper functions as string
   */
  private generateGoHelperFunctions(authentication: { type: string, location?: string, name?: string }): string {
    let helpers = `
// Helper function to load .env file
func loadEnv() {
	// Find .env file
	env := ".env"
	if _, err := os.Stat(env); os.IsNotExist(err) {
		// Try to look in parent directory
		parent := filepath.Join("..", ".env")
		if _, err := os.Stat(parent); err == nil {
			env = parent
		} else {
			log.Println("No .env file found, using environment variables")
			return
		}
	}

	// Load .env file
	err := godotenv.Load(env)
	if err != nil {
		log.Printf("Error loading .env file: %v", err)
	} else {
		log.Printf("Loaded environment from %s", env)
	}
}

// Helper function to get environment variable with default
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper function to respond with JSON
func respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	// Convert payload to JSON
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Write(response)
}`;

    // Add auth middleware if needed
    if (authentication.type !== 'None') {
      helpers += `

// Authentication middleware
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var authValue string
		${authentication.location === 'header' 
          ? `// Get API key from header
		authHeader := r.Header.Get("${authentication.name || 'X-Api-Key'}")
		if strings.HasPrefix(authHeader, "Bearer ") {
			authValue = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			authValue = authHeader
		}`
          : `// Get API key from query parameter
		authValue = r.URL.Query().Get("${authentication.name || 'api_key'}")`}
		
		expectedKey := os.Getenv("API_KEY")
		if expectedKey == "" {
			log.Println("Warning: API_KEY environment variable not set")
			next.ServeHTTP(w, r)
			return
		}
		
		if authValue == "" || authValue != expectedKey {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}`;
    }
    
    return helpers;
  }
  
  /**
   * Extract path parameters from a path
   * @param path Path string
   * @returns Array of parameter names
   */
  private extractPathParams(path: string): string[] {
    const params: string[] = [];
    const regex = /\{([^}]+)\}/g;
    let match;
    
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    
    return params;
  }
  
  /**
   * Camelize a string (convert to CamelCase)
   * @param str Input string
   * @returns Camelized string
   */
  private camelize(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toUpperCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
  
  /**
   * Get a list of features supported by this generator
   * @returns Array of supported feature strings
   */
  getSupportedFeatures(): string[] {
    return [
      ...super.getSupportedFeatures(),
      'go',
      'gorilla-mux',
      'json',
      'godotenv'
    ];
  }
}
