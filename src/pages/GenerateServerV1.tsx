import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ApiDefinition,
  Deployment,
  Endpoint,
  GenerationResult,
  Project,
  ServerConfig,
  ServerConfiguration,
  ServerFile,
} from "@/types";
import { toast } from "sonner";
import {
  CheckCircle,
  Cog,
  Copy,
  Download,
  Loader2,
  LucideIcon,
  PanelRight,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ServerFiles from "@/components/ServerFiles";
import PublishToMarketplace from "@/components/PublishToMarketplace";

// Define database response types for type safety
interface DbDeployment {
  id: string;
  project_id: string;
  configuration_id: string;
  status: string;
  server_url?: string;
  logs?: string;
  files?: unknown; // Could be ServerFile[] or string or undefined
  created_at: string;
  updated_at: string;
}

export default function GenerateServerV1() {
  const { projectId, configId } = useParams<
    { projectId: string; configId: string }
  >();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<ServerConfiguration | null>(null);
  const [apiDefinition, setApiDefinition] = useState<ApiDefinition | null>(
    null,
  );
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<
    GenerationResult | null
  >(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "pending" | "processing" | "success" | "failed"
  >("pending");
  const [deploymentFiles, setDeploymentFiles] = useState<ServerFile[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    if (projectId && configId) {
      fetchData();
    }
  }, [projectId, configId]);

  // Poll for deployment status updates
  useEffect(() => {
    let intervalId: number;

    if (
      deploymentId &&
      (deploymentStatus === "pending" || deploymentStatus === "processing")
    ) {
      intervalId = window.setInterval(() => {
        checkDeploymentStatus();
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deploymentId, deploymentStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("mcp_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        throw projectError;
      }

      setProject(projectData);

      // Fetch server configuration
      const { data: configData, error: configError } = await supabase
        .from("server_configurations")
        .select("*")
        .eq("id", configId)
        .single();

      if (configError) {
        throw configError;
      }

      setConfig(configData);

      // Fetch API definition for the project
      const { data: apiData, error: apiError } = await supabase
        .from("api_definitions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (apiError) {
        if (apiError.code !== "PGRST116") { // No rows returned
          throw apiError;
        }
      } else {
        // Cast the API data to the right type
        setApiDefinition(apiData as unknown as ApiDefinition);

        if ('parsedDefinition' in apiData && apiData.parsedDefinition) {
          // If parsed definition exists in the database, use it
          parseEndpoints(apiData.parsedDefinition);
        } else if (apiData.endpoint_definition) {
          // Try to use endpoint_definition if available
          try {
            // Safe cast with runtime validation
            if (Array.isArray(apiData.endpoint_definition)) {
              const safeEndpoints = apiData.endpoint_definition.map((e: any) => ({
                id: e.id || '',
                path: e.path || '',
                method: e.method || 'GET',
                description: e.description || '',
                parameters: Array.isArray(e.parameters) ? e.parameters : [],
                responses: Array.isArray(e.responses) ? e.responses : [],
                mcpType: e.mcpType || 'resource',
                selected: e.selected !== false
              }));
              parseEndpoints(safeEndpoints);
            }
          } catch (error) {
            console.error("Error parsing API definition endpoints:", error);
          }
        } else if (apiData.content) {
          // Try to parse the content if needed
          try {
            const contentObj = JSON.parse(apiData.content as string);
            if (contentObj.endpoint_definition) {
              parseEndpoints(contentObj.endpoint_definition);
            }
          } catch (error) {
            console.error("Error parsing API definition content:", error);
          }
        }
      }

      // Check if there's an existing deployment for this configuration
      const { data: deploymentData, error: deploymentError } = await supabase
        .from("deployments")
        .select("*")
        .eq("configuration_id", configId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (deploymentError) {
        throw deploymentError;
      }

      if (deploymentData && deploymentData.length > 0) {
        // Process the latest deployment data
        const latestDeployment = deploymentData[0] as DbDeployment;
        
        // Make sure the deployment has the right type
        const typedDeployment: Deployment = {
          ...latestDeployment,
          files: processDeploymentFiles(latestDeployment.files),
          status: (latestDeployment.status as "pending" | "processing" | "success" | "failed") || "pending"
        };
        
        setDeployment(typedDeployment);
        setDeploymentId(typedDeployment.id);
        setDeploymentStatus(typedDeployment.status);
        setServerUrl(typedDeployment.server_url || null);

        if (typedDeployment.files && typedDeployment.files.length > 0) {
          setDeploymentFiles(typedDeployment.files);

          if (typedDeployment.status === "success") {
            setGenerationResult({
              success: true,
              serverUrl: typedDeployment.server_url,
              files: typedDeployment.files,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process deployment files from different formats
  const processDeploymentFiles = (files: unknown): ServerFile[] => {
    if (!files) return [];
    
    if (Array.isArray(files)) {
      return files as ServerFile[];
    }
    
    if (typeof files === 'string') {
      try {
        return JSON.parse(files) as ServerFile[];
      } catch (e) {
        console.error("Failed to parse deployment files string:", e);
        return [];
      }
    }
    
    return [];
  };

  const checkDeploymentStatus = async () => {
    if (!deploymentId) return;

    try {
      const { data, error } = await supabase
        .from("deployments")
        .select("*")
        .eq("id", deploymentId)
        .single();

      if (error) {
        throw error;
      }

      // Cast the data to the right type with safety checks
      const dbData = data as DbDeployment;
      const typedData: Deployment = {
        ...dbData,
        files: processDeploymentFiles(dbData.files),
        status: (dbData.status as "pending" | "processing" | "success" | "failed") || "pending"
      };
      
      setDeployment(typedData);
      setDeploymentStatus(typedData.status);

      if (typedData.server_url) {
        setServerUrl(typedData.server_url);
      }

      if (typedData.files && typedData.files.length > 0) {
        setDeploymentFiles(typedData.files);
      }

      if (typedData.status === "success") {
        setGenerationResult({
          success: true,
          serverUrl: typedData.server_url,
          files: typedData.files || [],
        });

        setIsGenerating(false);
        toast.success("Server generated successfully!");
      } else if (dbData.status === "failed") {
        setGenerationError("Failed to generate server");
        setIsGenerating(false);
        toast.error("Server generation failed");
      }
    } catch (error) {
      console.error("Error checking deployment status:", error);
    }
  };

  const parseEndpoints = (parsedDefinition: unknown): void => {
    // This would be replaced with actual logic to extract endpoints from parsed definition
    // For now, let's assume we have some example endpoints
    const exampleEndpoints: Endpoint[] = [
      {
        id: "get-users",
        path: "/users",
        method: "GET",
        description: "Get all users",
        parameters: [
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Number of users to return",
          },
        ],
        responses: [
          { statusCode: 200, description: "Success", schema: { users: [] } },
        ],
        mcpType: "resource",
        selected: true,
      },
      {
        id: "get-user",
        path: "/users/{id}",
        method: "GET",
        description: "Get a user by ID",
        parameters: [
          {
            name: "id",
            type: "string",
            required: true,
            description: "User ID",
          },
        ],
        responses: [
          { statusCode: 200, description: "Success", schema: { user: {} } },
          {
            statusCode: 404,
            description: "User not found",
            schema: { error: "User not found" },
          },
        ],
        mcpType: "resource",
        selected: true,
      },
      {
        id: "create-user",
        path: "/users",
        method: "POST",
        description: "Create a new user",
        parameters: [
          {
            name: "name",
            type: "string",
            required: true,
            description: "User name",
          },
          {
            name: "email",
            type: "string",
            required: true,
            description: "User email",
          },
        ],
        responses: [
          { statusCode: 201, description: "Created", schema: { user: {} } },
          {
            statusCode: 400,
            description: "Invalid input",
            schema: { error: "Invalid input" },
          },
        ],
        mcpType: "tool",
        selected: true,
      },
    ];

    //setEndpoints(exampleEndpoints);
    setEndpoints(Array.isArray(parsedDefinition) ? parsedDefinition as Endpoint[] : exampleEndpoints);
  };

  const generateServerCode = async () => {
    if (!config || !project) {
      toast.error("Missing required configuration");
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);

      // Create a new deployment record
      const { data: deploymentData, error: deploymentError } = await supabase
        .from("deployments")
        .insert([
          {
            project_id: projectId,
            configuration_id: configId,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (deploymentError) {
        throw deploymentError;
      }

      setDeploymentId(deploymentData.id);
      setDeploymentStatus("pending");

      // Convert server config to the format expected by the server generation function
      const serverConfig: ServerConfig = {
        name: config.name,
        description: config.description || "",
        language: config.language as "TypeScript" | "Python" | "Go",
        authentication: {
          type: config.authentication_type as "None" | "API Key" | "Bearer Token" | "Basic Auth",
          location: config.authentication_details?.location,
          name: config.authentication_details?.name,
          value: config.authentication_details?.value,
        },
        hosting: {
          provider: config.hosting_provider as "AWS" | "GCP" | "Azure" | "Self-hosted",
          type: config.hosting_type as "Serverless" | "Container" | "VM",
          region: config.hosting_region,
        },
        endpoints: endpoints,
      };

      // Use the common utility function to generate the server
      // This version still uses the edge function by default
      await import('@/utils/generateServerForUI').then(async ({ generateServerForUI }) => {
        await generateServerForUI({
          deploymentId: deploymentData.id,
          config: serverConfig,
          useEdgeFunction: false, // Use edge function for heavy processing
        });
      });

      // The edge function updates the deployment record
      // We'll poll for updates to get the result (handled by the useEffect)
    } catch (error) {
      console.error("Error generating server:", error);
      setGenerationError(
        error instanceof Error ? error.message : "An error occurred",
      );
      setIsGenerating(false);

      // Update deployment status to failed if we have a deployment ID
      if (deploymentId) {
        await supabase
          .from("deployments")
          .update({
            status: "failed",
            logs: JSON.stringify({
              timestamp: new Date().toISOString(),
              error: error instanceof Error
                ? error.message
                : "An unknown error occurred",
            }),
          })
          .eq("id", deploymentId);
      }

      toast.error("Failed to generate server");
    }
  };

  const getStatusIcon = (): [LucideIcon, string] => {
    switch (deploymentStatus) {
      case "success":
        return [CheckCircle, "text-green-500"];
      case "failed":
        return [XCircle, "text-red-500"];
      case "processing":
        return [RefreshCw, "text-blue-500 animate-spin"];
      default:
        return [Cog, "text-gray-500"];
    }
  };

  const [StatusIcon, statusIconClass] = getStatusIcon();

  const startServerGeneration = async () => {
    if (!project || !config) {
      toast.error("Project or configuration not found");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);

    try {
      // For the purposes of this file, we'll create a mock server generation
      // In a real implementation, this would call an actual API

      // Create a new deployment record
      const deploymentData = {
        project_id: projectId,
        configuration_id: configId,
        status: "processing" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newDeployment, error: deploymentError } = await supabase
        .from("deployments")
        .insert(deploymentData)
        .select()
        .single();

      if (deploymentError) {
        throw deploymentError;
      }

      // Apply proper typing to the new deployment
      const typedDeployment: Deployment = {
        ...(newDeployment as DbDeployment),
        files: [],
        status: "processing"
      };
      
      setDeployment(typedDeployment);
      setDeploymentId(typedDeployment.id);
      setDeploymentStatus("processing");

      // Start checking for status updates
      checkDeploymentStatus();
    } catch (error) {
      console.error("Error starting server generation:", error);
      setGenerationError("Failed to start server generation");
      setIsGenerating(false);
      toast.error("Failed to start server generation");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !config) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load project or configuration
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/projects")}>
              Go to Projects
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate MCP Server</h1>
        <div className="flex items-center">
          <Badge className="mr-2">{config.language}</Badge>
          <Badge variant="outline" className="flex items-center">
            <PanelRight className="h-3 w-3 mr-1" />
            {config.name}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Server configuration and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Project Details</h3>
                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Project Name</p>
                      <p className="text-sm text-muted-foreground">
                        {project.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Server Name</p>
                      <p className="text-sm text-muted-foreground">
                        {config.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">
                        {config.language}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {config.authentication_type}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Hosting Provider</p>
                      <p className="text-sm text-muted-foreground">
                        {config.hosting_provider}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Hosting Type</p>
                      <p className="text-sm text-muted-foreground">
                        {config.hosting_type}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Deployment Status</h3>
                  {deployment
                    ? (
                      <div className="mt-4">
                        <div className="flex items-center mb-4">
                          <StatusIcon
                            className={`h-5 w-5 mr-2 ${statusIconClass}`}
                          />
                          <span className="font-medium capitalize">
                            {deploymentStatus}
                          </span>
                        </div>

                        {serverUrl && (
                          <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm font-medium mb-1">
                              Server URL
                            </p>
                            <div className="flex items-center">
                              <code className="bg-muted-foreground/20 px-2 py-1 rounded text-sm flex-1 overflow-hidden text-ellipsis">
                                {serverUrl}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                                onClick={() =>
                                  navigator.clipboard.writeText(serverUrl)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                    : (
                      <p className="text-muted-foreground mt-2">
                        No deployments yet
                      </p>
                    )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/projects/${projectId}/configure/${configId}`)}
              >
                Edit Configuration
              </Button>
              <Button
                onClick={generateServerCode}
                disabled={isGenerating}
                className="space-x-2"
              >
                {isGenerating
                  ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  )
                  : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      <span>Generate Server</span>
                    </>
                  )}
              </Button>
            </CardFooter>
          </Card>

          {/* Generation Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Server Generation
              </CardTitle>
              <CardDescription>
                Generate your MCP server based on the configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationResult
                ? (
                  <div className="space-y-4">
                    {generationResult.success
                      ? (
                        <>
                          <div className="flex items-center text-green-500 mb-4">
                            <CheckCircle className="mr-2 h-5 w-5" />
                            <span>Server generated successfully!</span>
                          </div>

                          {serverUrl && (
                            <div className="p-4 bg-muted rounded-md">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">
                                  Server URL:
                                </p>
                                <div className="flex items-center">
                                  <code className="bg-background p-1 rounded text-sm">
                                    {serverUrl}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(serverUrl);
                                      toast.success(
                                        "Server URL copied to clipboard",
                                      );
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {deploymentFiles.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-lg font-semibold mb-2">
                                Generated Files
                              </h3>
                              <ServerFiles files={deploymentFiles} />
                            </div>
                          )}
                        </>
                      )
                      : (
                        <div className="flex items-center text-red-500 mb-4">
                          <XCircle className="mr-2 h-5 w-5" />
                          <span>
                            {generationError || "Server generation failed."}
                          </span>
                        </div>
                      )}
                  </div>
                )
                : isGenerating
                ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Generating server...</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      >
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      This may take a few minutes. Please don't close this page.
                    </p>
                  </div>
                )
                : (
                  <div className="space-y-4">
                    <p>
                      Ready to generate your MCP server. Click the button below
                      to start the process.
                    </p>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-normal">
                        <div className="flex items-center">
                          <span className="mr-1">{config.language}</span>
                        </div>
                      </Badge>

                      <Badge variant="outline" className="font-normal">
                        <div className="flex items-center">
                          <span className="mr-1">
                            {config.authentication_type}
                          </span>
                        </div>
                      </Badge>

                      <Badge variant="outline" className="font-normal">
                        <div className="flex items-center">
                          <span className="mr-1">
                            {config.hosting_provider}
                          </span>
                        </div>
                      </Badge>

                      <Badge variant="outline" className="font-normal">
                        <div className="flex items-center">
                          <span className="mr-1">{config.hosting_type}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {generationResult
                ? (
                  <>

<div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => startServerGeneration()}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Server
                      </Button>

                      {deployment && generationResult.success && (
                        <PublishToMarketplace
                          deployment={deployment}
                          projectName={project.name}
                          onPublished={(listing) => {
                            toast.success("Server published to marketplace!");
                          }}
                        />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => startServerGeneration()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Server
                    </Button>

                    {generationResult.success && serverUrl && (
                      <Button
                        variant="default"
                        onClick={() => window.open(serverUrl, "_blank")}
                      >
                        <PanelRight className="mr-2 h-4 w-4" />
                        Open Server
                      </Button>
                    )}
                  </>
                )
                : <div></div>}
            </CardFooter>
          </Card>

          {generationError && (
            <Card className="mt-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">
                      Generation Error
                    </h3>
                    <p className="text-red-700 text-sm">{generationError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {deploymentFiles.length > 0 && (
            <div className="mt-6">
              <ServerFiles files={deploymentFiles} />
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                {endpoints.length} endpoints mapped to MCP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {endpoints.map((endpoint) => (
                  <li key={endpoint.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={endpoint.mcpType !== "none"
                          ? "default"
                          : "outline"}
                      >
                        {endpoint.mcpType !== "none"
                          ? endpoint.mcpType
                          : "standard"}
                      </Badge>
                      <Badge variant="secondary">{endpoint.method}</Badge>
                    </div>
                    <p className="font-medium mt-2">{endpoint.path}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {endpoint.description || "No description"}
                    </p>
                  </li>
                ))}
                {endpoints.length === 0 && (
                  <li className="text-muted-foreground text-center py-4">
                    No endpoints found
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
