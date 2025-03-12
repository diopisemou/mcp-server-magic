
import React from 'react';
import { Button } from '@/components/ui/button';
import { ServerConfigRecord, ApiDefinitionRecord, Endpoint } from '@/types';
import { Download, ExternalLink } from 'lucide-react';

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
        <p>{apiDefinition?.name || 'No API definition available'}</p>
        <p className="text-sm text-muted-foreground">Format: {apiDefinition?.format}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Endpoints</h3>
        <p>{endpoints.length} endpoints configured</p>
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
              <Download className="mr-2 h-4 w-4" />
              Download Server Code
            </Button>
            <Button 
              onClick={onTestServer}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Test Server
            </Button>
          </>
        )}
        
        {error && (
          <div className="text-red-500 text-sm mt-2">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerGenerationSection;
