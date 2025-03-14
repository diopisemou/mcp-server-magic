import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Download,
  PenTool,
  Server,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import HeaderLayout from "@/components/layouts/HeaderLayout";
import { MCPServer } from "@/types";

// Mock server data (same as in Marketplace.tsx)
const mockServers: MCPServer[] = [
  {
    id: "1",
    name: "OpenWeather MCP",
    description:
      "Access current weather data and forecasts for cities worldwide",
    author: "WeatherAPI Team",
    version: "1.2.0",
    stars: 245,
    downloads: 5432,
    capabilities: [
      {
        type: "resource",
        name: "getCurrentWeather",
        description: "Get current weather for a location",
      },
      {
        type: "resource",
        name: "getForecast",
        description: "Get weather forecast for a location",
      },
    ],
    tags: ["weather", "forecast", "geolocation"],
    updatedAt: "2025-02-20",
  },
  {
    id: "2",
    name: "News MCP",
    description: "Access the latest news articles from various sources",
    author: "NewsAPI",
    version: "1.0.5",
    stars: 198,
    downloads: 3891,
    capabilities: [
      {
        type: "resource",
        name: "getTopHeadlines",
        description: "Get top news headlines",
      },
      {
        type: "resource",
        name: "searchNews",
        description: "Search for news articles",
      },
    ],
    tags: ["news", "articles", "media"],
    updatedAt: "2025-01-15",
  },
  {
    id: "3",
    name: "Database MCP",
    description: "Store and retrieve structured data in the cloud",
    author: "CloudDB",
    version: "2.1.0",
    stars: 412,
    downloads: 8901,
    capabilities: [
      {
        type: "tool",
        name: "storeData",
        description: "Store data in the database",
      },
      {
        type: "tool",
        name: "queryData",
        description: "Query data from the database",
      },
      { type: "tool", name: "updateData", description: "Update existing data" },
      {
        type: "tool",
        name: "deleteData",
        description: "Delete data from the database",
      },
    ],
    tags: ["database", "storage", "cloud"],
    updatedAt: "2025-03-05",
  },
  {
    id: "4",
    name: "Code Translator MCP",
    description: "Translate code between different programming languages",
    author: "CodeAI Team",
    version: "1.1.2",
    stars: 325,
    downloads: 6789,
    capabilities: [
      {
        type: "tool",
        name: "translateCode",
        description: "Translate code between languages",
      },
      {
        type: "tool",
        name: "formatCode",
        description: "Format code according to language standards",
      },
    ],
    tags: ["code", "programming", "translation"],
    updatedAt: "2025-02-28",
  },
];

export default function MarketplaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (id) {
      const foundServer = mockServers.find((s) => s.id === id);
      if (foundServer) {
        setServer(foundServer);
      } else {
        toast.error("Server not found");
        navigate("/marketplace");
      }
    }
  }, [id, navigate]);

  if (!server) {
    return (
      <HeaderLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading server details...</p>
          </div>
        </div>
      </HeaderLayout>
    );
  }

  const handleCopyToClipboard = () => {
    const capabilitiesText = server.capabilities
      .map((cap) =>
        `  - ${
          cap.type === "resource" ? "Resource" : "Tool"
        }: ${cap.name} - ${cap.description}`
      )
      .join("\n");

    const textToCopy = `
Use the ${server.name} MCP Server:

URL: https://api.mcpmarketplace.com/servers/${server.id}
Capabilities:
${capabilitiesText}

// Example usage:
In Claude, you can reference this server in your prompts:
"Please use the ${server.name} to [perform specific action]"
    `.trim();

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess(true);
        toast.success("Integration instructions copied to clipboard");
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  return (
    <HeaderLayout>
      <div className="container mx-auto py-10">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/marketplace")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{server.name}</h1>
            <p className="text-muted-foreground mb-4">
              by {server.author} • v{server.version}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {server.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex gap-2">
              <Star className="h-4 w-4" />
              Star ({server.stars})
            </Button>
            <Button variant="outline" className="flex gap-2">
              <Download className="h-4 w-4" />
              Download ({server.downloads})
            </Button>
            <Button
              variant="default"
              className="flex gap-2"
              onClick={handleCopyToClipboard}
            >
              {copySuccess
                ? <CheckCircle className="h-4 w-4" />
                : <Copy className="h-4 w-4" />}
              Integration Instructions
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>About this MCP Server</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{server.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-medium mb-2">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Real-time data access</li>
                      <li>Fast response times</li>
                      <li>Simple integration with AI models</li>
                      <li>Detailed documentation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Updated
                        </p>
                        <p className="font-medium">{server.updatedAt}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Downloads
                        </p>
                        <p className="font-medium">{server.downloads}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stars</p>
                        <p className="font-medium">{server.stars}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Version</p>
                        <p className="font-medium">{server.version}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>
                  This MCP server provides the following capabilities to AI
                  models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {server.capabilities.map((capability, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {capability.type === "resource"
                          ? <Server className="h-4 w-4 text-blue-500" />
                          : <PenTool className="h-4 w-4 text-amber-500" />}
                        <h3 className="font-medium">
                          {capability.name}
                          <Badge variant="outline" className="ml-2">
                            {capability.type}
                          </Badge>
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Instructions</CardTitle>
                <CardDescription>
                  How to integrate this MCP server with AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Claude Integration</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can use this MCP server with Claude by adding it as a
                      context source:
                    </p>
                    <div className="bg-muted p-4 rounded-md relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleCopyToClipboard}
                      >
                        {copySuccess
                          ? <CheckCircle className="h-3 w-3" />
                          : <Copy className="h-3 w-3" />}
                      </Button>
                      <pre className="text-xs overflow-x-auto">
                        <code>{`
Use the ${server.name} MCP Server:

URL: https://api.mcpmarketplace.com/servers/${server.id}
Capabilities:
${server.capabilities.map(cap => `  - ${cap.type === 'resource' ? 'Resource' : 'Tool'}: ${cap.name} - ${cap.description}`).join('\n')}

// Example usage:
In Claude, you can reference this server in your prompts:
"Please use the ${server.name} to [perform specific action]"
                        `}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">API Access</h3>
                    <p className="text-sm text-muted-foreground">
                      If you want to integrate this MCP server with your own
                      applications, you can use the following API endpoint:
                    </p>
                    <div className="bg-muted p-4 rounded-md mt-2">
                      <code className="text-xs">
                        https://api.mcpmarketplace.com/servers/{server.id}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-md">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Need help with integration? Check out our
                      <a href="/docs" className="text-blue-600 underline ml-1">
                        Documentation
                      </a>
                      or contact our support team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HeaderLayout>
  );
}
