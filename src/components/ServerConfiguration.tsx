
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
import type { Endpoint, ServerConfig, AuthType, AuthLocation, HostingProvider, HostingType } from '@/types';

interface ServerConfigurationProps {
  serverConfig: ServerConfig;
  onConfigChange: (updatedConfig: ServerConfig) => void;
}

const ServerConfiguration = ({ serverConfig, onConfigChange }: ServerConfigurationProps) => {
  const [activeTab, setActiveTab] = useState("general");
  
  const serverConfigSchema = z.object({
    name: z.string().min(3, { message: "Server name must be at least 3 characters" }),
    description: z.string().optional(),
    language: z.enum(["Python", "TypeScript"]),
    authType: z.enum(["None", "API Key", "Bearer Token", "Basic Auth"]),
    authLocation: z.enum(["header", "query", "cookie"]).optional(),
    authName: z.string().optional(),
    hostingProvider: z.enum(["AWS", "GCP", "Azure", "Supabase", "Self-hosted"]),
    hostingType: z.enum(["Serverless", "Container", "VM", "Shared", "Dedicated"]),
    hostingRegion: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof serverConfigSchema>>({
    resolver: zodResolver(serverConfigSchema),
    defaultValues: {
      name: serverConfig.name,
      description: serverConfig.description,
      language: serverConfig.language,
      authType: serverConfig.authentication.type,
      authLocation: serverConfig.authentication.location,
      authName: serverConfig.authentication.name,
      hostingProvider: serverConfig.hosting.provider,
      hostingType: serverConfig.hosting.type,
      hostingRegion: serverConfig.hosting.region,
    },
  });
  
  const authType = form.watch("authType");
  
  const onSubmit = (values: z.infer<typeof serverConfigSchema>) => {
    // Update the server configuration
    onConfigChange({
      ...serverConfig,
      name: values.name,
      description: values.description || '',
      language: values.language,
      authentication: {
        type: values.authType,
        location: values.authLocation,
        name: values.authName,
        value: serverConfig.authentication.value
      },
      hosting: {
        provider: values.hostingProvider,
        type: values.hostingType,
        region: values.hostingRegion,
      }
    });
  };
  
  // Update form when serverConfig changes
  React.useEffect(() => {
    form.reset({
      name: serverConfig.name,
      description: serverConfig.description,
      language: serverConfig.language,
      authType: serverConfig.authentication.type,
      authLocation: serverConfig.authentication.location,
      authName: serverConfig.authentication.name,
      hostingProvider: serverConfig.hosting.provider,
      hostingType: serverConfig.hosting.type,
      hostingRegion: serverConfig.hosting.region,
    });
  }, [serverConfig, form]);
  
  return (
    <div className="w-full">
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
                        value={field.value || ''}
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
                        <SelectItem value="API Key">API Key</SelectItem>
                        <SelectItem value="Basic Auth">Basic Auth</SelectItem>
                        <SelectItem value="Bearer Token">Bearer Token</SelectItem>
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
                          {authType === "API Key" ? "Key Name" : "Header Name"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={authType === "API Key" ? "x-api-key" : "Authorization"} 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {authType === "API Key" 
                            ? "The name of the API key parameter" 
                            : "The name of the authorization header"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {authType === "API Key" && (
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
                              <SelectItem value="cookie">Cookie</SelectItem>
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
                        <SelectItem value="Serverless">Serverless</SelectItem>
                        <SelectItem value="Container">Container</SelectItem>
                        <SelectItem value="VM">Virtual Machine</SelectItem>
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
                      <Input placeholder="us-east-1" {...field} value={field.value || ''} />
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
                <Button type="submit">
                  Apply Changes
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default ServerConfiguration;
