
import React from 'react';
import { Button } from '@/components/ui/button';
import { ApiDefinitionRecord, Endpoint, ServerConfigRecord } from '@/types';

interface ServerGenerationSectionProps {
  serverUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  config: ServerConfigRecord | null;
  apiDefinition: ApiDefinitionRecord | null;
  endpoints: Endpoint[];
  onGenerateServer: () => void;
  onDownloadCode: () => void;
  onTestServer: () => void;
}

const ServerGenerationSection: React.FC<ServerGenerationSectionProps> = ({
  serverUrl,
  isGenerating,
  error,
  config,
  apiDefinition,
  endpoints,
  onGenerateServer,
  onDownloadCode,
  onTestServer
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">API Definition</h3>
        {apiDefinition ? (
          <>
            <p>{apiDefinition.name}</p>
            <p className="text-sm text-muted-foreground">Format: {apiDefinition.format}</p>
          </>
        ) : (
          <div className="mt-2 mb-2">
            <p className="mb-2">No API definition available</p>
            <Button variant="outline" size="sm" asChild>
              <a href="/import-api">Import API Definition</a>
            </Button>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Endpoints</h3>
        {endpoints.length > 0 ? (
          <p>{endpoints.length} endpoints configured</p>
        ) : (
          <div className="mt-2 mb-2">
            <p className="mb-2">0 endpoints configured</p>
            {apiDefinition && (
              <Button variant="outline" size="sm" asChild>
                <a href="/configure-endpoints">Configure Endpoints</a>
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t space-y-4">
        {!serverUrl && !isGenerating && (
          <Button 
            onClick={onGenerateServer} 
            className="w-full"
            disabled={isGenerating}
          >
            Generate & Deploy Server
          </Button>
        )}
        
        {isGenerating && (
          <div className="text-center space-y-2">
            <div className="animate-pulse">Generating server...</div>
            <p className="text-sm text-muted-foreground">
              This may take a few minutes
            </p>
          </div>
        )}
        
        {serverUrl && !isGenerating && (
          <>
            <Button 
              onClick={onDownloadCode} 
              variant="outline" 
              className="w-full"
            >
              Download Server Code
            </Button>
            <Button 
              onClick={onTestServer}
              className="w-full"
            >
              Test Server
            </Button>
          </>
        )}
        
        {error && (
          <div className="text-red-500 bg-red-50 p-4 rounded-md">
            <p className="font-medium">Error generating server:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix the export to use a named export
export { ServerGenerationSection };
