
import React from 'react';
import { ServerConfigRecord } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, Download } from 'lucide-react';

interface ServerConfigurationListProps {
  serverConfigs: ServerConfigRecord[];
  onGenerateServer: (configId: string) => void;
  onDownloadFiles: (configId: string) => void;
  onConfigureServer: () => void;
  hasApiDefinition: boolean;
}

const ServerConfigurationList: React.FC<ServerConfigurationListProps> = ({
  serverConfigs,
  onGenerateServer,
  onDownloadFiles,
  onConfigureServer,
  hasApiDefinition
}) => {
  if (serverConfigs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Server className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Server Configurations</h3>
        <p className="text-muted-foreground mb-4">
          Configure your MCP server to generate code and deploy.
        </p>
        <Button onClick={onConfigureServer} disabled={!hasApiDefinition}>
          Configure Server
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serverConfigs.map((config) => (
        <Card key={config.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{config.name}</CardTitle>
                <CardDescription>
                  {config.description || 'No description provided'}
                </CardDescription>
              </div>
              <Badge>{config.language}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-muted-foreground">{config.authentication_type}</p>
              </div>
              <div>
                <p className="font-medium">Hosting</p>
                <p className="text-muted-foreground">
                  {config.hosting_provider} ({config.hosting_type})
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => onDownloadFiles(config.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download Files
            </Button>
            <Button onClick={() => onGenerateServer(config.id)}>
              Generate Server
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ServerConfigurationList;
