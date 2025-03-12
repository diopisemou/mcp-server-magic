
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ApiDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FileJson, Upload, FileText, AlertCircle, ChevronDown } from 'lucide-react';
import { validateApiDefinition } from '@/utils/apiValidator';

interface ApiUploaderProps {
  onUploadComplete: (definition: ApiDefinition) => void;
}

export const ApiUploader = ({ onUploadComplete }: ApiUploaderProps) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url');
  const [url, setUrl] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Advanced URL options
  const [authType, setAuthType] = useState<'None' | 'ApiKey' | 'Bearer'>('None');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [apiKeyLocation, setApiKeyLocation] = useState<'header' | 'query'>('header');
  const [bearerToken, setBearerToken] = useState('');
  const [queryParams, setQueryParams] = useState('');
  const [requestHeaders, setRequestHeaders] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // In a real implementation, you would send the URL and auth details to your backend
      // For now, we'll simulate fetching from the URL
      
      let fetchUrl = url;
      const headers: Record<string, string> = {};
      
      // Process query parameters if provided in advanced mode
      if (advancedMode && queryParams) {
        try {
          const parsedParams = JSON.parse(queryParams);
          const searchParams = new URLSearchParams();
          
          Object.entries(parsedParams).forEach(([key, value]) => {
            searchParams.append(key, String(value));
          });
          
          fetchUrl += `?${searchParams.toString()}`;
        } catch (e) {
          toast.error('Invalid JSON format for query parameters');
          setUploading(false);
          return;
        }
      }
      
      // Process authentication
      if (advancedMode) {
        if (authType === 'ApiKey') {
          if (apiKeyLocation === 'header') {
            headers[apiKeyName] = apiKey;
          } else if (apiKeyLocation === 'query') {
            const searchParams = new URLSearchParams(fetchUrl.includes('?') ? fetchUrl.split('?')[1] : '');
            searchParams.append(apiKeyName, apiKey);
            fetchUrl = `${fetchUrl.split('?')[0]}?${searchParams.toString()}`;
          }
        } else if (authType === 'Bearer') {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
        
        // Process additional headers
        if (requestHeaders) {
          try {
            const parsedHeaders = JSON.parse(requestHeaders);
            Object.entries(parsedHeaders).forEach(([key, value]) => {
              headers[key] = String(value);
            });
          } catch (e) {
            toast.error('Invalid JSON format for headers');
            setUploading(false);
            return;
          }
        }
      }
      
      // Simulating fetch for now
      // In a real implementation, you would use fetch with these options
      // const response = await fetch(fetchUrl, { headers });
      // const data = await response.text();
      
      // For demonstration, we'll assume success and use a mock response
      setTimeout(() => {
        const mockData = `
        {
          "openapi": "3.0.0",
          "info": {
            "title": "Sample API",
            "version": "1.0.0"
          },
          "paths": {
            "/users": {
              "get": {
                "summary": "Get all users",
                "responses": {
                  "200": {
                    "description": "Successful response"
                  }
                }
              }
            }
          }
        }`;
        
        const validationResult = validateApiDefinition(mockData);
        
        if (validationResult.valid) {
          onUploadComplete({
            name: url.split('/').pop() || 'API Definition',
            content: mockData,
            format: validationResult.format || 'unknown',
            parsedDefinition: validationResult.definition
          });
          toast.success('API definition loaded successfully');
        } else {
          setError(validationResult.error || 'Invalid API definition');
          toast.error('Failed to validate API definition');
        }
        
        setUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching API definition:', error);
      setError('Failed to fetch API definition');
      toast.error('Failed to fetch API definition');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const content = await file.text();
      const validationResult = validateApiDefinition(content);

      if (validationResult.valid) {
        onUploadComplete({
          name: file.name,
          content,
          format: validationResult.format || 'unknown',
          parsedDefinition: validationResult.definition
        });
        toast.success('API definition uploaded successfully');
      } else {
        setError(validationResult.error || 'Invalid API definition');
        toast.error('Failed to validate API definition');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Failed to read file');
      toast.error('Failed to read file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload API Definition</h3>
        <p className="text-sm text-muted-foreground">
          Upload your OpenAPI, Swagger, RAML, or API Blueprint definition to get started.
        </p>
      </div>
      
      <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="pt-4">
          <form onSubmit={handleUrlSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-url" className="mb-2 block">
                  API Definition URL
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-url"
                    placeholder="https://example.com/api-spec.yaml"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={uploading || !url}>
                    {uploading ? 'Loading...' : 'Fetch'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the URL of a publicly accessible API definition file or Swagger UI page
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="advanced-mode" 
                  checked={advancedMode} 
                  onCheckedChange={setAdvancedMode} 
                />
                <Label htmlFor="advanced-mode">Advanced Options</Label>
              </div>
              
              {advancedMode && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="authentication">
                    <AccordionTrigger>Authentication</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="auth-type">Authentication Type</Label>
                          <Select 
                            value={authType} 
                            onValueChange={(value) => setAuthType(value as 'None' | 'ApiKey' | 'Bearer')}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select authentication type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="ApiKey">API Key</SelectItem>
                              <SelectItem value="Bearer">Bearer Token</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {authType === 'ApiKey' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="api-key">API Key</Label>
                              <Input
                                id="api-key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="api-key-name">API Key Name</Label>
                              <Input
                                id="api-key-name"
                                value={apiKeyName}
                                onChange={(e) => setApiKeyName(e.target.value)}
                                placeholder="X-API-Key"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="api-key-location">API Key Location</Label>
                              <Select 
                                value={apiKeyLocation} 
                                onValueChange={(value) => setApiKeyLocation(value as 'header' | 'query')}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="header">Header</SelectItem>
                                  <SelectItem value="query">Query Parameter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        
                        {authType === 'Bearer' && (
                          <div>
                            <Label htmlFor="bearer-token">Bearer Token</Label>
                            <Input
                              id="bearer-token"
                              value={bearerToken}
                              onChange={(e) => setBearerToken(e.target.value)}
                              placeholder="Enter your bearer token"
                            />
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="parameters">
                    <AccordionTrigger>Query Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="query-params">Query Parameters (JSON format)</Label>
                        <Input
                          id="query-params"
                          value={queryParams}
                          onChange={(e) => setQueryParams(e.target.value)}
                          placeholder='{"version": "1.0", "format": "json"}'
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter parameters as a JSON object
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="headers">
                    <AccordionTrigger>Additional Headers</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="request-headers">Request Headers (JSON format)</Label>
                        <Input
                          id="request-headers"
                          value={requestHeaders}
                          onChange={(e) => setRequestHeaders(e.target.value)}
                          placeholder='{"Accept": "application/json", "Custom-Header": "value"}'
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter headers as a JSON object
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="file" className="pt-4">
          <div 
            className={cn(
              "border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors",
              file ? "border-primary" : "border-border"
            )}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onClick={() => inputRef.current?.click()}
          >
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".json,.yaml,.yml,.raml,.md"
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <FileJson className="h-10 w-10 text-primary mb-2" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileUpload();
                  }}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Definition'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium">Drag and drop your API definition file</p>
                <div className="flex justify-center mt-2">
                  <span className="text-sm text-muted-foreground mr-2">or</span>
                  <button
                    type="button"
                    className="text-sm text-primary font-medium"
                  >
                    browse files
                  </button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiUploader;
