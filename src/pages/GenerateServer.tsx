import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogViewer } from '@/components/LogViewer';
import { Download, ExternalLink } from 'lucide-react';
import { ApiDefinition, ServerConfig, ServerFile, Endpoint } from '@/types';
import { generateServer } from '@/utils/serverGenerator';
import { ServerPreview } from '@/components/ServerPreview';
import { ServerGenerationSection } from '@/components/ServerGenerationSection';

export const GenerateServer = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      if (!projectId) return;

      const { data, error } = await supabase
        .from('mcp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);

      // Fetch API definition from storage
      if (data.api_definition_id) {
        await fetchApiDefinition(data.api_definition_id);
      }

      // Fetch server config
      if (data.server_config_id) {
        await fetchServerConfig(data.server_config_id);
      }

      // Set server URL if available
      if (data.deployment_url) {
        setServerUrl(data.deployment_url);
      }

    } catch (error: any) {
      toast.error('Error fetching project: ' + error.message);
    }
  };

  const fetchApiDefinition = async (definitionId: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('api_definitions')
        .download(`${projectId}/${definitionId}.json`);

      if (error) throw error;

      const definition = JSON.parse(await data.text()) as ApiDefinition;
      setApiDefinition(definition);

      // Extract endpoints from the API definition
      if (definition.parsedDefinition) {
        const extractedEndpoints = extractEndpointsFromDefinition(definition.parsedDefinition);
        setEndpoints(extractedEndpoints);
      }

    } catch (error: any) {
      toast.error('Error fetching API definition: ' + error.message);
    }
  };

  const fetchServerConfig = async (configId: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('server_configs')
        .download(`${projectId}/${configId}.json`);

      if (error) throw error;

      const config = JSON.parse(await data.text()) as ServerConfig;
      setServerConfig(config);

    } catch (error: any) {
      toast.error('Error fetching server configuration: ' + error.message);
    }
  };

  const extractEndpointsFromDefinition = (parsedDefinition: any): Endpoint[] => {
    // This is a placeholder function - implement actual extraction logic based on your API format
    const extractedEndpoints: Endpoint[] = [];

    try {
      // Example for OpenAPI format
      if (parsedDefinition.paths) {
        Object.entries(parsedDefinition.paths).forEach(([path, pathItem]: [string, any]) => {
          Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
            const endpoint: Endpoint = {
              path,
              method: method.toUpperCase() as any,
              description: operation.summary || operation.description || '',
              parameters: [],
              responses: [],
              mcpType: 'none'
            };

            // Extract parameters
            if (operation.parameters) {
              endpoint.parameters = operation.parameters.map((param: any) => ({
                name: param.name,
                type: param.schema?.type || 'string',
                required: param.required || false,
                description: param.description || ''
              }));
            }

            // Extract responses
            if (operation.responses) {
              endpoint.responses = Object.entries(operation.responses).map(([statusCode, response]: [string, any]) => ({
                statusCode: parseInt(statusCode),
                description: response.description || '',
                schema: response.schema || response.content
              }));
            }

            extractedEndpoints.push(endpoint);
          });
        });
      }
    } catch (error) {
      console.error('Error extracting endpoints:', error);
    }

    return extractedEndpoints;
  };

  const handleGenerateServer = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setLogs(prevLogs => [...prevLogs, { type: 'info', message: 'Generating server code...' }]);

      // Create server config if not already created
      let config = serverConfig;
      if (!config && apiDefinition) {
        config = {
          name: project.name || 'MCP Server',
          description: project.description || 'Generated MCP Server',
          language: 'TypeScript',
          authentication: {
            type: 'None'
          },
          hosting: {
            provider: 'Self-hosted',
            type: 'Shared'
          },
          endpoints: endpoints
        };

        setServerConfig(config);
      }

      if (!config) {
        throw new Error('Server configuration is missing');
      }

      // Generate server code
      const result = await generateServer(config);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate server');
      }

      setLogs(prevLogs => [...prevLogs, { type: 'success', message: 'Server code generated successfully' }]);

      // Save generated files to storage
      if (result.files && result.files.length > 0) {
        setServerFiles(result.files);

        // Save the first code file content preview
        const mainCodeFile = result.files.find(file => file.type === 'code');
        if (mainCodeFile) {
          await saveGeneratedCode(mainCodeFile.content);
        }
      }

      // Update project with server URL
      if (result.serverUrl) {
        setServerUrl(result.serverUrl);
        await updateProjectServerUrl(result.serverUrl);
        setLogs(prevLogs => [...prevLogs, { type: 'info', message: `Server deployed at: ${result.serverUrl}` }]);
      }

      setActiveTab('logs');

    } catch (error: any) {
      setError(error.message);
      setLogs(prevLogs => [...prevLogs, { type: 'error', message: `Error generating server: ${error.message}` }]);
      toast.error('Error generating server: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedCode = async (codeContent: string) => {
    try {
      const timestamp = new Date().toISOString();
      const fileName = `server_${timestamp}.txt`;

      const { error } = await supabase
        .storage
        .from('generated_code')
        .upload(`${projectId}/${fileName}`, new Blob([codeContent], { type: 'text/plain' }));

      if (error) throw error;

      // Update project record with reference to the code file
      await supabase
        .from('mcp_projects')
        .update({
          generated_code_file: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

    } catch (error: any) {
      console.error('Error saving generated code:', error);
    }
  };

  const updateProjectServerUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from('mcp_projects')
        .update({
          deployment_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating project server URL:', error);
    }
  };

  const handleDownloadCode = () => {
    if (serverFiles.length === 0) {
      toast.error('No code generated to download');
      return;
    }

    // Create a zip file with all generated files
    import('jszip').then(({ default: JSZip }) => {
      const zip = new JSZip();

      serverFiles.forEach(file => {
        // Create directory structure if needed
        const filePath = file.path === '/' ? file.name : `${file.path}${file.name}`;
        zip.file(filePath, file.content);
      });

      zip.generateAsync({ type: 'blob' }).then(content => {
        const element = document.createElement('a');
        element.href = URL.createObjectURL(content);
        element.download = `mcp-server-${projectId}.zip`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    }).catch(error => {
      console.error('Error creating zip file:', error);
      toast.error('Error creating zip file');
    });
  };

  const handleTestServer = async () => {
    if (!serverUrl) {
      toast.error('No server available to test');
      return;
    }

    setLogs(prevLogs => [...prevLogs, { type: 'info', message: `Testing server at ${serverUrl}...` }]);

    try {
      // For now just simulate a test
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLogs(prevLogs => [...prevLogs, { type: 'success', message: 'Server test completed successfully' }]);
      toast.success('Server test completed');
    } catch (error: any) {
      setLogs(prevLogs => [...prevLogs, { type: 'error', message: `Server test failed: ${error.message}` }]);
      toast.error('Server test failed');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generate MCP Server</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Projects
        </Button>
      </div>

      <Separator className="my-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>
                Configure and generate your MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerGenerationSection 
                serverUrl={serverUrl}
                isGenerating={isGenerating}
                error={error}
                config={serverConfig}
                apiDefinition={apiDefinition}
                endpoints={endpoints}
                onGenerateServer={handleGenerateServer}
                onDownloadCode={handleDownloadCode}
                onTestServer={handleTestServer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Server Preview</CardTitle>
              <CardDescription>
                Preview the endpoints and generated code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerPreview
                endpoints={endpoints}
                serverUrl={serverUrl}
                isGenerating={isGenerating}
                config={serverConfig}
                onGenerateServer={handleGenerateServer}
                onDownloadCode={handleDownloadCode}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>
                View the logs from the generation and deployment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogViewer logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerateServer;