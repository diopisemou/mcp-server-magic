
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ServerConfigRecord, ApiDefinitionRecord, McpProject, Endpoint, ServerConfig, GenerationResult } from '@/types';
import GenerationResultComponent from '@/components/GenerationResult';
import ServerConfigDisplay from '@/components/ServerConfigDisplay';
import ServerPreview from '@/components/ServerPreview';
import ServerGenerationSection from '@/components/ServerGenerationSection';
import { parseApiDefinition } from '@/utils/apiParsingUtils';

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
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

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

      // Cast the data to the required type
      const typedConfig: ServerConfigRecord = {
        ...configData,
        language: configData.language as "Python" | "TypeScript",
        authentication_details: configData.authentication_details as Record<string, any>
      };
      
      setConfig(typedConfig);

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
        toast.warning('No API definition found for this project');
      } else {
        setApiDefinition(apiData);
        
        // Parse endpoints from API definition
        const extractedEndpoints = parseApiDefinition(apiData);
        setEndpoints(extractedEndpoints);
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
        
        // If there's a successful deployment, create a generation result
        if (deploymentData.status === 'success' && deploymentData.server_url) {
          setGenerationResult({
            success: true,
            serverUrl: deploymentData.server_url,
            files: [
              {
                name: 'mcp_server.py',
                path: '/src/',
                content: '# Generated MCP Server Code',
                type: 'code'
              }
            ]
          });
        } else if (deploymentData.status === 'failed') {
          setGenerationResult({
            success: false,
            error: deploymentData.logs || 'Deployment failed'
          });
        }
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
          location: config.authentication_details?.location,
          name: config.authentication_details?.name,
          value: config.authentication_details?.value
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
          
          // Create a successful generation result
          setGenerationResult({
            success: true,
            serverUrl: demoServerUrl,
            files: [
              {
                name: 'mcp_server.py',
                path: '/src/',
                content: `# Example MCP Server Code for ${config.name}
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
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
                type: 'code'
              },
              {
                name: 'requirements.txt',
                path: '/',
                content: `fastapi==0.95.0
uvicorn==0.22.0
pydantic==2.0.0
mcp-server==1.0.0`,
                type: 'config'
              },
              {
                name: 'README.md',
                path: '/',
                content: `# ${config.name}

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

${endpoints.map(endpoint => `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description || 'No description'}`).join('\n')}`,
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
      }, 3000); // Simulate a 3-second generation process
    } catch (error) {
      console.error('Error generating server:', error);
      setGenerationError('Failed to start server generation');
      setIsGenerating(false);
      
      // Create a failed generation result
      setGenerationResult({
        success: false,
        error: 'Failed to start server generation'
      });
    }
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
  
  // If we have a generation result, show the GenerationResult component
  if (generationResult) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MCP Server Generation</h1>
          <Button variant="outline" onClick={() => navigate(`/project/${projectId}`)}>
            Back to Project
          </Button>
        </div>
        <GenerationResultComponent result={generationResult} onRestart={handleRestart} />
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
            <ServerConfigDisplay config={config} />
            <ServerGenerationSection
              serverUrl={serverUrl}
              isGenerating={isGenerating}
              error={generationError}
              config={config}
              apiDefinition={apiDefinition}
              endpoints={endpoints}
              onGenerateServer={generateServer}
              onDownloadCode={downloadServerCode}
              onTestServer={testServer}
            />
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <ServerPreview
            endpoints={endpoints}
            serverUrl={serverUrl}
            isGenerating={isGenerating}
            config={config}
            onGenerateServer={generateServer}
            onDownloadCode={downloadServerCode}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerateServer;
