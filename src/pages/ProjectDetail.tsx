
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { McpProject, ApiDefinitionRecord, ServerConfigRecord, Deployment } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ApiDefinitionList from '@/components/ApiDefinitionList';
import ServerConfigurationList from '@/components/ServerConfigurationList';
import DeploymentList from '@/components/DeploymentList';

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
      const typedConfigData: ServerConfigRecord[] = (configData || []).map(config => ({
        ...config,
        language: config.language as "Python" | "TypeScript",
        authentication_details: config.authentication_details as Record<string, any>
      }));
      
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
      const typedDeploymentData: Deployment[] = (deploymentData || []).map(deployment => ({
        ...deployment,
        status: deployment.status as "pending" | "success" | "failed"
      }));
      
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
            
            <ApiDefinitionList 
              apiDefinitions={apiDefinitions}
              onConfigureServer={handleConfigureServer}
              onImportApi={handleImportAPI}
            />
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
            
            <ServerConfigurationList
              serverConfigs={serverConfigs}
              onGenerateServer={handleGenerateServer}
              onDownloadFiles={downloadServerFiles}
              onConfigureServer={handleConfigureServer}
              hasApiDefinition={apiDefinitions.length > 0}
            />
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
            
            <DeploymentList
              deployments={deployments}
              onViewDeployment={handleViewDeployment}
              onTestServer={handleTestServer}
              onRefresh={fetchProjectData}
              onConfigureServer={handleConfigureServer}
              hasApiDefinition={apiDefinitions.length > 0}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
