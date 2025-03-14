
import { useState } from 'react';
import { ServerConfig } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServerConfigurationFormProps {
  serverConfig: ServerConfig;
  onConfigChange: (config: ServerConfig) => void;
}

const ServerConfigurationForm = ({ serverConfig, onConfigChange }: ServerConfigurationFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = (field: string, value: string) => {
    onConfigChange({
      ...serverConfig,
      [field]: value
    });
  };

  const handleAuthChange = (field: string, value: string) => {
    onConfigChange({
      ...serverConfig,
      authentication: {
        ...serverConfig.authentication,
        [field]: value
      }
    });
  };

  const handleHostingChange = (field: string, value: string) => {
    onConfigChange({
      ...serverConfig,
      hosting: {
        ...serverConfig.hosting,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="hosting">Hosting & Deployment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              value={serverConfig.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter server name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={serverConfig.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter a brief description of this MCP server"
              className="h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Server Language</Label>
            <RadioGroup
              value={serverConfig.language}
              onValueChange={(value) => handleInputChange('language', value)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Python" id="python" />
                <Label htmlFor="python">Python</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TypeScript" id="typescript" />
                <Label htmlFor="typescript">TypeScript</Label>
              </div>
            </RadioGroup>
          </div>
        </TabsContent>
        
        <TabsContent value="authentication" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="auth-type">Authentication Type</Label>
            <Select
              value={serverConfig.authentication.type}
              onValueChange={(value) => handleAuthChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="API Key">API Key</SelectItem>
                <SelectItem value="Bearer Token">Bearer Token</SelectItem>
                <SelectItem value="Basic Auth">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serverConfig.authentication.type !== 'None' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="auth-location">Location</Label>
                <Select
                  value={serverConfig.authentication.location}
                  onValueChange={(value) => handleAuthChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="query">Query Parameter</SelectItem>
                    <SelectItem value="cookie">Cookie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  value={serverConfig.authentication.name || ''}
                  onChange={(e) => handleAuthChange('name', e.target.value)}
                  placeholder={
                    serverConfig.authentication.type === 'API Key' ? 'X-API-Key' :
                    serverConfig.authentication.type === 'Bearer Token' ? 'Authorization' :
                    'Authorization'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-value">Default Value (Optional)</Label>
                <Input
                  id="auth-value"
                  value={serverConfig.authentication.value || ''}
                  onChange={(e) => handleAuthChange('value', e.target.value)}
                  placeholder={
                    serverConfig.authentication.type === 'API Key' ? 'your-api-key' :
                    serverConfig.authentication.type === 'Bearer Token' ? 'Bearer your-token' :
                    'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used for testing. Users will configure their own values when integrating.
                </p>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="hosting" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="hosting-provider">Cloud Provider</Label>
            <Select
              value={serverConfig.hosting.provider}
              onValueChange={(value) => handleHostingChange('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hosting provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AWS">AWS</SelectItem>
                <SelectItem value="GCP">Google Cloud (GCP)</SelectItem>
                <SelectItem value="Azure">Microsoft Azure</SelectItem>
                <SelectItem value="Supabase">Supabase</SelectItem>
                <SelectItem value="Self-hosted">Self-hosted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hosting-type">Hosting Type</Label>
            <Select
              value={serverConfig.hosting.type}
              onValueChange={(value) => handleHostingChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hosting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Serverless">Serverless</SelectItem>
                <SelectItem value="Container">Container</SelectItem>
                <SelectItem value="VM">Virtual Machine</SelectItem>
                <SelectItem value="Shared">Shared Hosting</SelectItem>
                <SelectItem value="Dedicated">Dedicated Hosting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hosting-region">Region</Label>
            <Select
              value={serverConfig.hosting.region || ''}
              onValueChange={(value) => handleHostingChange('region', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {serverConfig.endpoints.length > 0 && (
        <Accordion type="single" collapsible className="mt-6 border rounded-lg">
          <AccordionItem value="endpoints">
            <AccordionTrigger className="px-4">
              Endpoints Configuration
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-2">
                {serverConfig.endpoints.length} endpoints available for this server.
              </p>
              <div className="text-xs text-muted-foreground">
                Note: You'll be able to edit endpoint configurations in the next step.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default ServerConfigurationForm;
