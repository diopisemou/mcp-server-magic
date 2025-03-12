import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Endpoint, ServerConfig, GenerationResult } from '@/types';
import { generateServer } from '@/utils/serverGenerator';

interface ServerConfigurationProps {
  endpoints: Endpoint[];
  onComplete: (result: GenerationResult) => void;
}

const serverConfigSchema = z.object({
  name: z.string().min(3, { message: "Server name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  language: z.enum(["Python", "TypeScript"]),
  authType: z.enum(["ApiKey", "Basic", "Bearer", "None"]),
  authLocation: z.enum(["header", "query"]).optional(),
  authName: z.string().optional(),
  hostingProvider: z.enum(["AWS", "GCP", "Azure", "Supabase", "Self-hosted"]),
  hostingType: z.enum(["Shared", "Dedicated"]),
  hostingRegion: z.string().optional(),
});

const ServerConfiguration = ({ endpoints, onComplete }: ServerConfigurationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const form = useForm<z.infer<typeof serverConfigSchema>>({
    resolver: zodResolver(serverConfigSchema),
    defaultValues: {
      name: "",
      description: "",
      language: "Python",
      authType: "None",
      hostingProvider: "Supabase",
      hostingType: "Shared",
    },
  });
  
  const authType = form.watch("authType");
  
  const onSubmit = async (values: z.infer<typeof serverConfigSchema>) => {
    setIsGenerating(true);
    
    try {
      // Prepare the server configuration
      const serverConfig: ServerConfig = {
        name: values.name,
        description: values.description,
        language: values.language,
        authentication: {
          type: values.authType,
          location: values.authLocation,
          name: values.authName,
        },
        hosting: {
          provider: values.hostingProvider,
          type: values.hostingType,
          region: values.hostingRegion,
        },
        endpoints: endpoints,
      };
      
      // Generate the server
      const result = await generateServer(serverConfig);
      
      // Pass the result to the parent component
      onComplete(result);
    } catch (error) {
      console.error("Error generating server:", error);
      onComplete({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <section className="py-24 bg-white">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Server Configuration
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Configure Your MCP Server
            </h2>
            <p className="text-muted-foreground">
              Customize how your MCP server will be built and deployed.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Server Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="auth">Authentication</TabsTrigger>
                  <TabsTrigger value="hosting">Hosting</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                    <TabsContent value="general" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My MCP Server" {...field} />
                            </FormControl>
                            <FormDescription>
                              A descriptive name for your MCP server
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="A server that provides access to..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Brief description of what your server does
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server Language</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Python">Python</SelectItem>
                                <SelectItem value="TypeScript">TypeScript</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The programming language for your server
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("auth")}
                        >
                          Next: Authentication
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="auth" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="authType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authentication Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select authentication type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">No Authentication</SelectItem>
                                <SelectItem value="ApiKey">API Key</SelectItem>
                                <SelectItem value="Basic">Basic Auth</SelectItem>
                                <SelectItem value="Bearer">Bearer Token</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How clients will authenticate with your server
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      {authType !== "None" && (
                        <>
                          <FormField
                            control={form.control}
                            name="authName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {authType === "ApiKey" ? "Key Name" : "Header Name"}
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={authType === "ApiKey" ? "x-api-key" : "Authorization"} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  {authType === "ApiKey" 
                                    ? "The name of the API key parameter" 
                                    : "The name of the authorization header"}
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          
                          {authType === "ApiKey" && (
                            <FormField
                              control={form.control}
                              name="authLocation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Key Location</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select location" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="header">Header</SelectItem>
                                      <SelectItem value="query">Query Parameter</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Where the API key should be included in requests
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab("general")}
                        >
                          Previous: General
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("hosting")}
                        >
                          Next: Hosting
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="hosting" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="hostingProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hosting Provider</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AWS">AWS</SelectItem>
                                <SelectItem value="GCP">Google Cloud</SelectItem>
                                <SelectItem value="Azure">Azure</SelectItem>
                                <SelectItem value="Supabase">Supabase</SelectItem>
                                <SelectItem value="Self-hosted">Self-hosted</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Where your MCP server will be deployed
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hostingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hosting Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select hosting type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Shared">Shared Infrastructure</SelectItem>
                                <SelectItem value="Dedicated">Dedicated Infrastructure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Shared is more cost-effective, dedicated offers better performance
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hostingRegion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="us-east-1" {...field} />
                            </FormControl>
                            <FormDescription>
                              The geographic region where your server will be hosted
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab("auth")}
                        >
                          Previous: Authentication
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isGenerating}
                        >
                          {isGenerating ? "Generating..." : "Generate Server"}
                        </Button>
                      </div>
                    </TabsContent>
                  </form>
                </Form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ServerConfiguration;
