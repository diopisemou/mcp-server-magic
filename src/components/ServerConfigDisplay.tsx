
import React from 'react';
import { ServerConfigRecord } from '@/types';

interface ServerConfigDisplayProps {
  config: ServerConfigRecord | null;
}

const ServerConfigDisplay: React.FC<ServerConfigDisplayProps> = ({ config }) => {
  if (!config) return null;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
        <p>{config.name}</p>
      </div>
      
      {config.description && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
          <p>{config.description}</p>
        </div>
      )}
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Language</h3>
        <p>{config.language}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Authentication</h3>
        <p>{config.authentication_type}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Hosting</h3>
        <p>{config.hosting_provider} ({config.hosting_type})</p>
        {config.hosting_region && <p className="text-sm text-muted-foreground">Region: {config.hosting_region}</p>}
      </div>
    </div>
  );
};

export default ServerConfigDisplay;
