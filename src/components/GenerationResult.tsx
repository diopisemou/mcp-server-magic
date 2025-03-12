
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { GenerationResult as GenerationResultType } from '@/types';

interface GenerationResultProps {
  result: GenerationResultType;
  onRestart: () => void;
}

const GenerationResultComponent = ({ result, onRestart }: GenerationResultProps) => {
  const [activeTab, setActiveTab] = useState('server');
  
  if (!result) return null;
  
  return (
    <section className="py-24 bg-white">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          {result.success ? (
            <>
              <div className="mb-12">
                <div className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
                  Deployment Successful
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Your MCP Server is Ready
                </h2>
                <p className="text-muted-foreground">
                  Your MCP server has been successfully generated and deployed. You can now use it with Claude and other AI models.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>MCP Server Details</CardTitle>
                  <CardDescription>
                    Use these details to connect your AI models to your MCP server
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Server URL</h3>
                    <div className="flex items-center">
                      <code className="flex-1 bg-secondary p-3 rounded font-mono text-sm">
                        {result.serverUrl}
                      </code>
                      <Button 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => {
                          if (result.serverUrl) {
                            navigator.clipboard.writeText(result.serverUrl);
                            toast('URL copied to clipboard');
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="server">Server Code</TabsTrigger>
                      <TabsTrigger value="config">Configuration</TabsTrigger>
                      <TabsTrigger value="docs">Documentation</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="server" className="border rounded-md mt-4">
                      <div className="overflow-auto max-h-[400px]">
                        {result.files
                          ?.filter(file => file.type === 'code')
                          .map((file, index) => (
                            <div key={index} className="p-4 border-b last:border-b-0">
                              <h4 className="text-sm font-medium mb-2">{file.path}{file.name}</h4>
                              <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                                <code>{file.content}</code>
                              </pre>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="config" className="border rounded-md mt-4">
                      <div className="overflow-auto max-h-[400px]">
                        {result.files
                          ?.filter(file => file.type === 'config')
                          .map((file, index) => (
                            <div key={index} className="p-4 border-b last:border-b-0">
                              <h4 className="text-sm font-medium mb-2">{file.path}{file.name}</h4>
                              <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                                <code>{file.content}</code>
                              </pre>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="docs" className="border rounded-md mt-4">
                      <div className="overflow-auto max-h-[400px]">
                        {result.files
                          ?.filter(file => file.type === 'documentation')
                          .map((file, index) => (
                            <div key={index} className="p-4 border-b last:border-b-0">
                              <h4 className="text-sm font-medium mb-2">{file.path}{file.name}</h4>
                              <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                                <code>{file.content}</code>
                              </pre>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={onRestart}
                    className="mr-2"
                  >
                    Create a New Server
                  </Button>
                  <Button>
                    Download Files
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <>
              <div className="mb-12">
                <div className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
                  Deployment Failed
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Server Generation Failed
                </h2>
                <p className="text-muted-foreground">
                  We encountered an error while generating your MCP server.
                </p>
              </div>
              
              <Card className="border-red-200">
                <CardHeader className="bg-red-50 border-b border-red-200">
                  <CardTitle className="text-red-700">Error Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-red-700 font-mono p-4 bg-red-50 rounded border border-red-200">
                    {result.error || 'Unknown error occurred during server generation.'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={onRestart}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default GenerationResultComponent;
