
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Endpoint, ServerConfigRecord } from '@/types';
import { Download, Code } from 'lucide-react';
import EndpointsList from './EndpointsList';

interface ServerPreviewProps {
  endpoints: Endpoint[];
  serverUrl: string | null;
  isGenerating: boolean;
  config: ServerConfigRecord | null;
  onGenerateServer: () => void;
  onDownloadCode: () => void;
}

const ServerPreview: React.FC<ServerPreviewProps> = ({
  endpoints,
  serverUrl,
  isGenerating,
  config,
  onGenerateServer,
  onDownloadCode
}) => {
  return (
    <Tabs defaultValue="endpoints">
      <TabsList>
        <TabsTrigger value="endpoints">Configured Endpoints</TabsTrigger>
        <TabsTrigger value="code">Server Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="code" className="p-4 border rounded-md mt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Generated Server Code</h3>
            <Button variant="outline" size="sm" onClick={onDownloadCode} disabled={!serverUrl}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          
          {serverUrl ? (
            <div className="bg-gray-50 p-4 rounded-md border overflow-auto max-h-[500px]">
              <pre className="text-sm">
                <code>
{`# Example MCP Server Code for ${config?.name}
from mcp_server import MCPServer
from fastapi import FastAPI, HTTPException

app = FastAPI()
server = MCPServer(app)

# Configuration
server.set_name("${config?.name}")
server.set_description("${config?.description || 'MCP Server for API integration'}")

# Authentication
auth_config = {
    "type": "${config?.authentication_type}",
    ${config?.authentication_details ? JSON.stringify(config.authentication_details, null, 2) : ''}
}
server.configure_auth(auth_config)

# Endpoints
${endpoints.map(endpoint => `
@server.${endpoint.mcpType}("${endpoint.path}")
async def ${endpoint.path.replace(/[^\w]/g, '_').toLowerCase()}(${endpoint.parameters.map(p => `${p.name}: ${p.type}${p.required ? '' : ' = None'}`).join(', ')}):
    """${endpoint.description || ''}"""
    # Implementation
    return {"message": "This endpoint would call your API"}
`).join('\n')}

# Start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`}
                </code>
              </pre>
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Code Generated Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate the server to see the code
              </p>
              <Button onClick={onGenerateServer} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Server'}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="endpoints" className="p-4 border rounded-md mt-4">
        <h3 className="text-lg font-medium mb-4">Configured Endpoints</h3>
        <EndpointsList endpoints={endpoints} />
      </TabsContent>
    </Tabs>
  );
};

export { ServerPreview };
export default ServerPreview;
