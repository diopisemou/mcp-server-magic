
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { getApiDefinition, saveApiDefinition } from '../utils/apiService';
import { generateServer } from '../utils/serverGenerator';
import EndpointMapper from '../components/EndpointMapper';
import type { ApiDefinition, EndpointDefinition, ServerConfig, GenerationResult, AuthConfig } from '../types';
import { convertJsonToEndpointDefinitions } from '../utils/typeConverters';

export default function ServerConfiguration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<EndpointDefinition[]>([]);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    language: 'TypeScript',
    framework: 'express',
    database: 'none',
    authentication: {
      type: "None",
      location: "header"
    } as AuthConfig,
    name: '',
    description: '',
    hosting: {
      provider: "AWS",
      type: "Serverless",
      region: "us-east-1"
    },
    endpoints: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverFiles, setServerFiles] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadApiDefinition(id);
    }
  }, [id]);

  const loadApiDefinition = async (definitionId: string) => {
    try {
      const definition = await getApiDefinition(definitionId);
      setApiDefinition(definition);
      
      // Set selected endpoints from the saved endpoint_definition
      if (definition.endpoint_definition && definition.endpoint_definition.length > 0) {
        setSelectedEndpoints(definition.endpoint_definition);
      }
    } catch (error) {
      console.error("Failed to load API definition:", error);
      toast({
        title: "Error",
        description: "Failed to load API definition",
        variant: "destructive"
      });
    }
  };

  const handleEndpointSelection = (endpoints: EndpointDefinition[]) => {
    setSelectedEndpoints(endpoints);
    
    // Save the updated endpoint selection
    if (apiDefinition) {
      saveApiDefinition({
        ...apiDefinition,
        endpoint_definition: endpoints
      });
    }
  };

  const handleConfigChange = (key: keyof ServerConfig, value: any) => {
    setServerConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateServer = async () => {
    if (!apiDefinition) return;
    
    setIsLoading(true);
    try {
      // Only use selected endpoints for server generation
      const filteredEndpoints = selectedEndpoints.filter(endpoint => endpoint.selected !== false);
      
      // Create server config with the endpoints
      const configWithEndpoints = {
        ...serverConfig,
        endpoints: filteredEndpoints
      };
      
      const result: GenerationResult = await generateServer(configWithEndpoints);
      
      setServerFiles(result.files);
      
      toast({
        title: "Success",
        description: "Server generated successfully",
      });
      
      // Navigate to server preview or download page
      navigate(`/server-preview/${apiDefinition.id}`);
    } catch (error) {
      console.error("Failed to generate server:", error);
      toast({
        title: "Error",
        description: "Failed to generate server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiDefinition) {
    return <div className="py-24 text-center">Loading...</div>;
  }

  return (
    <div className="py-24">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-4">{apiDefinition.name}</h1>
            <p className="text-muted-foreground">
              Configure your server and select which endpoints to include.
            </p>
          </div>
          
          <div className="grid gap-8">
            {/* Endpoint selection */}
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <EndpointMapper 
                  apiDefinition={apiDefinition}
                  onContinue={handleEndpointSelection}
                />
              </CardContent>
            </Card>
            
            {/* Server configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="language" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="language">Language</TabsTrigger>
                    <TabsTrigger value="framework">Framework</TabsTrigger>
                    <TabsTrigger value="database">Database</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="language" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={serverConfig.language === 'TypeScript' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('language', 'TypeScript')}
                        className="h-24"
                      >
                        TypeScript
                      </Button>
                      <Button
                        variant={serverConfig.language === 'Python' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('language', 'Python')}
                        className="h-24"
                      >
                        Python
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="framework" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={serverConfig.framework === 'express' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('framework', 'express')}
                        className="h-24"
                        disabled={serverConfig.language !== 'TypeScript'}
                      >
                        Express.js
                      </Button>
                      <Button
                        variant={serverConfig.framework === 'fastapi' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('framework', 'fastapi')}
                        className="h-24"
                        disabled={serverConfig.language !== 'Python'}
                      >
                        FastAPI
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="database" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={serverConfig.database === 'none' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('database', 'none')}
                      >
                        None
                      </Button>
                      <Button
                        variant={serverConfig.database === 'mongodb' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('database', 'mongodb')}
                      >
                        MongoDB
                      </Button>
                      <Button
                        variant={serverConfig.database === 'postgres' ? 'default' : 'outline'}
                        onClick={() => handleConfigChange('database', 'postgres')}
                      >
                        PostgreSQL
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="authentication"
                        checked={serverConfig.authentication.type !== "None"}
                        onChange={(e) => handleConfigChange('authentication', 
                          e.target.checked 
                            ? { type: "API Key", location: "header", name: "x-api-key" } 
                            : { type: "None", location: "header" }
                        )}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="authentication">Include Authentication</Label>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleGenerateServer}
              disabled={isLoading}
              className="w-full h-12 text-lg"
            >
              {isLoading ? "Generating..." : "Generate Server"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
