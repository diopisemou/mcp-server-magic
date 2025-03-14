
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ServerConfig, ApiDefinitionRecord, McpProject, Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { parseApiDefinition } from '@/utils/apiParsingUtils';
import ServerConfigurationForm from '@/components/ServerConfigurationForm';

const ConfigureServer = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<McpProject | null>(null);
  const [apiDefinition, setApiDefinition] = useState<ApiDefinitionRecord | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    name: '',
    description: '',
    language: 'Python',
    authentication: {
      type: 'API Key', // This matches the updated AuthType in types/index.ts
      location: 'header',
      name: 'X-API-Key',
      value: ''
    },
    hosting: {
      provider: 'AWS',
      type: 'Shared', // This matches the updated HostingType in types/index.ts
      region: 'us-east-1'
    },
    endpoints: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (projectId && user) {
      fetchData();
    }
  }, [projectId, user, loading, navigate]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
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
      
      // Set initial server config name based on project
      setServerConfig(prev => ({
        ...prev,
        name: `${projectData.name} MCP Server`
      }));

      // Fetch API definition
      const { data: apiData, error: apiError } = await supabase
        .from('api_definitions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (apiError) {
        toast.error('No API definition found for this project');
        navigate(`/project/${projectId}`);
        return;
      }

      setApiDefinition(apiData);
      
      // Parse the API definition content and extract endpoints
      const extractedEndpoints = parseApiDefinition(apiData);
      
      // Fix the type mismatch by checking if the result has endpoints property
      if (Array.isArray(extractedEndpoints)) {
        setEndpoints(extractedEndpoints);
        setServerConfig(prev => ({
          ...prev,
          endpoints: extractedEndpoints
        }));
      } else if (extractedEndpoints && Array.isArray(extractedEndpoints.endpoints)) {
        setEndpoints(extractedEndpoints.endpoints);
        setServerConfig(prev => ({
          ...prev,
          endpoints: extractedEndpoints.endpoints
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch project data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveConfig = async () => {
    if (!serverConfig.name) {
      toast.error('Server name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('server_configurations')
        .insert([
          {
            project_id: projectId,
            name: serverConfig.name,
            description: serverConfig.description,
            language: serverConfig.language,
            authentication_type: serverConfig.authentication.type,
            authentication_details: {
              location: serverConfig.authentication.location,
              name: serverConfig.authentication.name,
              value: serverConfig.authentication.value
            },
            hosting_provider: serverConfig.hosting.provider,
            hosting_type: serverConfig.hosting.type,
            hosting_region: serverConfig.hosting.region
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Server configuration saved successfully');
      navigate(`/generate-server/${projectId}/${data.id}`);
    } catch (error) {
      console.error('Error saving server configuration:', error);
      toast.error('Failed to save server configuration');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateServerConfig = (updatedConfig: ServerConfig) => {
    setServerConfig(updatedConfig);
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Configure MCP Server</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configure MCP Server</h1>
          <p className="text-muted-foreground mt-1">
            Project: {project?.name} | API: {apiDefinition?.name}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate(`/project/${projectId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerConfigurationForm 
              serverConfig={serverConfig}
              onConfigChange={handleUpdateServerConfig}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigureServer;
