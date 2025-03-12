
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationResult, ServerFile } from '@/types';
import { AlertCircle, Check, Download, Copy, ExternalLink, FileCode, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface GenerationResultProps {
  result: GenerationResult;
  onRestart: () => void;
}

const GenerationResult: React.FC<GenerationResultProps> = ({ result, onRestart }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const downloadFile = (file: ServerFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    if (!result.files || result.files.length === 0) return;
    
    // In a real app, this would create a zip file
    // For this demo, we'll just download the first file
    if (result.files.length > 0) {
      downloadFile(result.files[0]);
      toast.success('Downloaded file. In a real app, this would download all files as a zip');
    }
  };

  if (!result.success) {
    return (
      <section className="py-24 bg-white relative">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            <Card className="border-destructive">
              <CardHeader className="bg-destructive/10">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Generation Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="mb-4">{result.error || 'An unknown error occurred during server generation.'}</p>
                <Button onClick={onRestart} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Start Over
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white relative">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              Generation Complete
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Your MCP Server is Ready
            </h2>
            <p className="text-muted-foreground">
              Your server has been generated and deployed successfully. Use the details below to configure your AI models.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border">
                <TabsList className="p-0 h-auto bg-transparent border-0 overflow-auto w-full flex">
                  <TabsTrigger 
                    value="overview" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="code" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    Generated Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documentation" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
                  >
                    Documentation
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                      <div className="flex gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">Server Generated Successfully</p>
                          <p className="text-sm text-green-700 mt-1">
                            Your MCP Server is now deployed and ready to use with AI models that support the Model Context Protocol.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Server Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="font-medium">Server URL:</div>
                            <div className="col-span-2 font-mono flex items-center gap-2">
                              {result.serverUrl || 'https://example-mcp-server.supabase.co'}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => copyToClipboard(result.serverUrl || 'https://example-mcp-server.supabase.co')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="font-medium">Status:</div>
                            <div className="col-span-2 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                              Active
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="font-medium">Resources:</div>
                            <div className="col-span-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block">
                              {result.files?.filter(file => file.name.includes('resource')).length || 0}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="font-medium">Tools:</div>
                            <div className="col-span-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block">
                              {result.files?.filter(file => file.name.includes('tool')).length || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm">1</div>
                            <div>
                              <h4 className="font-medium">Configure Your AI Model</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Add your MCP server URL to your AI model configuration to enable it to use your API.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm">2</div>
                            <div>
                              <h4 className="font-medium">Test Your Integration</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Test the integration by having your AI model access data or perform actions using your API.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm">3</div>
                            <div>
                              <h4 className="font-medium">Monitor Usage</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Monitor the performance and usage of your MCP server in the Supabase dashboard.
                              </p>
                              <Button variant="outline" size="sm" className="mt-2 flex items-center gap-2">
                                View Dashboard
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-0">
                  {!result.files || result.files.length === 0 ? (
                    <div className="text-center py-8">
                      <p>No files were generated.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-6">
                      <div className="col-span-1 border-r border-border pr-4">
                        <div className="mb-4 flex justify-between items-center">
                          <h3 className="font-medium">Files</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={downloadAllFiles}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>All</span>
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                          {result.files.map((file, index) => (
                            <button
                              key={index}
                              className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                                activeFileIndex === index 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-secondary'
                              }`}
                              onClick={() => setActiveFileIndex(index)}
                            >
                              {file.type === 'code' ? (
                                <FileCode className="h-4 w-4 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{file.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="col-span-3">
                        {result.files[activeFileIndex] && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium font-mono text-sm">
                                {result.files[activeFileIndex].path}/{result.files[activeFileIndex].name}
                              </h3>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(result.files[activeFileIndex].content)}
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => downloadFile(result.files[activeFileIndex])}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </Button>
                              </div>
                            </div>
                            
                            <div className="bg-muted rounded-md overflow-hidden">
                              <pre className="p-4 text-sm font-mono overflow-x-auto max-h-[60vh] whitespace-pre-wrap">
                                {result.files[activeFileIndex].content}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="documentation" className="mt-0">
                  <div className="prose max-w-none">
                    <h3>Using Your MCP Server with AI Models</h3>
                    <p>
                      Your MCP server is now ready to be used with AI models that support the Model Context Protocol (MCP).
                      This documentation provides guidance on how to integrate and use your server effectively.
                    </p>
                    
                    <h4>Integration with Claude</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`// Example using Claude AI with your MCP server
const response = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1000,
  tools: [
    {
      name: "mcp",
      description: "Access to external data and actions via MCP protocol",
      connectors: [
        {
          name: "my-api-server",
          server_url: "${result.serverUrl || 'https://example-mcp-server.supabase.co'}"
        }
      ]
    }
  ],
  messages: [
    {
      role: "user",
      content: "Please get the data from my API and summarize it"
    }
  ]
});`}
                    </pre>
                    
                    <h4>Authentication</h4>
                    <p>
                      Your MCP server uses API key authentication. Make sure to include the appropriate
                      authentication headers or parameters when configuring your AI model to connect to the server.
                    </p>
                    
                    <h4>Available Capabilities</h4>
                    <p>
                      Your MCP server exposes the following capabilities that can be used by AI models:
                    </p>
                    
                    <ul>
                      <li>
                        <strong>Resources:</strong> Data retrieval endpoints that provide information to the AI model.
                      </li>
                      <li>
                        <strong>Tools:</strong> Action endpoints that allow the AI model to perform operations or make changes.
                      </li>
                    </ul>
                    
                    <h4>Troubleshooting</h4>
                    <p>
                      If you encounter issues with your MCP server, check the following:
                    </p>
                    
                    <ul>
                      <li>Verify that the authentication credentials are correct</li>
                      <li>Check that the server URL is properly configured in your AI model</li>
                      <li>Review the server logs in Supabase for any error messages</li>
                      <li>Ensure your API is accessible and functioning properly</li>
                    </ul>
                    
                    <h4>Need Help?</h4>
                    <p>
                      If you need assistance with your MCP server, please contact our support team or 
                      refer to the <a href="#" className="text-primary hover:underline">Model Context Protocol documentation</a>.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={onRestart} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Start New Server
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenerationResult;
