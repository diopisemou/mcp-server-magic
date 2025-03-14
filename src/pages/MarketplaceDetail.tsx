<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, ExternalLink, Github, Server, Wrench, Star, Users, Clock, CopyPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MCPServer } from '@/types';

function MarketplaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    const fetchServer = async () => {
      try {
        setIsLoading(true);
        const mockServer: MCPServer = {
          id: id || '1',
          name: 'Google Drive MCP Server',
          description: 'Access and manage Google Drive files and folders through Claude AI',
          author: 'Anthropic',
          version: '1.2.0',
          stars: 4356,
          downloads: 12890,
          capabilities: [
            {
              type: 'resource',
              name: 'files',
              description: 'List, search, and get information about files in Google Drive'
            },
            {
              type: 'resource',
              name: 'folders',
              description: 'List, search, and get information about folders in Google Drive'
            },
            {
              type: 'tool',
              name: 'createFile',
              description: 'Create a new file in Google Drive'
            },
            {
              type: 'tool',
              name: 'uploadFile',
              description: 'Upload a file to Google Drive'
            },
            {
              type: 'tool',
              name: 'downloadFile',
              description: 'Download a file from Google Drive'
            },
            {
              type: 'tool',
              name: 'deleteFile',
              description: 'Delete a file from Google Drive'
            }
          ],
          tags: ['google', 'drive', 'files', 'storage', 'cloud'],
          updatedAt: '2024-05-15T10:30:00Z'
        };
        setServer(mockServer);
      } catch (error) {
        console.error('Error fetching server details:', error);
        toast.error('Failed to load server details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServer();
  }, [id]);

  const handleCopyCode = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  if (isLoading) {
>>>>>>> 5b9afc5e7f2731526ea4053e9b92fba8434d4a14
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading server details...</p>
        </div>
      </div>
    );
  }
<<<<<<< HEAD

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
=======

  if (!server) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Server not found</p>
          <Button onClick={() => navigate('/marketplace')} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const claudeCode = `
Here is how to use the Google Drive MCP server with Claude:

\`\`\`
{
  "tools": [
    {
      "name": "google_drive",
      "url": "https://mcp-servers.example.com/google-drive",
      "auth": {
        "type": "bearer",
        "token": "YOUR_API_KEY"
      }
    }
  ]
}
\`\`\`

In your prompt to Claude, you can ask about Google Drive files and folders or perform actions on them:

"Can you list my recent files from Google Drive?"
"Upload this document to my Google Drive"
"Search for any spreadsheets in my Google Drive"
  `;

  const pythonCode = `
# Python example for integrating with Google Drive MCP Server

import requests

API_KEY = "your_api_key_here"
MCP_SERVER_URL = "https://mcp-servers.example.com/google-drive"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# List files example
response = requests.get(
    f"{MCP_SERVER_URL}/files",
    headers=headers
)

if response.status_code == 200:
    files = response.json()
    for file in files:
        print(f"File: {file['name']}, ID: {file['id']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
  `;

  const nodejsCode = `
// Node.js example for integrating with Google Drive MCP Server

const axios = require('axios');

const API_KEY = 'your_api_key_here';
const MCP_SERVER_URL = 'https://mcp-servers.example.com/google-drive';

const headers = {
  'Authorization': \`Bearer \${API_KEY}\`,
  'Content-Type': 'application/json'
};

// List files example
async function listFiles() {
  try {
    const response = await axios.get(
      \`\${MCP_SERVER_URL}/files\`,
      { headers }
    );
    
    const files = response.data;
    files.forEach(file => {
      console.log(\`File: \${file.name}, ID: \${file.id}\`);
    });
  } catch (error) {
    console.error('Error:', error.response?.status);
    console.error(error.response?.data);
  }
}

listFiles();
  `;

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate('/marketplace')} className="mb-6 pl-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{server.name}</CardTitle>
                  <CardDescription className="mt-1">{server.description}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {server.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="py-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Author</h3>
                        <p>{server.author}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Version</h3>
                        <p>{server.version}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Stars</h3>
                        <p>{server.stars.toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Downloads</h3>
                        <p>{server.downloads.toLocaleString()}</p>
                      </div>
                    </div>
>>>>>>> 5b9afc5e7f2731526ea4053e9b92fba8434d4a14

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">About this MCP Server</h3>
                      <p className="text-muted-foreground">
                        This MCP server allows AI models like Claude to interact with Google Drive, providing
                        a seamless way to access, manage, and manipulate files and folders. With this
                        integration, users can have Claude search for files, upload new content, organize
                        folders, and more - all through natural language commands.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Github className="h-4 w-4 mr-1" />
                          View on GitHub
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Documentation
                        </Button>
                      </div>
                    </div>
                  </div>
<<<<<<< HEAD

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
=======
                </TabsContent>
                <TabsContent value="capabilities" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Resources</h3>
                      <div className="space-y-3">
                        {server.capabilities
                          .filter((cap) => cap.type === 'resource')
                          .map((capability) => (
                            <div key={capability.name} className="bg-muted/50 p-3 rounded-md">
                              <div className="flex items-start">
                                <Server className="h-5 w-5 text-primary mt-0.5 mr-2" />
                                <div>
                                  <h4 className="font-medium">{capability.name}</h4>
                                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Tools</h3>
                      <div className="space-y-3">
                        {server.capabilities
                          .filter((cap) => cap.type === 'tool')
                          .map((capability) => (
                            <div key={capability.name} className="bg-muted/50 p-3 rounded-md">
                              <div className="flex items-start">
                                <Wrench className="h-5 w-5 text-primary mt-0.5 mr-2" />
                                <div>
                                  <h4 className="font-medium">{capability.name}</h4>
                                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="integration" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Claude Integration</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode(claudeCode, 'Claude code')}
                        >
                          {copiedText === 'Claude code' ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copiedText === 'Claude code' ? 'Copied' : 'Copy'}
                        </Button>
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{claudeCode}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Python Example</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode(pythonCode, 'Python code')}
                        >
                          {copiedText === 'Python code' ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copiedText === 'Python code' ? 'Copied' : 'Copy'}
                        </Button>
                        <pre className="text-sm overflow-x-auto">{pythonCode}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Node.js Example</h3>
                      <div className="relative bg-muted p-4 rounded-md">
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode(nodejsCode, 'Node.js code')}
                        >
                          {copiedText === 'Node.js code' ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copiedText === 'Node.js code' ? 'Copied' : 'Copy'}
                        </Button>
                        <pre className="text-sm overflow-x-auto">{nodejsCode}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>Connect this MCP server to your AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Server URL</h3>
                <div className="flex items-center">
                  <input
                    type="text"
                    value="https://mcp-servers.example.com/google-drive"
                    readOnly
                    className="w-full rounded-md border px-3 py-2 text-sm bg-muted"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() =>
                      handleCopyCode('https://mcp-servers.example.com/google-drive', 'Server URL')
                    }
                  >
                    {copiedText === 'Server URL' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Authentication</h3>
                <div className="space-y-2">
                  <div className="rounded-md border px-4 py-3 text-sm bg-muted/50">
                    <span className="font-medium">Type:</span> Bearer Token
>>>>>>> 5b9afc5e7f2731526ea4053e9b92fba8434d4a14
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Server Package
                </Button>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 rounded-b-lg p-4 text-sm text-muted-foreground">
              This is a sample MCP server for demonstration. In a real application, you would need to register
              for an API key and follow specific installation instructions.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceDetail;
