
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { McpProject, ApiDefinitionRecord, ServerConfigRecord, Deployment } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Download, Code, Server, Play, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<McpProject | null>(null);
  const [apiDefinitions, setApiDefinitions] = useState<ApiDefinitionRecord[]>([]);
  const [serverConfigs, setServerConfigs] = useState<ServerConfigRecord[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (projectId && user) {
      fetchProjectData();
    }
  }, [projectId, user, loading, navigate]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('mcp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw projectError;
      }

      if (!projectData) {
        toast.error('Project not found');
        navigate('/dashboard');
        return;
      }

      setProject(projectData);

      // Fetch API definitions
      const { data: apiData, error: apiError } = await supabase
        .from('api_definitions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (apiError) {
        throw apiError;
      }

      setApiDefinitions(apiData || []);

      // Fetch server configurations
      const { data: configData, error: configError } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (configError) {
        throw configError;
      }

      // Cast the data to the required types
      const typedConfigData: ServerConfigRecord[] = configData?.map(config => ({
        ...config,
        language: config.language as "Python" | "TypeScript"
      })) || [];
      
      setServerConfigs(typedConfigData);

      // Fetch deployments
      const { data: deploymentData, error: deploymentError } = await supabase
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (deploymentError) {
        throw deploymentError;
      }

      // Cast the data to the required types
      const typedDeploymentData: Deployment[] = deploymentData?.map(deployment => ({
        ...deployment,
        status: deployment.status as "pending" | "success" | "failed"
      })) || [];
      
      setDeployments(typedDeploymentData);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to fetch project data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAPI = () => {
    navigate(`/import-api?projectId=${projectId}`);
  };

  const handleConfigureServer = () => {
    if (apiDefinitions.length === 0) {
      toast.error('You need to import an API definition first');
      return;
    }
    navigate(`/configure-server/${projectId}`);
  };

  const handleGenerateServer = (configId: string) => {
    navigate(`/generate-server/${projectId}/${configId}`);
  };

  const handleViewDeployment = (deploymentId: string) => {
    navigate(`/deployment/${deploymentId}`);
  };

  const handleTestServer = async (deploymentId: string) => {
    // In a real app, this would trigger a test of the deployed server
    toast.success('Test functionality would be implemented here');
  };

  const downloadServerFiles = (configId: string) => {
    navigate(`/download-server/${configId}`);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          {project?.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={handleImportAPI}>Import API</Button>
        </div>
      </div>

      <Tabs defaultValue="apis" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="apis">API Definitions</TabsTrigger>
          <TabsTrigger value="configs">Server Configurations</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="apis">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">API Definitions</h2>
              <Button onClick={handleImportAPI}>Import New API</Button>
            </div>
            
            {apiDefinitions.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Code className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No API Definitions</h3>
                <p className="text-muted-foreground mb-4">
                  Import an API definition to get started with your MCP server.
                </p>
                <Button onClick={handleImportAPI}>Import API Definition</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiDefinitions.map((api) => (
                  <Card key={api.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{api.name}</CardTitle>
                          <CardDescription>
                            Format: {api.format}
                          </CardDescription>
                        </div>
                        <Badge>{api.format}</Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        Imported on {new Date(api.created_at).toLocaleDateString()}
                      </p>
                      <Button onClick={handleConfigureServer}>Configure Server</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="configs">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Server Configurations</h2>
              <Button onClick={handleConfigureServer} disabled={apiDefinitions.length === 0}>
                New Configuration
              </Button>
            </div>
            
            {serverConfigs.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Server className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Server Configurations</h3>
                <p className="text-muted-foreground mb-4">
                  Configure your MCP server to generate code and deploy.
                </p>
                <Button onClick={handleConfigureServer} disabled={apiDefinitions.length === 0}>
                  Configure Server
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {serverConfigs.map((config) => (
                  <Card key={config.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{config.name}</CardTitle>
                          <CardDescription>
                            {config.description || 'No description provided'}
                          </CardDescription>
                        </div>
                        <Badge>{config.language}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Authentication</p>
                          <p className="text-muted-foreground">{config.authentication_type}</p>
                        </div>
                        <div>
                          <p className="font-medium">Hosting</p>
                          <p className="text-muted-foreground">
                            {config.hosting_provider} ({config.hosting_type})
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => downloadServerFiles(config.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Files
                      </Button>
                      <Button onClick={() => handleGenerateServer(config.id)}>
                        Generate Server
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deployments">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Deployments</h2>
              <Button 
                onClick={handleConfigureServer} 
                disabled={apiDefinitions.length === 0}
              >
                Configure & Deploy
              </Button>
            </div>
            
            {deployments.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Server className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Deployments</h3>
                <p className="text-muted-foreground mb-4">
                  Generate and deploy your MCP server to make it available for testing.
                </p>
                <Button 
                  onClick={handleConfigureServer}
                  disabled={apiDefinitions.length === 0}
                >
                  Configure & Deploy
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <Card key={deployment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>Deployment {deployment.id.substring(0, 8)}</CardTitle>
                        <Badge 
                          variant={
                            deployment.status === 'success' ? 'default' :
                            deployment.status === 'pending' ? 'outline' : 'destructive'
                          }
                        >
                          {deployment.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created on {new Date(deployment.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {deployment.server_url && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">Server URL:</span>
                          <a 
                            href={deployment.server_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary underline flex items-center"
                          >
                            {deployment.server_url}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewDeployment(deployment.id)}
                      >
                        View Details
                      </Button>
                      <div className="space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => fetchProjectData()}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleTestServer(deployment.id)}
                          disabled={deployment.status !== 'success'}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Test Server
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
