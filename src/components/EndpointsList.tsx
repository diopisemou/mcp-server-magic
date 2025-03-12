
import React from 'react';
import { Endpoint } from '@/types';

interface EndpointsListProps {
  endpoints: Endpoint[];
}

const EndpointsList: React.FC<EndpointsListProps> = ({ endpoints }) => {
  if (endpoints.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No endpoints configured
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {endpoints.map((endpoint, index) => (
        <div key={index} className="border rounded-md p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded mr-2 ${
                  endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                  endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                  endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {endpoint.method}
                </span>
                <span className="font-mono text-sm">{endpoint.path}</span>
              </div>
              {endpoint.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {endpoint.description}
                </p>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              endpoint.mcpType === 'resource' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {endpoint.mcpType}
            </span>
          </div>
          
          {endpoint.parameters.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Parameters</h4>
              <div className="text-sm space-y-1">
                {endpoint.parameters.map((param, idx) => (
                  <div key={idx} className="flex">
                    <span className="font-mono mr-2">{param.name}</span>
                    <span className="text-muted-foreground mr-2">({param.type})</span>
                    {param.required && (
                      <span className="text-red-500 text-xs">required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EndpointsList;
