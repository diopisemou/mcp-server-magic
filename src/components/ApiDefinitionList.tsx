
import React from 'react';
import { ApiDefinitionRecord } from '@/types';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, Upload } from 'lucide-react';

interface ApiDefinitionListProps {
  apiDefinitions: ApiDefinitionRecord[];
  onConfigureServer: () => void;
  onImportApi: () => void;
}

const ApiDefinitionList: React.FC<ApiDefinitionListProps> = ({
  apiDefinitions,
  onConfigureServer,
  onImportApi
}) => {
  if (apiDefinitions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Code className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No API Definitions</h3>
        <p className="text-muted-foreground mb-4">
          Import an API definition to get started with your MCP server.
        </p>
        <Button onClick={onImportApi}>Import API Definition</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apiDefinitions.map((api) => (
        <Card key={api.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{api.name}</CardTitle>
                <CardDescription>
                  Format: {api.format}
                </CardDescription>
              </div>
              <Badge>{api.format}</Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Imported on {new Date(api.created_at).toLocaleDateString()}
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={onImportApi}>
                <Upload className="h-4 w-4 mr-2" />
                Update API
              </Button>
              <Button onClick={onConfigureServer}>Configure Server</Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ApiDefinitionList;
