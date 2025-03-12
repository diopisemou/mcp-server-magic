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
  ClipboardCopy,
  Settings
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
  serverUrl?: string;
  codeArchiveUrl?: string;
  downloadUrl?: string;
  error?: string;
}

const GenerateServer = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { log, logInfo, logWarning, logError } = useLogging();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfiguration | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) {
      logWarning('No projectId provided');
      setLoading(false);
      return;
    }

    try {
      logInfo(`Fetching project details for projectId: ${projectId}`);
      const { data, error } = await supabase
        .from('mcp_projects') // Fixed table name from 'projects' to 'mcp_projects'
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

      // Fetch server configuration after project data is loaded
      await fetchServerConfiguration();
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
        configName: data?.name 
      });
      setServerConfig(data);
    } catch (error) {
      logError('Failed to fetch server configuration', { 
        projectId, 
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('Error fetching server configuration:', error);
      toast.error('Failed to fetch server configuration');
    }
  };

  const handleGenerateServer = async () => {
    if (!projectId || !serverConfig) {
      toast.error('Missing project or server configuration');
      return;
    }

    try {
      setGenerationStatus('generating');
      setGenerationProgress(0);

      logInfo('Starting server generation', { 
        projectId, 
        configId: serverConfig.id 
      });

      // Simulate generation process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setGenerationProgress(Math.min(progress, 95));

        if (progress >= 95) {
          clearInterval(interval);
        }
      }, 500);

      // This would be an API call in a real application
      setTimeout(() => {
        clearInterval(interval);
        setGenerationProgress(100);
        setGenerationStatus('completed');
        setGenerationResult({
          serverUrl: 'https://example-api.replit.dev',
          downloadUrl: 'https://example-api.replit.dev/download',
          codeArchiveUrl: 'https://example-api.replit.dev/code.zip'
        });

        logInfo('Server generation completed', { 
          projectId, 
          configId: serverConfig.id,
          result: 'success'
        });
      }, 5000);
    } catch (error) {
      setGenerationStatus('failed');
      logError('Server generation failed', { 
        projectId, 
        configId: serverConfig?.id,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('Error generating server:', error);
      toast.error('Failed to generate server');
    }
  };

  const handleCopyUrl = () => {
    if (!generationResult?.serverUrl) return;

    navigator.clipboard.writeText(generationResult.serverUrl)
      .then(() => {
        toast.success('Server URL copied to clipboard');
        logInfo('Server URL copied to clipboard', { projectId });
      })
      .catch(err => {
        console.error('Error copying URL:', err);
        toast.error('Failed to copy URL');
      });
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
      logError('Failed to download code', { 
        projectId, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      );
    }

    if (!project) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>
            The requested project could not be found. Please check the URL or return to the projects list.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </Alert>
      );
    }

    if (!serverConfig) {
      return (
        <Alert>
          <Server className="h-5 w-5 mr-2" />
          <AlertTitle>No Server Configuration</AlertTitle>
          <AlertDescription>
            This project doesn't have a server configuration yet. Please create one to generate a server.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate(`/projects/${projectId}/server-config`)}
          >
            Create Server Configuration
          </Button>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Project Details</h2>
          <p className="text-muted-foreground">{project.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Server Configuration
            </CardTitle>
            <CardDescription>
              Configuration details for your API server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-sm text-muted-foreground">{serverConfig.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Language</h3>
                <p className="text-sm text-muted-foreground">{serverConfig.language}</p>
              </div>
              <div>
                <h3 className="font-medium">Authentication</h3>
                <p className="text-sm text-muted-foreground">{serverConfig.authentication_type}</p>
              </div>
              <div>
                <h3 className="font-medium">Hosting</h3>
                <p className="text-sm text-muted-foreground">
                  {serverConfig.hosting_provider} ({serverConfig.hosting_type})
                </p>
              </div>
              {serverConfig.hosting_region && (
                <div>
                  <h3 className="font-medium">Region</h3>
                  <p className="text-sm text-muted-foreground">{serverConfig.hosting_region}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/server-config/edit/${serverConfig.id}`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Configuration
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Generate API Server
            </CardTitle>
            <CardDescription>
              Create a fully functional API server based on your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generationStatus === 'idle' && (
              <div className="text-center py-6">
                <p className="mb-4 text-muted-foreground">
                  Click the button below to generate your API server. This process will:
                </p>
                <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6 max-w-md mx-auto">
                  <li className="flex">
                    <Code className="mr-2 h-4 w-4 mt-0.5" />
                    Generate server code based on your API definition
                  </li>
                  <li className="flex">
                    <Server className="mr-2 h-4 w-4 mt-0.5" />
                    Deploy the server to your selected hosting provider
                  </li>
                  <li className="flex">
                    <FileText className="mr-2 h-4 w-4 mt-0.5" />
                    Create documentation for your API endpoints
                  </li>
                </ul>
              </div>
            )}

            {generationStatus === 'generating' && (
              <div className="text-center py-6">
                <ProgressCircle
                  value={generationProgress}
                  size="large"
                  className="mx-auto mb-4"
                />
                <p className="text-muted-foreground">
                  Generating your API server... {generationProgress}%
                </p>
              </div>
            )}

            {generationStatus === 'completed' && generationResult && (
              <div className="py-4 space-y-4">
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <AlertTitle className="flex items-center text-green-800 dark:text-green-400">
                    <Server className="mr-2 h-5 w-5" />
                    Server Generated Successfully
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-500">
                    Your API server has been generated and deployed successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between px-4 py-2 border rounded-md">
                    <div className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="font-medium">Server URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {generationResult.serverUrl}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCopyUrl}
                        title="Copy URL"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-2 border rounded-md">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="font-medium">API Documentation</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`${generationResult.serverUrl}/docs`, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Docs
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {generationStatus === 'failed' && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Generation Failed</AlertTitle>
                <AlertDescription>
                  {generationResult?.error || 'There was an error generating your API server. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {generationStatus === 'idle' && (
              <Button onClick={handleGenerateServer}>
                <Server className="mr-2 h-4 w-4" />
                Generate Server
              </Button>
            )}

            {generationStatus === 'generating' && (
              <Button disabled>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </Button>
            )}

            {generationStatus === 'completed' && (
              <>
                <Button variant="outline" onClick={handleDownloadCode}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Code
                </Button>
                <Button onClick={() => setGenerationStatus('idle')}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Again
                </Button>
              </>
            )}

            {generationStatus === 'failed' && (
              <Button onClick={handleGenerateServer}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </CardFooter>
        </Card>

        <div>
          <h3 className="text-lg font-medium mb-2">Generation Logs</h3>
          <LogViewer />
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generate API Server</h1>
          <p className="text-muted-foreground">
            Generate and deploy a functional API server based on your configuration
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </div>

      <Separator />

      {renderContent()}
    </div>
  );
};

export default GenerateServer;