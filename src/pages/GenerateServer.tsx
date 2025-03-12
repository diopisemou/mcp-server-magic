import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { Terminal, Code, Server, RefreshCw, Download, ExternalLink, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Endpoint, ServerConfiguration, Project, GenerationResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ProgressCircle } from '@/components/ui/progress-circle'; // Added import
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const GenerateServer: React.FC = () => {
  const { projectId, configId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<ServerConfiguration | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load the project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Load the configuration details
        const { data: configData, error: configError } = await supabase
          .from('server_configurations')
          .select('*')
          .eq('id', configId)
          .single();

        if (configError) throw configError;
        setConfig(configData);

        // Load the endpoints
        const { data: endpointsData, error: endpointsError } = await supabase
          .from('endpoints')
          .select('*')
          .eq('server_configuration_id', configId)
          .order('created_at', { ascending: true });

        if (endpointsError) throw endpointsError;
        setEndpoints(endpointsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load server configuration');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && configId) {
      loadData();
    }
  }, [projectId, configId]);

  // Helper functions to handle server generation
  const handleGenerateServer = async () => {
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

      // Simulate server generation (3-second delay)
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

          // Create a successful generation result
          setGenerationResult({
            success: true,
            serverUrl: demoServerUrl,
            files: [
              {
                name: 'mcp_server.py',
                path: '/src/',
                content: generateServerCode(config, endpoints),
                type: 'code'
              },
              {
                name: 'requirements.txt',
                path: '/',
                content: generateRequirementsFile(),
                type: 'config'
              },
              {
                name: 'README.md',
                path: '/',
                content: generateReadme(config, endpoints),
                type: 'documentation'
              }
            ]
          });

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

          // Create a failed generation result
          setGenerationResult({
            success: false,
            error: 'Failed to update deployment status'
          });
        } finally {
          setIsGenerating(false);
        }
      }, 3000);
    })
      .catch((error) => {
        console.error('Error generating server:', error);
        setGenerationError('Failed to start server generation');
        setIsGenerating(false);

        // Create a failed generation result
        setGenerationResult({
          success: false,
          error: 'Failed to start server generation'
        });
      });
  };

  const handleRestart = () => {
    setGenerationResult(null);
    setServerUrl(null);
    setDeploymentId(null);
    setGenerationError(null);
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

  // Helper functions for generating server code, requirements file, and readme
  function generateServerCode(config, endpoints) {
    return `# Example MCP Server Code for ${config.name}
from mcp_server import MCPServer
from fastapi import FastAPI, HTTPException

app = FastAPI()
server = MCPServer(app)

# Configuration
server.set_name("${config.name}")
server.set_description("${config.description || 'MCP Server for API integration'}")

# Authentication
auth_config = {
    "type": "${config.authentication_type}",
    ${config.authentication_details ? JSON.stringify(config.authentication_details, null, 2) : ''}
}
server.configure_auth(auth_config)

# Endpoints
${endpoints.map(endpoint => `
@server.${endpoint.mcpType}("${endpoint.path}")
async def ${endpoint.path.replace(/[^\w]/g, '_').toLowerCase()}(${endpoint.parameters.map(p => `${p.name}: ${p.type}${p.required ? '' : ' = None'}`).join(', ')}):
    """${endpoint.description || ''}"""
    # Implementation
    return {"message": "This endpoint would call your API"}
`).join('\n')}

# Start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`;
  }

  function generateRequirementsFile() {
    return `fastapi==0.95.0
uvicorn==0.22.0
pydantic==2.0.0
mcp-server==1.0.0`;
  }

  function generateReadme(config, endpoints) {
    return `# ${config.name}

This MCP server was generated by the MCP Server Generator.

## Setup

1. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

2. Run the server:
   \`\`\`
   python src/mcp_server.py
   \`\`\`

3. The server will be available at \`http://localhost:8000\`

## Authentication

This server uses ${config.authentication_type} authentication.

## Endpoints

${endpoints.map(endpoint => `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description || 'No description'}`).join('\n')}`;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="w-1/3 h-8 mb-4" />
        <Skeleton className="w-full h-[400px]" />
      </div>
    );
  }

  if (!config || !project) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Configuration Not Found</AlertTitle>
          <AlertDescription>
            The server configuration could not be found.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{config.name}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </div>

      <Separator className="my-6" />

      {generationResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {generationResult.success ? (
                <>
                  <Server className="mr-2 h-5 w-5 text-green-500" />
                  Server Generated Successfully
                </>
              ) : (
                <>
                  <Terminal className="mr-2 h-5 w-5 text-red-500" />
                  Server Generation Failed
                </>
              )}
            </CardTitle>
            <CardDescription>
              {generationResult.success
                ? `Your MCP server has been generated and deployed to ${generationResult.serverUrl}`
                : `Error: ${generationResult.error}`}
            </CardDescription>
          </CardHeader>

          {generationResult.success && (
            <CardContent>
              <Tabs defaultValue="files">
                <TabsList className="mb-4">
                  <TabsTrigger value="files">Generated Files</TabsTrigger>
                  <TabsTrigger value="deployment">Deployment</TabsTrigger>
                </TabsList>

                <TabsContent value="files">
                  <div className="space-y-4">
                    {generationResult.files.map((file) => (
                      <div key={file.name} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            {file.type === 'code' && <Code className="mr-2 h-4 w-4" />}
                            {file.type === 'config' && <Terminal className="mr-2 h-4 w-4" />}
                            {file.type === 'documentation' && <FileText className="mr-2 h-4 w-4" />}
                            <span className="font-mono text-sm">{file.path}{file.name}</span>
                          </div>
                          <Badge variant={file.type === 'code' ? "default" : "outline"}>
                            {file.type}
                          </Badge>
                        </div>
                        <pre className="bg-muted p-2 rounded-md overflow-auto max-h-60 text-xs">
                          <code>{file.content}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="deployment">
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Deployment URL</h3>
                      <div className="flex items-center">
                        <code className="bg-background p-2 rounded border flex-grow">
                          {generationResult.serverUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(generationResult.serverUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Deployment Status</h3>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleRestart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart
            </Button>

            {generationResult.success && (
              <div className="space-x-2">
                <Button variant="outline" onClick={downloadServerCode}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={testServer}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test Server
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generate MCP Server</CardTitle>
            <CardDescription>
              Generate and deploy an MCP server based on your configuration.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="col-span-2">{config.name}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Authentication:</span>
                    <span className="col-span-2">{config.authentication_type}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Framework:</span>
                    <span className="col-span-2">{config.framework}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Endpoints</h3>
                <div className="space-y-2 text-sm">
                  {endpoints.length === 0 ? (
                    <p className="text-muted-foreground">No endpoints configured</p>
                  ) : (
                    endpoints.map((endpoint) => (
                      <div key={endpoint.id} className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {endpoint.method}
                        </Badge>
                        <code className="text-xs">{endpoint.path}</code>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {generationError && (
              <Alert variant="destructive">
                <AlertTitle>Generation Error</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleGenerateServer} // Updated function call
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <ProgressCircle className="mr-2" />
                  Generating Server...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Generate Server
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default GenerateServer;