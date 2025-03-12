
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Terminal, Code, Server, RefreshCw, Download, ExternalLink, FileText, Edit, Docker } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import LogViewer from '@/components/LogViewer';
import ServerPreview from '@/components/ServerPreview';
import EndpointsList from '@/components/EndpointsList';
import ApiDefinitionEditor from '@/components/ApiDefinitionEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const GenerateServer = () => {
  const { projectId, configId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [serverConfig, setServerConfig] = useState(null);
  const [apiDefinition, setApiDefinition] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [serverUrl, setServerUrl] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState('idle');
  const [deploymentUrl, setDeploymentUrl] = useState(null);
  const [showApiEditor, setShowApiEditor] = useState(false);
  const [createDockerImage, setCreateDockerImage] = useState(false);
  const [activeTab, setActiveTab] = useState('generation');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('mcp_projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (projectError) throw projectError;
        setProject(projectData);
        
        // Fetch server config
        const { data: configData, error: configError } = await supabase
          .from('mcp_server_configs')
          .select('*')
          .eq('id', configId)
          .single();
        
        if (configError) throw configError;
        setServerConfig(configData);
        
        // Fetch API definition
        const { data: apiData, error: apiError } = await supabase
          .from('mcp_api_definitions')
          .select('*')
          .eq('id', configData.api_definition_id)
          .single();
        
        if (apiError) throw apiError;
        setApiDefinition(apiData);
        
        // Fetch endpoints
        const { data: endpointsData, error: endpointsError } = await supabase
          .from('mcp_endpoints')
          .select('*')
          .eq('api_definition_id', apiData.id);
        
        if (endpointsError) throw endpointsError;
        setEndpoints(endpointsData || []);
        
        // Check if server was already generated
        const { data: deploymentData, error: deploymentError } = await supabase
          .from('mcp_deployments')
          .select('*')
          .eq('server_config_id', configId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!deploymentError && deploymentData && deploymentData.length > 0) {
          setServerUrl(deploymentData[0].code_url);
          setDeploymentUrl(deploymentData[0].deployment_url);
          setGenerationStatus('completed');
          setDeploymentStatus(deploymentData[0].status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, configId]);

  const handleGenerateServer = async () => {
    try {
      setGenerationStatus('generating');
      
      // API call to generate server code
      const response = await fetch('/api/generate-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configId,
          apiDefinitionId: apiDefinition.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate server');
      }
      
      const data = await response.json();
      setServerUrl(data.codeUrl);
      setGenerationStatus('completed');
      toast.success('Server code generated successfully');
    } catch (error) {
      console.error('Error generating server:', error);
      setGenerationStatus('failed');
      toast.error('Failed to generate server code');
    }
  };
  
  const handleDeployServer = async () => {
    try {
      if (!serverUrl) {
        toast.error('Generate server code first');
        return;
      }
      
      setDeploymentStatus('deploying');
      
      // API call to deploy server
      const response = await fetch('/api/deploy-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configId,
          codeUrl: serverUrl,
          createDockerImage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to deploy server');
      }
      
      const data = await response.json();
      setDeploymentUrl(data.deploymentUrl);
      setDeploymentStatus('deployed');
      toast.success('Server deployed successfully');
    } catch (error) {
      console.error('Error deploying server:', error);
      setDeploymentStatus('failed');
      toast.error('Failed to deploy server');
    }
  };
  
  const handleDownloadCode = async () => {
    try {
      if (!serverUrl) {
        toast.error('Generate server code first');
        return;
      }
      
      // API call to prepare download
      const response = await fetch(`/api/download-server-code?codeUrl=${encodeURIComponent(serverUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to prepare download');
      }
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'mcp'}-server.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast.success('Code downloaded successfully');
    } catch (error) {
      console.error('Error downloading code:', error);
      toast.error('Failed to download code');
    }
  };
  
  const handleTestServer = async () => {
    try {
      if (!deploymentUrl) {
        toast.error('Deploy server first');
        return;
      }
      
      // API call to test server
      const response = await fetch(`/api/test-server?deploymentUrl=${encodeURIComponent(deploymentUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to test server');
      }
      
      const data = await response.json();
      toast.success(`Server is ${data.status} and responding properly`);
    } catch (error) {
      console.error('Error testing server:', error);
      toast.error('Failed to test server connection');
    }
  };
  
  const handleUpdateApiDefinition = async (updatedApiDefinition) => {
    try {
      // Update API definition
      const { error } = await supabase
        .from('mcp_api_definitions')
        .update(updatedApiDefinition)
        .eq('id', apiDefinition.id);
      
      if (error) throw error;
      
      setApiDefinition({...apiDefinition, ...updatedApiDefinition});
      setShowApiEditor(false);
      toast.success('API definition updated successfully');
    } catch (error) {
      console.error('Error updating API definition:', error);
      toast.error('Failed to update API definition');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generation">Generation</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generation" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">API Definition</h2>
                <p className="text-muted-foreground">
                  {apiDefinition?.name || 'No API definition found'}
                </p>
              </div>
              <Button onClick={() => setShowApiEditor(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit API Definition
              </Button>
            </div>
            
            <Separator />
            
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
                        Prepare deployment files
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
                    <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Generating Server Code</h3>
                    <p className="text-muted-foreground">
                      This may take a few moments...
                    </p>
                  </div>
                )}
                
                {generationStatus === 'completed' && (
                  <div className="text-center py-6">
                    <Code className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Server Code Generated</h3>
                    <p className="text-muted-foreground mb-4">
                      Your server code has been generated successfully.
                    </p>
                    
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col space-y-2">
                        <h4 className="text-sm font-medium">Deployment Options</h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="dockerImage" 
                            checked={createDockerImage}
                            onCheckedChange={(checked) => setCreateDockerImage(checked === true)}
                          />
                          <Label htmlFor="dockerImage">Create Docker image</Label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={handleDownloadCode}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Code
                        </Button>
                        
                        <Button 
                          onClick={handleDeployServer}
                          disabled={deploymentStatus === 'deploying'}
                        >
                          {deploymentStatus === 'deploying' ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            <>
                              <Server className="mr-2 h-4 w-4" />
                              Deploy Server
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {deploymentStatus === 'deployed' && deploymentUrl && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Deployment Information</h3>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Your server is deployed and available at:
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Server
                        </a>
                      </Button>
                    </div>
                    
                    <Button onClick={handleTestServer} variant="secondary" className="w-full">
                      <Terminal className="mr-2 h-4 w-4" />
                      Test Server Connection
                    </Button>
                  </div>
                )}
                
                {createDockerImage && deploymentStatus === 'deployed' && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center">
                      <Docker className="h-5 w-5 mr-2 text-blue-500" />
                      <h3 className="text-lg font-medium">Docker Image</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your Docker image is available at:
                    </p>
                    <code className="block bg-muted p-2 rounded">
                      mcp-registry.replit.com/{project?.name.toLowerCase().replace(/\s+/g, '-')}/server:latest
                    </code>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                {generationStatus === 'idle' && (
                  <Button onClick={handleGenerateServer}>
                    <Code className="mr-2 h-4 w-4" />
                    Generate Server Code
                  </Button>
                )}

                {generationStatus === 'generating' && (
                  <Button disabled>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                )}

                {generationStatus === 'completed' && deploymentStatus !== 'deployed' && (
                  <Button onClick={() => setGenerationStatus('idle')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Again
                  </Button>
                )}

                {generationStatus === 'failed' && (
                  <Button onClick={handleGenerateServer}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {apiDefinition && (
              <ServerPreview
                endpoints={endpoints}
                serverUrl={serverUrl}
                isGenerating={generationStatus === 'generating'}
                config={serverConfig}
                onGenerateServer={handleGenerateServer}
                onDownloadCode={handleDownloadCode}
              />
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <div>
              <h2 className="text-2xl font-bold mb-4">Generation Logs</h2>
              <LogViewer />
            </div>
          </TabsContent>
        </Tabs>
        
        <Dialog open={showApiEditor} onOpenChange={setShowApiEditor}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit API Definition</DialogTitle>
            </DialogHeader>
            {apiDefinition && (
              <ApiDefinitionEditor
                apiDefinition={apiDefinition}
                onSave={handleUpdateApiDefinition}
                onCancel={() => setShowApiEditor(false)}
              />
            )}
          </DialogContent>
        </Dialog>
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
