
import { useState } from 'react';
import { ApiDefinition, Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface EndpointMapperProps {
  apiDefinition: ApiDefinition;
  onContinue: (endpoints: Endpoint[]) => void;
}

const EndpointMapper = ({ apiDefinition, onContinue }: EndpointMapperProps) => {
  // Mock endpoints - in a real app, these would be parsed from the API definition
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    {
      path: '/api/users',
      method: 'GET',
      description: 'Get a list of users',
      parameters: [
        { name: 'limit', type: 'integer', required: false, description: 'Maximum number of results' },
        { name: 'offset', type: 'integer', required: false, description: 'Result offset for pagination' }
      ],
      responses: [
        { statusCode: 200, description: 'Successful response with user list' }
      ],
      mcpType: 'resource'
    },
    {
      path: '/api/users/{id}',
      method: 'GET',
      description: 'Get a specific user by ID',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'User ID' }
      ],
      responses: [
        { statusCode: 200, description: 'Successful response with user details' },
        { statusCode: 404, description: 'User not found' }
      ],
      mcpType: 'resource'
    },
    {
      path: '/api/users',
      method: 'POST',
      description: 'Create a new user',
      parameters: [
        { name: 'name', type: 'string', required: true, description: 'User name' },
        { name: 'email', type: 'string', required: true, description: 'User email' }
      ],
      responses: [
        { statusCode: 201, description: 'User created successfully' },
        { statusCode: 400, description: 'Invalid input' }
      ],
      mcpType: 'tool'
    },
    {
      path: '/api/users/{id}',
      method: 'PUT',
      description: 'Update a user',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'User ID' },
        { name: 'name', type: 'string', required: false, description: 'User name' },
        { name: 'email', type: 'string', required: false, description: 'User email' }
      ],
      responses: [
        { statusCode: 200, description: 'User updated successfully' },
        { statusCode: 404, description: 'User not found' }
      ],
      mcpType: 'tool'
    },
    {
      path: '/api/users/{id}',
      method: 'DELETE',
      description: 'Delete a user',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'User ID' }
      ],
      responses: [
        { statusCode: 204, description: 'User deleted successfully' },
        { statusCode: 404, description: 'User not found' }
      ],
      mcpType: 'tool'
    }
  ]);

  const toggleEndpointType = (index: number, type: 'resource' | 'tool' | 'none') => {
    const updated = [...endpoints];
    updated[index] = { ...updated[index], mcpType: type };
    setEndpoints(updated);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PUT': return 'bg-amber-100 text-amber-700';
      case 'DELETE': return 'bg-rose-100 text-rose-700';
      case 'PATCH': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              API Mapping
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Map Your API Endpoints to MCP Capabilities
            </h2>
            <p className="text-muted-foreground">
              Review and customize how your API endpoints are mapped to MCP resources and tools.
              GET endpoints typically map to resources, while POST, PUT, and DELETE endpoints map to tools.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">{apiDefinition.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {apiDefinition.format} • {endpoints.length} endpoints
                </p>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="p-6 hover:bg-secondary/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-xs font-medium",
                          getMethodColor(endpoint.method)
                        )}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground mr-2 whitespace-nowrap">Map as:</p>
                      <Toggle
                        pressed={endpoint.mcpType === 'resource'}
                        onPressedChange={() => toggleEndpointType(index, 'resource')}
                        className={cn(
                          endpoint.mcpType === 'resource' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''
                        )}
                      >
                        Resource
                      </Toggle>
                      <Toggle
                        pressed={endpoint.mcpType === 'tool'}
                        onPressedChange={() => toggleEndpointType(index, 'tool')}
                        className={cn(
                          endpoint.mcpType === 'tool' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''
                        )}
                      >
                        Tool
                      </Toggle>
                      <Toggle
                        pressed={endpoint.mcpType === 'none'}
                        onPressedChange={() => toggleEndpointType(index, 'none')}
                        className={cn(
                          endpoint.mcpType === 'none' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''
                        )}
                      >
                        Skip
                      </Toggle>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button onClick={() => onContinue(endpoints)} size="lg">
              Continue to Server Configuration
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EndpointMapper;
