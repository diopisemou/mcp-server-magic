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
  Download,
  Loader2,
  LucideIcon,
  PanelRight,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateServer } from "@/utils/serverGenerator";
import ServerFiles from "@/components/ServerFiles";

export default function GenerateServer() {
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
        setApiDefinition(apiData);

        if (apiData.parsedDefinition) {
          // If parsed definition exists in the database, use it
          parseEndpoints(apiData.parsedDefinition);
        } else if (apiData.content) {
          // Try to parse the content
          try {
            const contentObj = JSON.parse(apiData.content);
            if (contentObj.parsedDefinition) {
              parseEndpoints(contentObj.parsedDefinition);
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
        const latestDeployment = deploymentData[0];
        setDeployment(latestDeployment);
        setDeploymentId(latestDeployment.id);
        setDeploymentStatus(latestDeployment.status as any);
        setServerUrl(latestDeployment.server_url || null);

        if (latestDeployment.files) {
          setDeploymentFiles(latestDeployment.files);

          if (latestDeployment.status === "success") {
            setGenerationResult({
              success: true,
              serverUrl: latestDeployment.server_url,
              files: latestDeployment.files,
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

      setDeployment(data);
      setDeploymentStatus(data.status as any);

      if (data.server_url) {
        setServerUrl(data.server_url);
      }

      if (data.files) {
        setDeploymentFiles(data.files);
      }

      if (data.status === "success") {
        setGenerationResult({
          success: true,
          serverUrl: data.server_url,
          files: data.files,
        });

        setIsGenerating(false);
        toast.success("Server generated successfully!");
      } else if (data.status === "failed") {
        setGenerationError("Failed to generate server");
        setIsGenerating(false);
        toast.error("Server generation failed");
      }
    } catch (error) {
      console.error("Error checking deployment status:", error);
    }
  };

  const parseEndpoints = (parsedDefinition: any) => {
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

    setEndpoints(exampleEndpoints);
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
        language: config.language as "TypeScript" | "Python",
        authentication: {
          type: config.authentication_type as any,
          location: config.authentication_details?.location,
          name: config.authentication_details?.name,
          value: config.authentication_details?.value,
        },
        hosting: {
          provider: config.hosting_provider as any,
          type: config.hosting_type as any,
          region: config.hosting_region,
        },
        endpoints: endpoints,
      };

      // Call the edge function for server generation (heavy work)
      const { data, error } = await supabase.functions.invoke(
        "generate-server",
        {
          body: {
            deploymentId: deploymentData.id,
            config: serverConfig,
          },
        },
      );

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      // The edge function should update the deployment record
      // We'll poll for updates to get the result
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
              <ServerFiles files={deploymentFiles} projectName={project.name} />
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
