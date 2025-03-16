import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateGoServer } from '@/utils/serverTemplates/goServer';
import { ServerFile, ServerConfig } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function GoDemo() {
  const [generatedFiles, setGeneratedFiles] = useState<ServerFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ServerFile | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  // Sample configuration for the Go MCP server
  const goServerConfig: ServerConfig = {
    name: "Pet Store API",
    description: "A sample Pet Store API MCP server in Go",
    language: "Go",
    authentication: {
      type: "API Key",
      location: "header",
      name: "X-API-Key"
    },
    hosting: {
      provider: "AWS",
      type: "Serverless",
      region: "us-east-1"
    },
    endpoints: [
      {
        id: "1",
        path: "/pets",
        method: "GET",
        description: "List all pets",
        parameters: [
          {
            name: "limit",
            type: "integer",
            required: false,
            description: "Maximum number of pets to return"
          }
        ],
        responses: [],
        mcpType: "resource"
      },
      {
        id: "2",
        path: "/pets/{petId}",
        method: "GET",
        description: "Get a pet by ID",
        parameters: [
          {
            name: "petId",
            type: "string",
            required: true,
            description: "The ID of the pet"
          }
        ],
        responses: [],
        mcpType: "resource"
      },
      {
        id: "3",
        path: "/pets",
        method: "POST",
        description: "Create a new pet",
        parameters: [],
        responses: [],
        mcpType: "tool"
      }
    ]
  };

  // Generate the Go MCP server
  const handleGenerateServer = () => {
    const result = generateGoServer(goServerConfig);
    
    if (result.success && result.files) {
      setGeneratedFiles(result.files);
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
      }
      setIsGenerated(true);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Go MCP Server Generator Demo</CardTitle>
          <CardDescription>
            Generate a Model Context Protocol (MCP) server in Go language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demo demonstrates the generation of a Go MCP server from the Pet Store API. Click the button below to generate the server.
          </p>
          <Button 
            onClick={handleGenerateServer} 
            disabled={isGenerated}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Generate Go MCP Server
          </Button>
        </CardContent>
      </Card>

      {isGenerated && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Generated Files</CardTitle>
              <CardDescription>
                {generatedFiles.length} files generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {generatedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className={`p-2 cursor-pointer rounded ${selectedFile === file ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{file.name}</span>
                        <Badge variant="outline">{file.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedFile ? selectedFile.name : 'No file selected'}
              </CardTitle>
              {selectedFile && (
                <CardDescription>
                  {selectedFile.path} - {selectedFile.type}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <ScrollArea className="h-[500px]">
                  <pre className="p-4 rounded bg-secondary/30 overflow-x-auto">
                    <code>{selectedFile.content}</code>
                  </pre>
                </ScrollArea>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Select a file to view its content
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
