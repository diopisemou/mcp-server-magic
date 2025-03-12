
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { saveApiDefinition } from '../utils/apiService';
import { extractEndpoints } from '../utils/apiValidator';
import { EndpointMapper } from '../components/EndpointMapper';
import type { EndpointDefinition } from '../types/api';

export default function ProjectCreation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [apiDefinition, setApiDefinition] = useState<any>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<EndpointDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Project details, 2: API upload, 3: Endpoint selection

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleContinueToApiUpload = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }
    
    setStep(2);
  };

  const handleUpload = async () => {
    setIsLoading(true);
    try {
      if (!file) {
        toast({
          title: "Error",
          description: "Please select a file first",
          variant: "destructive"
        });
        return;
      }

      const text = await file.text();
      let data;
      const fileFormat = file.name.endsWith('.json') ? 'json' : 'yaml';
      
      if (fileFormat === 'json') {
        data = JSON.parse(text);
      } else {
        // In a production app, use proper YAML parser
        toast({
          title: "Error",
          description: "YAML parsing not implemented in this demo",
          variant: "destructive"
        });
        return;
      }

      const endpoints = extractEndpoints(data, fileFormat);
      const definition = {
        name: name || file.name,
        description,
        format: fileFormat.toUpperCase(),
        endpoints,
        content: data
      };
      
      setApiDefinition(definition);
      setStep(3);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to parse API definition",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlUpload = async () => {
    setIsLoading(true);
    try {
      // Implement URL fetching logic
      toast({
        title: "URL upload",
        description: "URL upload not implemented in this demo",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch API definition",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndpointSelection = async (endpoints: EndpointDefinition[]) => {
    setSelectedEndpoints(endpoints);
    
    try {
      // Save the project with API definition and selected endpoints
      const savedDefinition = await saveApiDefinition({
        name,
        description,
        format: apiDefinition.format,
        endpoint_definition: endpoints
      });
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      // Navigate to server configuration
      navigate(`/server-configuration/${savedDefinition.id}`);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="py-24">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Create New Project</h1>
            <p className="text-muted-foreground text-lg">
              Set up your project and import your API definition
            </p>
          </div>
          
          {step === 1 && (
            <Card className="p-6">
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My API Server"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your project"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleContinueToApiUpload}
                  className="w-full"
                  disabled={!name.trim()}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}
          
          {step === 2 && (
            <Card className="p-6">
              <Tabs defaultValue="file">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="url">Provide URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="api-file">API Definition File (JSON, YAML)</Label>
                    <Input 
                      id="api-file" 
                      type="file" 
                      onChange={handleFileChange}
                      accept=".json,.yaml,.yml"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload OpenAPI, Swagger, RAML, or API Blueprint
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleUpload} 
                    className="w-full"
                    disabled={!file || isLoading}
                  >
                    {isLoading ? "Processing..." : "Upload and Process"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="api-url">API Definition URL</Label>
                    <Input 
                      id="api-url" 
                      type="url" 
                      placeholder="https://example.com/api-spec.json"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      URL to a publicly accessible API definition
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleUrlUpload} 
                    className="w-full"
                    disabled={!url || isLoading}
                  >
                    {isLoading ? "Processing..." : "Fetch and Process"}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          )}
          
          {step === 3 && apiDefinition && (
            <EndpointMapper 
              apiDefinition={apiDefinition}
              onContinue={handleEndpointSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
