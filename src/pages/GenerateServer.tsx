import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Terminal, 
  Code, 
  Server, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  FileText,
  ClipboardCopy 
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';

// Data and Integrations
import { supabase } from '@/integrations/supabase/client';
import { useLogging } from '@/contexts/LogContext';
import LogViewer from '@/components/LogViewer';
import { Endpoint, ServerConfiguration, Project } from '@/types';

interface GenerationResult {
  success?: boolean;
  serverUrl?: string;
  codeArchiveUrl?: string;
  downloadUrl?: string;
  error?: string;
  deploymentId?: string;
  apiKey?: string;
  timestamp?: string;
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
          // No configuration found - this is a "not found" error from PostgREST
          logWarning('No server configuration found for project', { projectId });
          return;
        } else {
          logError('Error fetching server configuration', { 
            projectId, 
            error: error.message,
            code: error.code 
          });
          throw error;
        }
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
    if (!projectId || !serverConfiguration) {
      logWarning('Cannot generate server without project ID or server configuration');
      toast.error('Project or server configuration not found');
      return;
    }

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
            downloadUrl: 'https://download.example.com/server-code.zip',
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

  return (
    <div className="container max-w-4xl py-8 relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            Generate and deploy your server based on the API configuration
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
          Back to Project
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!serverConfiguration && (
            <Card>
              <CardHeader>
                <CardTitle>Server Configuration Required</CardTitle>
                <CardDescription>
                  You need to configure your server before you can generate it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Server configuration includes the framework, authentication methods, and endpoint definitions.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate(`/projects/${projectId}/configure-server`)}>
                  Configure Server
                </Button>
              </CardFooter>
            </Card>
          )}

          {serverConfiguration && !generationResult && !isGenerating && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Server Configuration</CardTitle>
                    <CardDescription>
                      Your API server is ready to be generated
                    </CardDescription>
                  </div>
                  <Badge>{serverConfiguration.language || 'Unknown'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Framework</h4>
                    <p className="text-sm text-muted-foreground">
                      {serverConfiguration.framework || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      {serverConfiguration.authentication_type || 'None'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Endpoints</h4>
                    <p className="text-sm text-muted-foreground">
                      {serverConfiguration.endpoints?.length || 0} defined endpoints
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateServer} className="w-full">
                  <Server className="mr-2 h-4 w-4" />
                  Generate & Deploy Server
                </Button>
              </CardFooter>
            </Card>
          )}

          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle>Generating Server</CardTitle>
                <CardDescription>
                  Please wait while we generate and deploy your server
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <ProgressCircle value={generationProgress} size="large" />
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {generationProgress < 30 && "Initializing server generation..."}
                  {generationProgress >= 30 && generationProgress < 60 && "Building server code..."}
                  {generationProgress >= 60 && generationProgress < 90 && "Deploying server..."}
                  {generationProgress >= 90 && "Finalizing deployment..."}
                </p>
              </CardContent>
            </Card>
          )}

          {generationResult && !isGenerating && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {generationResult.success ? 'Server Generated Successfully' : 'Server Generation Failed'}
                    </CardTitle>
                    <CardDescription>
                      {generationResult.success 
                        ? 'Your server has been generated and deployed' 
                        : 'There was an error generating your server'}
                    </CardDescription>
                  </div>
                  {generationResult.success && (
                    <Badge variant="outline" className="bg-green-50">
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generationResult.success ? (
                  <div className="space-y-4">
                    {generationResult.serverUrl && (
                      <div>
                        <h4 className="font-medium flex items-center">
                          Server URL
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 ml-2"
                            onClick={() => {
                              navigator.clipboard.writeText(generationResult.serverUrl || '');
                              toast.success('Server URL copied to clipboard');
                            }}
                          >
                            <ClipboardCopy className="h-3 w-3" />
                          </Button>
                        </h4>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          {generationResult.serverUrl}
                        </p>
                      </div>
                    )}

                    {generationResult.apiKey && (
                      <div>
                        <h4 className="font-medium flex items-center">
                          API Key
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 ml-2"
                            onClick={() => {
                              navigator.clipboard.writeText(generationResult.apiKey || '');
                              toast.success('API Key copied to clipboard');
                            }}
                          >
                            <ClipboardCopy className="h-3 w-3" />
                          </Button>
                        </h4>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          {generationResult.apiKey}
                        </p>
                      </div>
                    )}

                    {generationResult.deploymentId && (
                      <div>
                        <h4 className="font-medium">Deployment ID</h4>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          {generationResult.deploymentId}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>
                      {generationResult.error || 'An unknown error occurred during server generation'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                {generationResult.success ? (
                  <div className="w-full space-y-2">
                    <Button 
                      onClick={handleTestServer} 
                      className="w-full"
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Test Server
                    </Button>

                    <Button 
                      onClick={handleDownloadCode} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Code
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleRestart} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Server Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Project</h4>
                  <p className="text-sm">{project.name}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Language</h4>
                  <p className="text-sm">{serverConfiguration?.language || 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Framework</h4>
                  <p className="text-sm">{serverConfiguration?.framework || 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Created At</h4>
                  <p className="text-sm">
                    {serverConfiguration?.created_at 
                      ? new Date(serverConfiguration.created_at).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  Learn more about your generated server and how to use it:
                </p>

                <div className="space-y-2">
                  <Button variant="link" className="h-auto p-0" onClick={() => navigate('/docs/server-generation')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Server Generation Guide
                  </Button>

                  <Button variant="link" className="h-auto p-0" onClick={() => navigate('/docs/deployment')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Deployment Instructions
                  </Button>

                  <Button variant="link" className="h-auto p-0" onClick={() => navigate('/docs/api-integration')}>
                    <FileText className="mr-2 h-4 w-4" />
                    API Integration Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showLogs && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-end">
          <div className="fixed inset-x-0 bottom-0 h-1/2 bg-background border-t">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium flex items-center">
                <Terminal className="mr-2 h-4 w-4" />
                Server Generation Logs
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLogs(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 h-[calc(100%-61px)] overflow-auto">
              <LogViewer filter={`projectId:${projectId}`} />
            </div>
          </div>
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
};

export default GenerateServer;