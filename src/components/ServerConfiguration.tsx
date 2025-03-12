
import React, { useState } from 'react';
import { ServerConfig, Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, Check, Code, Server, Key, CloudCog } from 'lucide-react';
import { generateMcpServer } from '@/utils/serverGenerator';

interface ServerConfigurationProps {
  endpoints: Endpoint[];
  onComplete: (result: any) => void;
  onBack: () => void;
}

const ServerConfiguration: React.FC<ServerConfigurationProps> = ({ 
  endpoints, 
  onComplete,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState('basics');
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<ServerConfig>({
    name: `mcp-server-${new Date().getTime().toString(36)}`,
    description: 'MCP Server generated from API definition',
    language: 'TypeScript',
    authentication: {
      type: 'ApiKey',
      location: 'header',
      name: 'Authorization'
    },
    hosting: {
      provider: 'Supabase',
      type: 'Shared'
    },
    endpoints: endpoints
  });

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const handleGenerate = async () => {
    if (config.name.trim() === '') {
      toast.error('Please provide a server name');
      setActiveTab('basics');
      return;
    }

    // Validate that at least one endpoint is mapped
    const mappedEndpoints = config.endpoints.filter(
      endpoint => endpoint.mcpType !== 'none'
    );
    
    if (mappedEndpoints.length === 0) {
      toast.error('Please map at least one endpoint as a resource or tool');
      return;
    }

    setGenerating(true);
    
    try {
      const result = await generateMcpServer(config);
      
      if (result.success) {
        toast.success('MCP Server generated successfully');
        onComplete(result);
      } else {
        toast.error(`Failed to generate server: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating server:', error);
      toast.error('An unexpected error occurred during server generation');
    } finally {
      setGenerating(false);
    }
  };

  // Count resources and tools
  const resourceCount = endpoints.filter(e => e.mcpType === 'resource').length;
  const toolCount = endpoints.filter(e => e.mcpType === 'tool').length;

  return (
    <section className="py-24 bg-white relative">
      <div className="content-container">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Server Configuration
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Configure Your MCP Server
            </h2>
            <p className="text-muted-foreground">
              Customize your server settings before generation. This will define how your API is exposed to AI models.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border">
                <TabsList className="p-0 h-auto bg-transparent border-0 overflow-auto w-full flex">
                  <TabsTrigger 
                    value="basics" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span>Basics</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="auth" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>Authentication</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hosting" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    <div className="flex items-center gap-2">
                      <CloudCog className="h-4 w-4" />
                      <span>Hosting</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="code" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <span>Generation</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="basics" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="server-name">Server Name</Label>
                        <Input 
                          id="server-name" 
                          value={config.name} 
                          onChange={(e) => updateConfig('name', e.target.value)}
                          placeholder="my-mcp-server"
                        />
                        <p className="text-xs text-muted-foreground">
                          A unique name for your MCP server
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="server-language">Server Language</Label>
                        <Select 
                          value={config.language}
                          onValueChange={(value) => updateConfig('language', value)}
                        >
                          <SelectTrigger id="server-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TypeScript">TypeScript</SelectItem>
                            <SelectItem value="Python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          The programming language for your server
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="server-description">Server Description</Label>
                      <Textarea 
                        id="server-description" 
                        value={config.description} 
                        onChange={(e) => updateConfig('description', e.target.value)}
                        placeholder="Describe what this MCP server does"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        This description will be included in the MCP server metadata
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4 bg-secondary/30">
                      <h3 className="font-medium mb-2">API Endpoint Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-border">
                          <span className="text-sm font-medium">Resources</span>
                          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {resourceCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-border">
                          <span className="text-sm font-medium">Tools</span>
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {toolCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="auth" className="mt-0">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Authentication Type</Label>
                      <RadioGroup 
                        value={config.authentication.type}
                        onValueChange={(value) => updateConfig('authentication.type', value)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer">
                          <RadioGroupItem value="ApiKey" id="auth-apikey" />
                          <Label htmlFor="auth-apikey" className="cursor-pointer">API Key</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer">
                          <RadioGroupItem value="Bearer" id="auth-bearer" />
                          <Label htmlFor="auth-bearer" className="cursor-pointer">Bearer Token</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer">
                          <RadioGroupItem value="Basic" id="auth-basic" />
                          <Label htmlFor="auth-basic" className="cursor-pointer">Basic Auth</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer">
                          <RadioGroupItem value="None" id="auth-none" />
                          <Label htmlFor="auth-none" className="cursor-pointer">No Authentication</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {(config.authentication.type === 'ApiKey') && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="auth-location">Key Location</Label>
                          <RadioGroup 
                            value={config.authentication.location || 'header'}
                            onValueChange={(value) => updateConfig('authentication.location', value)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="header" id="location-header" />
                              <Label htmlFor="location-header" className="cursor-pointer">Header</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="query" id="location-query" />
                              <Label htmlFor="location-query" className="cursor-pointer">Query Parameter</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="auth-name">Key Name</Label>
                          <Input 
                            id="auth-name" 
                            value={config.authentication.name || 'Authorization'} 
                            onChange={(e) => updateConfig('authentication.name', e.target.value)}
                            placeholder="X-API-Key"
                          />
                          <p className="text-xs text-muted-foreground">
                            The header or query parameter name for the API key
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {config.authentication.type === 'None' && (
                      <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                        <div className="flex gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">Warning: No Authentication</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Your MCP server will be publicly accessible without any authentication.
                              This is not recommended for production use.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="hosting" className="mt-0">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Hosting Provider</Label>
                      <RadioGroup 
                        value={config.hosting.provider}
                        onValueChange={(value) => updateConfig('hosting.provider', value)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer">
                          <RadioGroupItem value="Supabase" id="hosting-supabase" />
                          <Label htmlFor="hosting-supabase" className="cursor-pointer">Supabase</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer opacity-50">
                          <RadioGroupItem value="AWS" id="hosting-aws" disabled />
                          <Label htmlFor="hosting-aws" className="cursor-pointer">AWS (Coming Soon)</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer opacity-50">
                          <RadioGroupItem value="GCP" id="hosting-gcp" disabled />
                          <Label htmlFor="hosting-gcp" className="cursor-pointer">GCP (Coming Soon)</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-secondary/20 cursor-pointer opacity-50">
                          <RadioGroupItem value="Azure" id="hosting-azure" disabled />
                          <Label htmlFor="hosting-azure" className="cursor-pointer">Azure (Coming Soon)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Hosting Type</Label>
                      <RadioGroup 
                        value={config.hosting.type}
                        onValueChange={(value) => updateConfig('hosting.type', value)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <Card className={`border ${config.hosting.type === 'Shared' ? 'border-primary border-2' : ''} cursor-pointer hover:bg-secondary/10`} onClick={() => updateConfig('hosting.type', 'Shared')}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Shared Hosting</CardTitle>
                            <CardDescription>Cost-effective, managed environment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Automatic scaling</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Managed updates</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Basic monitoring</span>
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card className={`border ${config.hosting.type === 'Dedicated' ? 'border-primary border-2' : ''} cursor-pointer hover:bg-secondary/10`} onClick={() => updateConfig('hosting.type', 'Dedicated')}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Dedicated Hosting</CardTitle>
                            <CardDescription>High-performance isolated environment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Higher resource limits</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Custom configuration</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Advanced monitoring</span>
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </RadioGroup>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-0">
                  <div className="space-y-6">
                    <div className="rounded-lg border border-border p-4 bg-secondary/30">
                      <h3 className="font-medium mb-3">Server Generation Summary</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Server Name:</div>
                          <div className="col-span-2">{config.name}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Language:</div>
                          <div className="col-span-2">{config.language}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Authentication:</div>
                          <div className="col-span-2">{config.authentication.type}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Hosting:</div>
                          <div className="col-span-2">{config.hosting.provider} ({config.hosting.type})</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Resources:</div>
                          <div className="col-span-2">{resourceCount}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">Tools:</div>
                          <div className="col-span-2">{toolCount}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-md p-4">
                      <p className="text-sm mb-4">
                        The server generator will create all necessary files for your MCP server based on your 
                        configuration and the mapped API endpoints. The generated files will be stored in Supabase 
                        and can be downloaded or deployed directly.
                      </p>
                      
                      {config.hosting.provider === 'Supabase' && (
                        <div className="text-sm p-3 bg-secondary rounded-md">
                          <p className="font-medium mb-1">Supabase Deployment</p>
                          <p>
                            The server will be deployed as an Edge Function in your Supabase project, making it
                            immediately available for use with AI models that support the MCP protocol.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back to Endpoint Mapping
            </Button>
            <Button 
              onClick={handleGenerate} 
              size="lg" 
              disabled={generating}
              className="relative"
            >
              {generating ? 'Generating...' : 'Generate MCP Server'}
              {generating && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4">
                  <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServerConfiguration;
