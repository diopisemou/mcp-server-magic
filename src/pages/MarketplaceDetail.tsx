
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, ExternalLink, Github, Server, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MCPServer } from '@/types';

// Use Wrench instead of Tool which doesn't exist in lucide-react
function MarketplaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    // Fetch server details
    const fetchServer = async () => {
      try {
        setIsLoading(true);
        // This would normally be an API call
        // For demo, let's simulate an API response
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
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading server details...</p>
        </div>
      </div>
    );
  }

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
