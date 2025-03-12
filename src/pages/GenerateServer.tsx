
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ServerConfigRecord, ApiDefinitionRecord, McpProject, Endpoint, ServerConfig } from '@/types';
import { Download, ExternalLink, Code } from 'lucide-react';
import GenerationResult from '@/components/GenerationResult';

const GenerateServer = () => {
  const { projectId, configId } = useParams<{ projectId: string; configId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ServerConfigRecord | null>(null);
  const [project, setProject] = useState<McpProject | null>(null);
  const [apiDefinition, setApiDefinition] = useState<ApiDefinitionRecord | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (projectId && configId && user) {
      fetchData();
    }
  }, [projectId, configId, user, loading, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch server configuration
      const { data: configData, error: configError } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('id', configId)
        .single();

      if (configError) {
        throw configError;
      }

      if (!configData) {
        toast.error('Server configuration not found');
        navigate(`/project/${projectId}`);
        return;
      }

      setConfig(configData);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('mcp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw projectError;
      }

      setProject(projectData);

      // Fetch API definition
      const { data: apiData, error: apiError } = await supabase
        .from('api_definitions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (apiError) {
        console.error('Error fetching API definition:', apiError);
        // Don't throw here, we'll just show a warning
        toast.warning('No API definition found for this project');
      } else {
        setApiDefinition(apiData);
        
        // Parse endpoints from API definition content
        if (apiData) {
          try {
            const parsedContent = JSON.parse(apiData.content);
            if (parsedContent.parsedDefinition && parsedContent.parsedDefinition.paths) {
              const extractedEndpoints: Endpoint[] = [];
              
              Object.entries(parsedContent.parsedDefinition.paths).forEach(([path, methods]: [string, any]) => {
                Object.entries(methods).forEach(([method, details]: [string, any]) => {
                  if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                    extractedEndpoints.push({
                      path,
                      method: method.toUpperCase() as any,
                      description: details.summary || details.description || '',
                      parameters: details.parameters?.map((p: any) => ({
                        name: p.name,
                        type: p.schema?.type || p.type || 'string',
                        required: !!p.required,
                        description: p.description || ''
                      })) || [],
                      responses: Object.entries(details.responses || {}).map(([code, res]: [string, any]) => ({
                        statusCode: parseInt(code, 10),
                        description: res.description || '',
                        schema: res.schema || res.content
                      })),
                      mcpType: method.toLowerCase() === 'get' ? 'resource' : 'tool'
                    });
                  }
                });
              });
              
              setEndpoints(extractedEndpoints);
            }
          } catch (error) {
            console.error('Error parsing API definition:', error);
            toast.error('Failed to parse API definition');
          }
        }
      }

      // Check if there's an existing deployment
      const { data: deploymentData, error: deploymentError } = await supabase
        .from('deployments')
        .select('*')
        .eq('configuration_id', configId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (deploymentError && deploymentError.code !== 'PGRST116') {
        console.error('Error fetching deployment:', deploymentError);
      } else if (deploymentData) {
        setDeploymentId(deploymentData.id);
        setServerUrl(deploymentData.server_url || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch server configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const generateServer = async () => {
    if (!config || !project) {
      toast.error('Missing required configuration');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      // Create a new deployment record
      const { data: deploymentData, error: deploymentError } = await supabase
        .from('deployments')
        .insert([
          {
            project_id: projectId,
            configuration_id: configId,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (deploymentError) {
        throw deploymentError;
      }

      setDeploymentId(deploymentData.id);
      
      // Convert server config to the format expected by the server generation function
      const serverConfig: ServerConfig = {
        name: config.name,
        description: config.description || '',
        language: config.language,
        authentication: {
          type: config.authentication_type as any,
          ...config.authentication_details
        },
        hosting: {
          provider: config.hosting_provider as any,
          type: config.hosting_type as any,
          region: config.hosting_region
        },
        endpoints: endpoints
      };
      
      // Call the server generation function (simulated)
      // In a real app, this would call an API to generate the server code
      setTimeout(async () => {
        try {
          // Generate a random server URL for demo purposes
          const demoServerUrl = `https://mcp-server-${Math.random().toString(36).substring(2, 10)}.example.com`;
          
          // Update the deployment status
          const { error: updateError } = await supabase
            .from('deployments')
            .update({
              status: 'success',
              server_url: demoServerUrl
            })
            .eq('id', deploymentData.id);

          if (updateError) {
            throw updateError;
          }

          setServerUrl(demoServerUrl);
          toast.success('Server generated and deployed successfully');
        } catch (error) {
          console.error('Error updating deployment:', error);
          setGenerationError('Failed to update deployment status');
          
          // Update deployment to failed status
          await supabase
            .from('deployments')
            .update({
              status: 'failed',
              logs: JSON.stringify(error)
            })
            .eq('id', deploymentData.id);
        } finally {
          setIsGenerating(false);
        }
      }, 3000); // Simulate a 3-second generation process
    } catch (error) {
      console.error('Error generating server:', error);
      setGenerationError('Failed to start server generation');
      setIsGenerating(false);
    }
  };

  const downloadServerCode = () => {
    // In a real app, this would download the generated server code
    toast.success('Download functionality would be implemented here');
  };

  const testServer = () => {
    // In a real app, this would open a test interface for the server
    if (serverUrl) {
      window.open(serverUrl, '_blank');
    } else {
      toast.error('No server URL available');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Generating MCP Server...</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Generate MCP Server</h1>
          <p className="text-muted-foreground mt-1">
            Project: {project?.name} | Configuration: {config?.name}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate(`/project/${projectId}`)}>
            Back to Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Server Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p>{config?.name}</p>
              </div>
              
              {config?.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p>{config.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Language</h3>
                <p>{config?.language}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Authentication</h3>
                <p>{config?.authentication_type}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Hosting</h3>
                <p>{config?.hosting_provider} ({config?.hosting_type})</p>
                {config?.hosting_region && <p className="text-sm text-muted-foreground">Region: {config.hosting_region}</p>}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">API Definition</h3>
                <p>{apiDefinition?.name || 'No API definition available'}</p>
                <p className="text-sm text-muted-foreground">Format: {apiDefinition?.format}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Endpoints</h3>
                <p>{endpoints.length} endpoints configured</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t space-y-4">
              {!serverUrl && !isGenerating && (
                <Button 
                  onClick={generateServer} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  Generate & Deploy Server
                </Button>
              )}
              
              {isGenerating && (
                <div className="text-center space-y-2">
                  <div className="animate-pulse">Generating server...</div>
                  <p className="text-sm text-muted-foreground">
                    This may take a few minutes
                  </p>
                </div>
              )}
              
              {serverUrl && !isGenerating && (
                <>
                  <Button 
                    onClick={downloadServerCode} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Server Code
                  </Button>
                  <Button 
                    onClick={testServer}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Test Server
                  </Button>
                </>
              )}
              
              {generationError && (
                <div className="text-red-500 text-sm mt-2">
                  Error: {generationError}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="result">
            <TabsList>
              <TabsTrigger value="result">Generation Result</TabsTrigger>
              <TabsTrigger value="code">Server Code</TabsTrigger>
              <TabsTrigger value="endpoints">Configured Endpoints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="result" className="p-4 border rounded-md mt-4">
              <GenerationResult 
                isGenerating={isGenerating}
                serverUrl={serverUrl}
                deploymentId={deploymentId}
                error={generationError}
              />
            </TabsContent>
            
            <TabsContent value="code" className="p-4 border rounded-md mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Generated Server Code</h3>
                  <Button variant="outline" size="sm" onClick={downloadServerCode}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                {serverUrl ? (
                  <div className="bg-gray-50 p-4 rounded-md border overflow-auto max-h-[500px]">
                    <pre className="text-sm">
                      <code>
{`# Example MCP Server Code for ${config?.name}
from mcp_server import MCPServer
from fastapi import FastAPI, HTTPException

app = FastAPI()
server = MCPServer(app)

# Configuration
server.set_name("${config?.name}")
server.set_description("${config?.description || 'MCP Server for API integration'}")

# Authentication
auth_config = {
    "type": "${config?.authentication_type}",
    ${config?.authentication_details ? JSON.stringify(config.authentication_details, null, 2) : ''}
}
server.configure_auth(auth_config)

# Endpoints
${endpoints.map(endpoint => `
@server.${endpoint.mcpType}("${endpoint.path}")
async def ${endpoint.path.replace(/[^\w]/g, '_').toLowerCase()}(${endpoint.parameters.map(p => `${p.name}: ${p.type}${p.required ? '' : ' = None'}`).join(', ')}):
    """${endpoint.description}"""
    # Implementation
    return {"message": "This endpoint would call your API"}
`).join('\n')}

# Start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Code Generated Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate the server to see the code
                    </p>
                    <Button onClick={generateServer} disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'Generate Server'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="endpoints" className="p-4 border rounded-md mt-4">
              <h3 className="text-lg font-medium mb-4">Configured Endpoints</h3>
              
              {endpoints.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No endpoints configured
                </p>
              ) : (
                <div className="space-y-4">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded mr-2 ${
                              endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                              endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                              endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {endpoint.method}
                            </span>
                            <span className="font-mono text-sm">{endpoint.path}</span>
                          </div>
                          {endpoint.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {endpoint.description}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          endpoint.mcpType === 'resource' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {endpoint.mcpType}
                        </span>
                      </div>
                      
                      {endpoint.parameters.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Parameters</h4>
                          <div className="text-sm space-y-1">
                            {endpoint.parameters.map((param, idx) => (
                              <div key={idx} className="flex">
                                <span className="font-mono mr-2">{param.name}</span>
                                <span className="text-muted-foreground mr-2">({param.type})</span>
                                {param.required && (
                                  <span className="text-red-500 text-xs">required</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GenerateServer;
