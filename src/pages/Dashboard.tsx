
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { McpProject } from '@/types';
import { toast } from 'sonner';
import { PlusCircle, Box, Settings, ExternalLink, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<McpProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mcp_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mcp_projects')
        .insert([
          { name, description: description || null, user_id: user?.id }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProjects([data, ...projects]);
      toast.success('Project created successfully');
      setOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mcp_projects')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setProjects(projects.filter(project => project.id !== id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const navigateToProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const navigateToImportAPI = () => {
    navigate('/import-api');
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your MCP Projects</h1>
        <div className="space-x-2">
          <Button onClick={navigateToImportAPI}>
            Import API
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new MCP project</DialogTitle>
                <DialogDescription>
                  Provide a name and optional description for your new MCP server project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My API Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of your MCP server project"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Box className="h-16 w-16 mx-auto text-gray-300" />
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create your first MCP server project to get started, or import an API definition.
          </p>
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="transition-transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="truncate">{project.name}</CardTitle>
                <CardDescription className="truncate">
                  {project.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToProject(project.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => navigateToProject(project.id)}>View Project</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
