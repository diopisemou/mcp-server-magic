import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ApiDefinition } from '@/types';
import ApiUploader from '@/components/ApiUploader';
// Fix the imports
import { validateApiDefinition } from '@/utils/apiValidator';
import EndpointMapper from '@/components/EndpointMapper';

const ProjectCreation = () => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleApiUpload = (definition: ApiDefinition) => {
    setApiDefinition(definition);
  };

  const createProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Error',
        description: 'Project name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mcp_projects')
        .insert([
          {
            name: projectName,
            description: projectDescription || null,
            user_id: user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      // Save the API definition to the new project
      if (apiDefinition) {
        await saveApiDefinition(data.id);
      }

      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiDefinition = async (projectId: string) => {
    if (!apiDefinition) {
      toast({
        title: 'Error',
        description: 'No API definition to save',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('api_definitions')
        .insert([
          {
            project_id: projectId,
            name: apiDefinition.name,
            format: apiDefinition.format,
            content: apiDefinition.content,
            endpoint_definition: apiDefinition.endpoint_definition
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'API definition saved successfully',
      });
    } catch (error) {
      console.error('Error saving API definition:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API definition',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="py-24 relative overflow-hidden">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Create a New Project</h2>
            <p className="text-muted-foreground text-lg">
              Define your project and upload an API definition to get started
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="project-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Project Name
                  </label>
                  <Input
                    type="text"
                    id="project-name"
                    placeholder="My API Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="project-description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="project-description"
                    placeholder="A brief description of your MCP server project"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="h-24"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-border">
              <ApiUploader onUploadComplete={handleApiUpload} />
            </div>

            <div className="p-6">
              <Button onClick={createProject} disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreation;
