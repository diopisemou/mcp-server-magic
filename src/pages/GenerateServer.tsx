import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Terminal, Code, Server, RefreshCw, Download, ExternalLink, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Endpoint, ServerConfiguration, Project, GenerationResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { clientLogger } from '@/lib/logger';
import { useLogging } from '@/contexts/LogContext';
import LogViewer from '@/components/LogViewer';

import { 
  Card, CardHeader, CardTitle, CardDescription, 
  CardContent, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LogViewer } from "@/components/LogViewer";
import { Terminal, Download, ExternalLink, ClipboardCopy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLogging } from "@/contexts/LogContext";

interface Project {
  id: string;
  name: string;
  description: string;
  // Add other project fields as needed
}

interface ServerConfiguration {
  id: string;
  project_id: string;
  // Add other configuration fields as needed
}

interface GenerationResult {
  serverUrl?: string;
  codeArchiveUrl?: string;
  downloadUrl?: string;
  error?: string;
}

const GenerateServer = () => { 
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { logInfo, logError, logWarning, logDebug } = useLogging();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [serverConfiguration, setServerConfiguration] = useState<ServerConfiguration | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    logInfo(`Initializing GenerateServer page for projectId: ${projectId}`);
    fetchProject();
    fetchServerConfiguration();
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) {
      logWarning('No projectId provided');
      setLoading(false);
      return;
    }

    try {
      logInfo(`Fetching project data for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        logError('Error fetching project', { 
          projectId, 
          error: error.message,
          code: error.code 
        });
        throw error;
      }

      logInfo('Project fetched successfully', { 
        projectId, 
        projectName: data.name 
      });
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServerConfiguration = async () => {
    if (!projectId) {
      logWarning('No projectId provided for server configuration');
      return;
    }

    try {
      logInfo(`Fetching server configuration for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        logError('Error fetching server configuration', { 
          projectId, 
          error: error.message,
          code: error.code 
        });
        throw error;
      }

      if (data) {
        logInfo('Server configuration fetched successfully', { configId: data.id });
        setServerConfiguration(data);
      } else {
        logInfo('No server configuration found for project', { projectId });
      }
    } catch (error) {
      console.error('Error fetching server configuration:', error);
      toast.error('Failed to load server configuration');
    }
  };

  const fetchServerConfiguration = async () => {
    if (!projectId) {
      logWarning('No projectId provided for server configuration');
      return;
    }

    try {
      logInfo(`Fetching server configuration for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found is okay
          logInfo('No server configuration found for this project');
          return;
        }

        logError('Error fetching server configuration', { 
          projectId, 
          error: error.message,
          code: error.code 
        });
        throw error;
      }

      logInfo('Server configuration fetched successfully');
      setServerConfiguration(data);
    } catch (error) {
      logError('Failed to load server configuration', { error });
      toast.error('Failed to load server configuration');
    }
  };

  const generateServer = async () => {
    if (!project || !serverConfiguration) {
      logError('Cannot generate server: missing project or configuration');
      toast.error('Project or server configuration not found');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);

    try {
      logInfo('Starting server generation', { projectId, configId: serverConfiguration.id });

      // Mock progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 1000);

      // Make API call to generate server
      const response = await fetch('/api/generate-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          configId: serverConfiguration.id
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate server');
      }

      const result = await response.json();
      logInfo('Server generation completed successfully', { result });

      setGenerationProgress(100);
      setGenerationResult(result);
    } catch (error) {
      logError('Server generation failed', { error });
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to generate server');
    } finally {
      setIsGenerating(false);
    }
  };


  useEffect(() => {
    if (isGenerating) {
      logInfo('Server generation started', { projectId });
      const interval = setInterval(() => {
        // Mock progress increase
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const fetchProject = async () => {
    try {
      logDebug(`Fetching project details for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        logError('Error fetching project', { 
          projectId, 
          error: error.message,
          code: error.code 
        });
        throw error;
      }

      logInfo('Project fetched successfully', { 
        projectId, 
        projectName: data?.name 
      });
      setProject(data);
    } catch (error) {
      logError('Failed to fetch project', { 
        projectId, 
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('Error fetching project:', error);
      toast.error('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchServerConfiguration = async () => {
    try {
      logDebug(`Fetching server configuration for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('server_configurations')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found - this is a "not found" error from PostgREST
          logWarning('No server configuration found for project', { projectId });
        } else {
          logError('Error fetching server configuration', { 
            projectId, 
            error: error.message,
            code: error.code 
          });
        }
        throw error;
      }

      logInfo('Server configuration fetched successfully', { 
        projectId, 
        configId: data?.id,
        framework: data?.framework,
        endpointCount: data?.endpoints?.length || 0
      });
      setServerConfiguration(data);
    } catch (error) {
      // Don't show a toast here since this might be a new project without a configuration
      console.error('Error fetching server configuration:', error);
    }
  };

  const generateServer = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);

    try {
      logInfo('Starting server generation process', { 
        projectId,
        configId: serverConfiguration?.id
      });

      // Mock server generation for demo purposes
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% chance of success for demo

        if (success) {
          const result = {
            success: true,
            serverUrl: 'https://api-demo.example.com',
            deploymentId: 'dep_' + Math.random().toString(36).substring(2, 10),
            apiKey: 'sk_' + Math.random().toString(36).substring(2, 15),
            timestamp: new Date().toISOString()
          };

          logInfo('Server generated successfully', {
            projectId,
            deploymentId: result.deploymentId,
            serverUrl: result.serverUrl
          });

          setGenerationResult(result);
          toast.success('Server generated successfully!');
        } else {
          const errorMessage = 'Failed to generate server due to an unexpected error';
          logError('Server generation failed', {
            projectId,
            error: errorMessage
          });

          setGenerationError(errorMessage);
          setGenerationResult({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString()
          });

          toast.error('Server generation failed');
        }

        setGenerationProgress(100);
        setTimeout(() => {
          setIsGenerating(false);
        }, 3000);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Exception during server generation', {
        projectId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      console.error('Error generating server:', error);
      setGenerationError('Failed to start server generation');
      setIsGenerating(false);

      // Create a failed generation result
      setGenerationResult({
        success: false,
        error: 'Failed to start server generation',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleDownloadCode = async () => {
    if (!generationResult?.downloadUrl && !generationResult?.codeArchiveUrl) {
      toast.error('No code archive available for download');
      return;
    }
    
    try {
      const downloadUrl = generationResult.downloadUrl || generationResult.codeArchiveUrl;
      logInfo('Downloading server code', { 
        projectId, 
        downloadUrl 
      });
      
      // Directly trigger download for the archive URL
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading code:', error);
      toast.error('Failed to download code');
    }
  };
  
  const handleRestart = () => {
    logInfo('Restarting server generation', { projectId });
    setGenerationResult(null);
    setGenerationError(null);
    generateServer();
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid gap-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!project) {
    logWarning('Attempted to access non-existent project', { projectId });
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>
            The requested project does not exist or you don't have access to it.
            <div className="mt-4">
              <Button onClick={() => navigate('/projects')}>
                Back to Projects
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const generateServer = async () => {
    if (!projectId || !serverConfiguration) {
      logWarning('Cannot generate server without project ID or server configuration');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    
    try {
      logInfo('Starting server generation', { 
        projectId, 
        serverConfigId: serverConfiguration.id 
      });
      
      // Mock progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1500);
      
      // Call your API endpoint for server generation
      const response = await fetch('/api/servers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          serverConfigId: serverConfiguration.id
        }),
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate server');
      }
      
      const result = await response.json();
      logInfo('Server generation completed successfully', { 
        serverUrl: result.serverUrl 
      });
      
      setGenerationProgress(100);
      setGenerationResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logError('Server generation failed', { error: errorMessage });
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!serverConfiguration) {
    logWarning('Server configuration not found for project', { 
      projectId, 
      projectName: project?.name 
    });
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTitle>Configuration Not Found</AlertTitle>
          <AlertDescription>
            The server configuration could not be found. Please check the logs.
            <div className="mt-4">
              <Button 
                onClick={() => navigate(`/projects/${projectId}/configure-server`)}
                className="mr-2"
              >
                Configure Server
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLogs(prev => !prev)}
              >
                {showLogs ? 'Hide Logs' : 'View Logs'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {showLogs && (
          <div className="mt-6">
            <LogViewer />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Generate your server based on the configured endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowLogs(prev => !prev)}
          >
            {showLogs ? 'Hide Logs' : 'View Logs'}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
            Back to Project
          </Button>
        </div>
      </div>

      {showLogs && (
        <div className="mb-6">
          <LogViewer />
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Server className="h-5 w-5" /> Server Configuration
              </CardTitle>
              <CardDescription>
                Review your server configuration before generating
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {serverConfiguration.framework}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Base Path</h3>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {serverConfiguration.basePath || '/api'}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Endpoints</h3>
              <div className="grid gap-2">
                {serverConfiguration.endpoints && serverConfiguration.endpoints.length > 0 ? (
                  serverConfiguration.endpoints.map((endpoint: Endpoint, index: number) => (
                    <div key={index} className="bg-muted p-2 rounded flex items-start gap-2">
                      <Badge variant="outline" className="uppercase text-xs">
                        {endpoint.method}
                      </Badge>
                      <div className="font-mono text-sm">{endpoint.path}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No endpoints configured</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50">
          <div className="space-y-4 w-full">
            {generationResult ? (
              <div className="space-y-4">
                {generationResult.success ? (
                  <Alert className="bg-green-500/10 border-green-500 text-green-700">
                    <Server className="h-4 w-4" />
                    <AlertTitle>Server Generated Successfully</AlertTitle>
                    <AlertDescription>
                      Your server has been generated and deployed.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>
                      {generationResult.error || 'An error occurred during server generation.'}
                    </AlertDescription>
                  </Alert>
                )}

                {generationResult.success && (
                  <div className="grid gap-2">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border p-2">
                      <div>
                        <p className="font-medium">Server URL</p>
                        <p className="text-sm font-mono">{generationResult.serverUrl}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          window.open(generationResult.serverUrl, '_blank');
                          logInfo('User opened server URL', {
                            projectId,
                            serverUrl: generationResult.serverUrl
                          });
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border p-2">
                      <div>
                        <p className="font-medium">API Key</p>
                        <p className="text-sm font-mono">{generationResult.apiKey}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          navigator.clipboard.writeText(generationResult.apiKey || '');
                          toast.success('API key copied to clipboard');
                          logInfo('User copied API key', { projectId });
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleRestart}
                  variant={generationResult.success ? "outline" : "default"}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {generationResult.success ? 'Regenerate Server' : 'Try Again'}
                </Button>
              </div>
            ) : isGenerating ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <ProgressCircle />
                  <p className="text-center font-medium">Generating your server...</p>
                  <p className="text-center text-sm text-muted-foreground">
                    This may take a few minutes
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={generateServer}
                disabled={isGenerating}
              >
                <Terminal className="mr-2 h-4 w-4" />
                Generate Server
              </Button>
            )}

            {generationError && !generationResult && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}

            {showLogs && (
              <div className="mt-4">
                <LogViewer />
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {generationResult && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Result</CardTitle>
              <CardDescription>
                Your server has been generated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Server URL</h3>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted p-2 rounded flex-1 overflow-hidden overflow-ellipsis">
                      {generationResult.serverUrl || 'No URL available'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (generationResult.serverUrl) {
                          navigator.clipboard.writeText(generationResult.serverUrl);
                          toast.success('URL copied to clipboard');
                        }
                      }}
                      disabled={!generationResult.serverUrl}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Actions</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (generationResult.serverUrl) {
                          window.open(generationResult.serverUrl, '_blank');
                        }
                      }}
                      disabled={!generationResult.serverUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Server
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (generationResult.downloadUrl) {
                          window.open(generationResult.downloadUrl, '_blank');
                        }
                      }}
                      disabled={!generationResult.downloadUrl}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="fixed bottom-4 right-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? 'Hide Logs' : 'Show Logs'}
        </Button>
      </div>
    </div>
  );
  
  const handleTestServer = () => {
    if (!generationResult?.serverUrl) {
      toast.error('No server URL available for testing');
      return;
    }
    
    logInfo('Testing generated server', { 
      projectId, 
      serverUrl: generationResult.serverUrl 
    });
    
    // Open the server URL in a new tab
    window.open(generationResult.serverUrl, '_blank');
  };
};

export default GenerateServer;