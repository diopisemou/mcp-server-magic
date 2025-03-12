
import React from 'react';
import { Deployment } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, Play, RefreshCw, ExternalLink } from 'lucide-react';

interface DeploymentListProps {
  deployments: Deployment[];
  onViewDeployment: (deploymentId: string) => void;
  onTestServer: (deploymentId: string) => void;
  onRefresh: () => void;
  onConfigureServer: () => void;
  hasApiDefinition: boolean;
}

const DeploymentList: React.FC<DeploymentListProps> = ({
  deployments,
  onViewDeployment,
  onTestServer,
  onRefresh,
  onConfigureServer,
  hasApiDefinition
}) => {
  if (deployments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Server className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Deployments</h3>
        <p className="text-muted-foreground mb-4">
          Generate and deploy your MCP server to make it available for testing.
        </p>
        <Button 
          onClick={onConfigureServer}
          disabled={!hasApiDefinition}
        >
          Configure & Deploy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deployments.map((deployment) => (
        <Card key={deployment.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Deployment {deployment.id.substring(0, 8)}</CardTitle>
              <Badge 
                variant={
                  deployment.status === 'success' ? 'default' :
                  deployment.status === 'pending' ? 'outline' : 'destructive'
                }
              >
                {deployment.status}
              </Badge>
            </div>
            <CardDescription>
              Created on {new Date(deployment.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deployment.server_url && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">Server URL:</span>
                <a 
                  href={deployment.server_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline flex items-center"
                >
                  {deployment.server_url}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => onViewDeployment(deployment.id)}
            >
              View Details
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => onTestServer(deployment.id)}
                disabled={deployment.status !== 'success'}
              >
                <Play className="mr-2 h-4 w-4" />
                Test Server
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default DeploymentList;
