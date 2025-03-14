
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { McpProject, ApiDefinition, Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ApiUploader from '@/components/ApiUploader';
import AdvancedEndpointMapper from '@/components/AdvancedEndpointMapper';

const ImportApi = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectIdParam = searchParams.get('projectId');

  const [projects, setProjects] = useState<McpProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mappedEndpoints, setMappedEndpoints] = useState<Endpoint[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProjects();
    }
  }, [user, loading, navigate]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const { data, error } = await supabase
        .from('mcp_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);

      // If no project is selected and we have projects, select the first one
      if (!selectedProjectId && data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleApiUpload = (definition: ApiDefinition) => {
    setApiDefinition(definition);

    // If there's no selected project or project ID parameter, ask user if they want to create a new project
    if (!selectedProjectId) {
      setShowProjectDialog(true);
    }
  };

  const handleEndpointMapping = (endpoints: Endpoint[]) => {
    setMappedEndpoints(endpoints);
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('mcp_projects')
        .insert([
          {
            name: newProjectName,
            description: newProjectDescription || null,
            user_id: user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProjects([data, ...projects]);
      setSelectedProjectId(data.id);
      setShowProjectDialog(false);
      toast.success('Project created successfully');

      // Save the API definition to the new project
      await saveApiDefinition(data.id);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsSaving(false);
    }
  };

  const saveApiDefinition = async (projectId: string) => {
    if (!apiDefinition) {
      toast.error('No API definition to save');
      return;
    }

    try {
      setIsSaving(true);
      // Convert endpoints to JSON-safe format
      const safeEndpoints = mappedEndpoints || apiDefinition.endpoint_definition || [];
      
      // Create a single object, not an array
      const apiToSave = {
        project_id: projectId,
        name: apiDefinition.name,
        format: apiDefinition.format,
        content: apiDefinition.content,
        // Store endpoints as a JSON object
        endpoint_definition: safeEndpoints
      };
      
      const { error } = await supabase
        .from('api_definitions')
        .insert(apiToSave);

      if (error) {
        throw error;
      }

      toast.success('API definition saved successfully');
      // Navigate to the project page
      navigate(`/project/${projectId}`);
    } catch (error) {
      console.error('Error saving API definition:', error);
      toast.error('Failed to save API definition');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (!selectedProjectId) {
      toast.error('Please select or create a project');
      return;
    }

    if (!apiDefinition) {
      toast.error('Please upload an API definition');
      return;
    }

    saveApiDefinition(selectedProjectId);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Import API Definition</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <ApiUploader onUploadComplete={handleApiUpload} />
      </div>

      {apiDefinition && (
        <div id="mapping-section" className="scroll-mt-20">
          <AdvancedEndpointMapper
            apiDefinition={apiDefinition}
            onContinue={handleEndpointMapping}
          />
        </div>
      )}

      {apiDefinition && (
        <div className="bg-white rounded-xl shadow-lg border border-border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose Project</h2>
          <p className="text-muted-foreground mb-6">
            Select an existing project or create a new one to store this API definition.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <div className="flex space-x-2">
                <Select
                  value={selectedProjectId || ''}
                  onValueChange={(value) => setSelectedProjectId(value || null)}
                  disabled={isLoadingProjects}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowProjectDialog(true)}>
                  Create New Project
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleContinue}
                disabled={!selectedProjectId || isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save API Definition'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new MCP project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My API Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                placeholder="A brief description of your MCP server project"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProjectDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={createNewProject}
              disabled={!newProjectName.trim() || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportApi;
