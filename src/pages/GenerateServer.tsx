
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Project, 
  ApiDefinition, 
  ServerConfig, 
  GenerationResult, 
  Deployment, 
  ServerFile,
  Endpoint,
  ServerConfiguration as ServerConfigurationType
} from '@/types';
import { toast } from 'sonner';
import { 
  Cog, 
  PanelRight, 
  Server, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Copy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateServer } from '@/utils/serverGenerator';
import ServerFiles from '@/components/ServerFiles';
import { convertToDeployment, convertToServerConfig } from '@/utils/typeConverters';

export default function GenerateServer() {
  const { projectId, configId } = useParams<{ projectId: string; configId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deploymentStatus, setDeploymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [deploymentFiles, setDeploymentFiles] = useState<ServerFile[]>([]);
  
  useEffect(() => {
    if (projectId && configId) {
      fetchData();
    }
  }, [projectId, configId]);
  
  useEffect(() => {
    let intervalId: number;
    
    if (deploymentId && (deploymentStatus === 'pending' || deploymentStatus === 'processing')) {
      intervalId = window.setInterval(() => {
        checkDeploymentStatus();
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deploymentId, deploymentStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
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
      
      // Fetch server config
      const { data: configData, error: configError } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('id', configId)
        .single();
      
      if (configError) {
        throw configError;
      }
      
      const convertedConfig = convertToServerConfig(configData);
      setConfig(convertedConfig);
      
      // Fetch API definition
      const { data: apiData, error: apiError } = await supabase
        .from('api_definitions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (apiError) {
        if (apiError.code !== 'PGRST116') {
          throw apiError;
        }
      } else {
        // Convert and parse API definition data
        try {
          const apiDataWithParsed = {
            ...apiData,
            parsedDefinition: tryParseContent(apiData.content),
            endpoint_definition: apiData.endpoint_definition 
              ? JSON.parse(apiData.endpoint_definition as string) 
              : []
          };
          
          setApiDefinition(apiDataWithParsed as unknown as ApiDefinition);
          
          if (apiDataWithParsed.endpoint_definition) {
            setEndpoints(apiDataWithParsed.endpoint_definition as Endpoint[]);
          }
        } catch (e) {
          console.error('Error parsing API definition:', e);
        }
      }
      
      // Fetch deployment
      const { data: deploymentData, error: deploymentError } = await supabase
        .from('deployments')
        .select('*')
        .eq('configuration_id', configId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (deploymentError) {
        throw deploymentError;
      }
      
      if (deploymentData && deploymentData.length > 0) {
        const latestDeployment = deploymentData[0];
        
        // Convert deployment status to the correct type
        const typedStatus: "pending" | "processing" | "success" | "failed" = 
          latestDeployment.status as "pending" | "processing" | "success" | "failed";
        
        // Parse files if they exist
        let filesArray: ServerFile[] = [];
        try {
          if (latestDeployment.files) {
            filesArray = typeof latestDeployment.files === 'string' 
              ? JSON.parse(latestDeployment.files) 
              : latestDeployment.files;
          }
        } catch (e) {
          console.error('Error parsing deployment files:', e);
        }
        
        const convertedDeployment = {
          ...latestDeployment,
          status: typedStatus,
          files: filesArray
        };
        
        setDeployment(convertedDeployment as Deployment);
        setDeploymentId(convertedDeployment.id);
        setDeploymentStatus(typedStatus);
        setServerUrl(convertedDeployment.server_url || null);
        
        if (filesArray.length > 0) {
          setDeploymentFiles(filesArray);
          
          if (typedStatus === 'success') {
            setGenerationResult({
              success: true,
              serverUrl: convertedDeployment.server_url,
              files: filesArray,
              parameters: [],
              responses: [],
              mcpType: 'resource'
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const tryParseContent = (content: string): any => {
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  };

  const checkDeploymentStatus = async () => {
    if (!deploymentId) return;
    
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Convert status to the right type and handle files
      const typedStatus: "pending" | "processing" | "success" | "failed" = 
        data.status as "pending" | "processing" | "success" | "failed";
      
      let filesArray: ServerFile[] = [];
      try {
        if (data.files) {
          filesArray = typeof data.files === 'string' 
            ? JSON.parse(data.files) 
            : data.files;
        }
      } catch (e) {
        console.error('Error parsing deployment files:', e);
      }
      
      const convertedDeployment = {
        ...data,
        status: typedStatus,
        files: filesArray
      };
      
      setDeployment(convertedDeployment as Deployment);
      setDeploymentStatus(typedStatus);
      
      if (data.server_url) {
        setServerUrl(data.server_url);
      }
      
      if (filesArray.length > 0) {
        setDeploymentFiles(filesArray);
      }
      
      if (typedStatus === 'success') {
        setGenerationResult({
          success: true,
          serverUrl: data.server_url,
          files: filesArray,
          parameters: [],
          responses: [],
          mcpType: 'resource'
        });
        
        setIsGenerating(false);
        toast.success('Server generated successfully!');
      } else if (typedStatus === 'failed') {
        setGenerationError('Failed to generate server');
        setIsGenerating(false);
        toast.error('Server generation failed');
      }
      
    } catch (error) {
      console.error('Error checking deployment status:', error);
    }
  };
  
  const parseEndpoints = (parsedDefinition: any): Endpoint[] => {
    // Sample code to create some example endpoints
    // This would be replaced with actual parsing logic
    const exampleEndpoints: Endpoint[] = [
      {
        id: 'get-users',
        path: '/users',
        method: 'GET',
        description: 'Get all users',
        parameters: [
          { name: 'limit', type: 'number', required: false, description: 'Number of users to return' }
        ],
        responses: [
          { statusCode: 200, description: 'Success', schema: { users: [] } }
        ],
        mcpType: 'resource',
        selected: true
      },
      {
        id: 'get-user',
        path: '/users/{id}',
        method: 'GET',
        description: 'Get a user by ID',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'User ID' }
        ],
        responses: [
          { statusCode: 200, description: 'Success', schema: { user: {} } },
          { statusCode: 404, description: 'User not found', schema: { error: 'User not found' } }
        ],
        mcpType: 'resource',
        selected: true
      }
    ];
    
    return exampleEndpoints;
  };

  const startServerGeneration = async () => {
    if (!project || !config) {
      toast.error('Project or configuration not found');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    
    try {
      // For the purposes of this file, we'll create a mock server generation
      // In a real implementation, this would call an actual API
      
      // Create a new deployment record
      const deploymentData = {
        project_id: projectId,
        configuration_id: configId,
        status: 'processing' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newDeployment, error: deploymentError } = await supabase
        .from('deployments')
        .insert(deploymentData)
        .select()
        .single();
      
      if (deploymentError) {
        throw deploymentError;
      }
      
      setDeployment(newDeployment as Deployment);
      setDeploymentId(newDeployment.id);
      setDeploymentStatus('processing');
      
      // Start checking for status updates
      checkDeploymentStatus();
      
    } catch (error) {
      console.error('Error starting server generation:', error);
      setGenerationError('Failed to start server generation');
      setIsGenerating(false);
      toast.error('Failed to start server generation');
    }
  };

  const [generationProgress, setGenerationProgress] = useState(0);
  
  // For display purposes
  const getConfigSummary = (config: ServerConfig) => {
    if (!config) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Language:</span>
          <span className="font-medium">{config.language}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Authentication:</span>
          <span className="font-medium">{config.authentication.type}</span>
        </div>
        
        {config.authentication.type !== 'None' && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Auth Location:</span>
            <span className="font-medium">{config.authentication.location}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Hosting Provider:</span>
          <span className="font-medium">{config.hosting.provider}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Hosting Type:</span>
          <span className="font-medium">{config.hosting.type}</span>
        </div>
        
        {config.hosting.region && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Region:</span>
            <span className="font-medium">{config.hosting.region}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Endpoints:</span>
          <span className="font-medium">{endpoints.length}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project || !config) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                Project or configuration not found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>The requested project or server configuration could not be found.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/projects')}>
                Back to Projects
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="grid gap-6">
          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cog className="mr-2 h-5 w-5" />
                Server Configuration
              </CardTitle>
              <CardDescription>
                Configuration details for your server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getConfigSummary(config)}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/configure`)}>
                Edit Configuration
              </Button>
            </CardFooter>
          </Card>
          
          {/* Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Server Generation
              </CardTitle>
              <CardDescription>
                Generate your MCP server based on the configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationResult ? (
                <div className="space-y-4">
                  {generationResult.success ? (
                    <>
                      <div className="flex items-center text-green-500 mb-4">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        <span>Server generated successfully!</span>
                      </div>
                      
                      {serverUrl && (
                        <div className="p-4 bg-muted rounded-md">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Server URL:</p>
                            <div className="flex items-center">
                              <code className="bg-background p-1 rounded text-sm">{serverUrl}</code>
                              <Button variant="ghost" size="sm" className="ml-2" onClick={() => {
                                navigator.clipboard.writeText(serverUrl);
                                toast.success('Server URL copied to clipboard');
                              }}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {deploymentFiles.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold mb-2">Generated Files</h3>
                          <ServerFiles files={deploymentFiles} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center text-red-500 mb-4">
                      <XCircle className="mr-2 h-5 w-5" />
                      <span>{generationError || 'Server generation failed.'}</span>
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Generating server...</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    This may take a few minutes. Please don't close this page.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Ready to generate your MCP server. Click the button below to start the process.</p>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-normal">
                      <div className="flex items-center">
                        <span className="mr-1">{config.language}</span>
                      </div>
                    </Badge>
                    
                    <Badge variant="outline" className="font-normal">
                      <div className="flex items-center">
                        <span className="mr-1">{config.authentication.type}</span>
                      </div>
                    </Badge>
                    
                    <Badge variant="outline" className="font-normal">
                      <div className="flex items-center">
                        <span className="mr-1">{config.hosting.provider}</span>
                      </div>
                    </Badge>
                    
                    <Badge variant="outline" className="font-normal">
                      <div className="flex items-center">
                        <span className="mr-1">{config.hosting.type}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {generationResult ? (
                <>
                  <Button variant="outline" onClick={() => startServerGeneration()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Server
                  </Button>
                  
                  {generationResult.success && serverUrl && (
                    <Button variant="default" onClick={() => window.open(serverUrl, '_blank')}>
                      <PanelRight className="mr-2 h-4 w-4" />
                      Open Server
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => startServerGeneration()} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Server className="mr-2 h-4 w-4" />
                      Generate Server
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
