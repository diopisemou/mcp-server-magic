import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogViewer } from "@/components/LogViewer";
import {
  CheckCircle,
  Cog,
  Download,
  ExternalLink,
  Loader2,
  LucideIcon,
  PanelRight,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { generateServer } from "@/utils/serverGeneratorv1";
import ServerFiles from "@/components/ServerFiles";
import ServerPreview from "@/components/ServerPreview";
import { ServerGenerationSection } from "@/components/ServerGenerationSection";

export const GenerateServerV1 = () => {
  const { projectId, configId } = useParams<
    { projectId: string; configId: string }
  >();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const [activeTab, setActiveTab] = useState("config");

  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    fetchProject();
  }, [projectId]);

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

  const fetchProject = async () => {
    try {
      if (!projectId) return;

      const { data, error } = await supabase
        .from("mcp_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);

      const { dataApiDef, errorDataApiDef } = await supabase
        .from("api_definitions")
        .select("*")
        .eq("project_id", data.id)
        .single();

      // Fetch API definition from storage
      if (data.endpoint_definition) {
        await fetchApiDefinition(data.api_definition_id);
      }

      // Fetch server config
      if (data.server_config_id) {
        await fetchServerConfig(data.server_config_id);
      }

      // Set server URL if available
      if (data.deployment_url) {
        setServerUrl(data.deployment_url);
      }
    } catch (error: any) {
      toast.error("Error fetching project: " + error.message);
    }
  };

  const fetchApiDefinition = async (apiDefinitionId: string) => {
    try {
      const { data, error } = await supabase
        .from("api_definitions")
        .select("*")
        .eq("id", apiDefinitionId)
        .single();

      if (error) throw error;

      // Fetch the actual API definition from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("api-definitions")
        .download(`${apiDefinitionId}`);

      if (fileError) throw fileError;

      const definition = await fileData.text();
      const apiDef = {
        id: data.id,
        name: data.name,
        description: data.description,
        format: data.format,
        definition: definition,
      };

      setApiDefinition(apiDef);

      // Extract endpoints from the API definition
      if (definition) {
        try {
          const extractedEndpoints = await extractEndpoints(
            definition,
            data.format,
          );
          console.log("Extracted endpoints:", extractedEndpoints);
          setEndpoints(extractedEndpoints);

          // Also update the server config with these endpoints
          setServerConfig((prev) =>
            prev
              ? {
                ...prev,
                endpoints: extractedEndpoints,
              }
              : null
          );

          // Fetch saved endpoints from the database as well
          const { data: endpointData, error: endpointError } = await supabase
            .from("endpoints")
            .select("*")
            .eq("api_definition_id", apiDefinitionId);

          if (!endpointError && endpointData && endpointData.length > 0) {
            console.log("Found saved endpoints:", endpointData);
            // If we have saved endpoints, use those instead
            setEndpoints(endpointData);
          }
        } catch (extractError) {
          console.error("Error extracting endpoints:", extractError);
        }
      }
    } catch (err) {
      console.error("Error fetching API definition:", err);
    }
  };

  const fetchServerConfig = async (configId: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from("server_configs")
        .download(`${projectId}/${configId}.json`);

      if (error) throw error;

      const config = JSON.parse(await data.text()) as ServerConfig;
      setServerConfig(config);
    } catch (error: any) {
      toast.error("Error fetching server configuration: " + error.message);
    }
  };

  const extractEndpointsFromDefinition = (
    parsedDefinition: any,
  ): Endpoint[] => {
    // This is a placeholder function - implement actual extraction logic based on your API format
    const extractedEndpoints: Endpoint[] = [];

    try {
      // Example for OpenAPI format
      if (parsedDefinition.paths) {
        Object.entries(parsedDefinition.paths).forEach(
          ([path, pathItem]: [string, any]) => {
            Object.entries(pathItem).forEach(
              ([method, operation]: [string, any]) => {
                const endpoint: Endpoint = {
                  path,
                  method: method.toUpperCase() as any,
                  description: operation.summary || operation.description || "",
                  parameters: [],
                  responses: [],
                  mcpType: "none",
                };

                // Extract parameters
                if (operation.parameters) {
                  endpoint.parameters = operation.parameters.map((
                    param: any,
                  ) => ({
                    name: param.name,
                    type: param.schema?.type || "string",
                    required: param.required || false,
                    description: param.description || "",
                  }));
                }

                // Extract responses
                if (operation.responses) {
                  endpoint.responses = Object.entries(operation.responses).map((
                    [statusCode, response]: [string, any],
                  ) => ({
                    statusCode: parseInt(statusCode),
                    description: response.description || "",
                    schema: response.schema || response.content,
                  }));
                }

                extractedEndpoints.push(endpoint);
              },
            );
          },
        );
      }
    } catch (error) {
      console.error("Error extracting endpoints:", error);
    }

    return extractedEndpoints;
  };

  const handleGenerateServer = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      if (!apiDefinition) {
        throw new Error(
          "API definition is missing. Please import an API definition first.",
        );
      }

      if (!endpoints || endpoints.length === 0) {
        throw new Error(
          "No endpoints configured. Please configure endpoints first.",
        );
      }

      if (!serverConfig) {
        throw new Error(
          "Server configuration is missing. Please configure your server first.",
        );
      }

      // Generate server code
      const result = await generateServer(serverConfig, endpoints);
      setServerFiles(result.files);
      setServerUrl(result.deploymentUrl || "https://example.com/api");

      // Show success toast
      toast.success("Server generated successfully");
    } catch (err: any) {
      console.error("Error generating server:", err);
      setError(`Error generating server:\n\n${err.message}`);
      toast.error("Failed to generate server");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedCode = async (codeContent: string) => {
    try {
      const timestamp = new Date().toISOString();
      const fileName = `server_${timestamp}.txt`;

      const { error } = await supabase
        .storage
        .from("generated_code")
        .upload(
          `${projectId}/${fileName}`,
          new Blob([codeContent], { type: "text/plain" }),
        );

      if (error) throw error;

      // Update project record with reference to the code file
      await supabase
        .from("mcp_projects")
        .update({
          generated_code_file: fileName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    } catch (error: any) {
      console.error("Error saving generated code:", error);
    }
  };

  const updateProjectServerUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from("mcp_projects")
        .update({
          deployment_url: url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating project server URL:", error);
    }
  };

  const handleDownloadCode = () => {
    if (serverFiles.length === 0) {
      toast.error("No code generated to download");
      return;
    }

    // Create a zip file with all generated files
    import("jszip").then(({ default: JSZip }) => {
      const zip = new JSZip();

      serverFiles.forEach((file) => {
        // Create directory structure if needed
        const filePath = file.path === "/"
          ? file.name
          : `${file.path}${file.name}`;
        zip.file(filePath, file.content);
      });

      zip.generateAsync({ type: "blob" }).then((content) => {
        const element = document.createElement("a");
        element.href = URL.createObjectURL(content);
        element.download = `mcp-server-${projectId}.zip`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    }).catch((error) => {
      console.error("Error creating zip file:", error);
      toast.error("Error creating zip file");
    });
  };

  const handleTestServer = async () => {
    if (!serverUrl) {
      toast.error("No server available to test");
      return;
    }

    setLogs(
      (prevLogs) => [...prevLogs, {
        type: "info",
        message: `Testing server at ${serverUrl}...`,
      }],
    );

    try {
      // For now just simulate a test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLogs(
        (prevLogs) => [...prevLogs, {
          type: "success",
          message: "Server test completed successfully",
        }],
      );
      toast.success("Server test completed");
    } catch (error: any) {
      setLogs(
        (prevLogs) => [...prevLogs, {
          type: "error",
          message: `Server test failed: ${error.message}`,
        }],
      );
      toast.error("Server test failed");
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generate MCP Server</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Projects
        </Button>
      </div>

      <Separator className="my-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>
                Configure and generate your MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerGenerationSection
                serverUrl={serverUrl}
                isGenerating={isGenerating}
                error={error}
                config={serverConfig}
                apiDefinition={apiDefinition}
                endpoints={endpoints}
                onGenerateServer={handleGenerateServer}
                onDownloadCode={handleDownloadCode}
                onTestServer={handleTestServer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Server Preview</CardTitle>
              <CardDescription>
                Preview the endpoints and generated code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerPreview
                endpoints={endpoints}
                serverUrl={serverUrl}
                isGenerating={isGenerating}
                config={serverConfig}
                onGenerateServer={handleGenerateServer}
                onDownloadCode={handleDownloadCode}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>
                View the logs from the generation and deployment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogViewer logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Deployment</CardTitle>
              <CardDescription>
                View the deployment process and status
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                          <p className="text-sm font-medium mb-1">Server URL</p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerateServerV1;
