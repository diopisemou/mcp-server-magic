
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ApiDefinition } from '@/types';
import { 
  Upload, 
  FileJson, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { validateApiDefinition } from '@/utils/api-validator';

interface ApiUploaderProps {
  onUploadComplete: (apiDefinition: ApiDefinition) => void;
}

export default function ApiUploader({ onUploadComplete }: ApiUploaderProps) {
  const [isUrl, setIsUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer' | 'apiKey'>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyLocation, setApiKeyLocation] = useState<'header' | 'query'>('header');
  const [queryParams, setQueryParams] = useState('');
  const [isSwaggerUi, setIsSwaggerUi] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };
  
  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setValidationErrors([]);
    
    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedFormats = ['json', 'yaml', 'yml', 'raml', 'md'];
    
    if (!supportedFormats.includes(fileExtension)) {
      toast.error('Unsupported file format. Please upload a JSON, YAML, RAML, or Markdown file.');
      setUploading(false);
      return;
    }
    
    try {
      const content = await file.text();
      const { isValid, format, errors, parsedDefinition } = await validateApiDefinition(content, file.name);
      
      if (!isValid) {
        setValidationErrors(errors || ['Invalid API definition format']);
        toast.error('API definition validation failed');
        setUploading(false);
        return;
      }
      
      const apiDefinition: ApiDefinition = {
        name: file.name,
        format,
        content,
        parsedDefinition
      };
      
      onUploadComplete(apiDefinition);
      toast.success(`API definition (${format}) uploaded successfully`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
      setValidationErrors([String(error)]);
    } finally {
      setUploading(false);
    }
  };

  const buildFetchOptions = () => {
    const options: RequestInit = {
      method: 'GET',
      headers: {}
    };

    // Add authentication
    if (authType === 'basic') {
      const base64Credentials = btoa(`${username}:${password}`);
      options.headers = {
        ...options.headers,
        'Authorization': `Basic ${base64Credentials}`
      };
    } else if (authType === 'bearer') {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    } else if (authType === 'apiKey') {
      if (apiKeyLocation === 'header') {
        options.headers = {
          ...options.headers,
          [apiKeyName]: apiKeyValue
        };
      }
    }

    return options;
  };
  
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setValidationErrors([]);
    
    // Validate URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Please enter a valid URL');
      setUploading(false);
      return;
    }
    
    let fetchUrl = url;
    
    // Add query parameters if provided
    if (queryParams && authType === 'apiKey' && apiKeyLocation === 'query') {
      const separator = fetchUrl.includes('?') ? '&' : '?';
      fetchUrl = `${fetchUrl}${separator}${apiKeyName}=${apiKeyValue}`;
    }
    
    if (queryParams) {
      try {
        const parsedParams = JSON.parse(queryParams);
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(parsedParams)) {
          params.append(key, String(value));
        }
        
        const separator = fetchUrl.includes('?') ? '&' : '?';
        fetchUrl = `${fetchUrl}${separator}${params.toString()}`;
      } catch (error) {
        console.warn('Failed to parse query params as JSON, using as-is');
        // If not valid JSON, assume it's already formatted as query string
        const separator = fetchUrl.includes('?') ? '&' : '?';
        fetchUrl = `${fetchUrl}${separator}${queryParams}`;
      }
    }
    
    const options = buildFetchOptions();
    
    // Handle Swagger UI URLs by extracting the actual definition URL
    if (isSwaggerUi) {
      // First try to download the page to extract the API URL
      fetch(fetchUrl, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(html => {
          // Try to extract the URL to the actual API definition from Swagger UI HTML
          const urlMatch = html.match(/url:\s*['"](.*?)['"]/);
          if (urlMatch && urlMatch[1]) {
            let swaggerDefinitionUrl = urlMatch[1];
            
            // If it's a relative URL, resolve it against the base URL
            if (swaggerDefinitionUrl.startsWith('/')) {
              const urlObj = new URL(fetchUrl);
              swaggerDefinitionUrl = `${urlObj.origin}${swaggerDefinitionUrl}`;
            }
            
            // Now fetch the actual API definition
            return fetch(swaggerDefinitionUrl, options);
          } else {
            throw new Error('Could not find API definition URL in Swagger UI page');
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(processApiDefinition)
        .catch(handleFetchError);
    } else {
      // Standard API definition URL
      fetch(fetchUrl, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(processApiDefinition)
        .catch(handleFetchError);
    }
  };
  
  const processApiDefinition = async (content: string) => {
    const { isValid, format, errors, parsedDefinition } = await validateApiDefinition(content, url);
    
    if (!isValid) {
      setValidationErrors(errors || ['Invalid API definition format']);
      toast.error('API definition validation failed');
      setUploading(false);
      return;
    }
    
    const apiDefinition: ApiDefinition = {
      name: url.split('/').pop() || 'api-definition',
      format,
      content,
      parsedDefinition,
      url
    };
    
    onUploadComplete(apiDefinition);
    toast.success(`API definition (${format}) fetched successfully`);
    setUploading(false);
  };
  
  const handleFetchError = (error: Error) => {
    console.error('Error fetching API definition:', error);
    toast.error('Failed to fetch API definition. Please check the URL and try again.');
    setValidationErrors([error.message]);
    setUploading(false);
  };
  
  return (
    <section className="py-24 relative overflow-hidden" id="start">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Start Building Your Server</h2>
            <p className="text-muted-foreground text-lg">
              Upload your API definition or provide a URL to get started
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex space-x-6">
                <button
                  className={cn(
                    "pb-2 text-sm font-medium transition-colors",
                    !isUrl ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground/80"
                  )}
                  onClick={() => setIsUrl(false)}
                >
                  Upload File
                </button>
                <button
                  className={cn(
                    "pb-2 text-sm font-medium transition-colors",
                    isUrl ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground/80"
                  )}
                  onClick={() => setIsUrl(true)}
                >
                  Provide URL
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {!isUrl ? (
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg transition-colors py-12 px-6",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload 
                      className="mx-auto mb-4 text-muted-foreground"
                      size={40}
                    />
                    <h3 className="text-lg font-medium mb-2">
                      {dragActive 
                        ? 'Drop your API definition file here' 
                        : 'Drag and drop your API definition file here'
                      }
                    </h3>
                    <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
                      <span>Supports OpenAPI</span>
                      <FileJson className="h-4 w-4" />
                      <span>RAML and API Blueprint formats</span>
                      <FileText className="h-4 w-4" />
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      onChange={handleChange}
                      accept=".json,.yaml,.yml,.raml,.md"
                    />
                    <div className="flex justify-center">
                      <span className="text-sm text-muted-foreground mr-2">or</span>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="text-sm text-primary font-medium"
                      >
                        browse files
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUrlSubmit}>
                  <div className="space-y-6">
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
                        Enter the URL of a publicly accessible API definition file
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="swagger-ui" 
                        checked={isSwaggerUi}
                        onCheckedChange={(checked) => setIsSwaggerUi(checked === true)}
                      />
                      <label
                        htmlFor="swagger-ui"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        This is a Swagger UI URL (not a direct API definition)
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {showAdvanced && (
                      <div className="border rounded-md p-4 space-y-4">
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Advanced options (available for everyone during beta)
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="auth-type">Authentication Type</Label>
                            <Select 
                              value={authType} 
                              onValueChange={(value) => setAuthType(value as any)}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Select authentication type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="basic">Basic Auth</SelectItem>
                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                <SelectItem value="apiKey">API Key</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {authType === 'basic' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                  id="username"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                  id="password"
                                  type="password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}

                          {authType === 'bearer' && (
                            <div>
                              <Label htmlFor="token">Bearer Token</Label>
                              <Input
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          )}

                          {authType === 'apiKey' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="apiKeyName">API Key Name</Label>
                                  <Input
                                    id="apiKeyName"
                                    value={apiKeyName}
                                    onChange={(e) => setApiKeyName(e.target.value)}
                                    className="mt-1"
                                    placeholder="X-API-Key"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="apiKeyValue">API Key Value</Label>
                                  <Input
                                    id="apiKeyValue"
                                    value={apiKeyValue}
                                    onChange={(e) => setApiKeyValue(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>API Key Location</Label>
                                <div className="flex space-x-4 mt-1">
                                  <div className="flex items-center">
                                    <input
                                      type="radio"
                                      id="header"
                                      name="apiKeyLocation"
                                      value="header"
                                      checked={apiKeyLocation === 'header'}
                                      onChange={() => setApiKeyLocation('header')}
                                      className="mr-2"
                                    />
                                    <Label htmlFor="header" className="cursor-pointer">Header</Label>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="radio"
                                      id="query"
                                      name="apiKeyLocation"
                                      value="query"
                                      checked={apiKeyLocation === 'query'}
                                      onChange={() => setApiKeyLocation('query')}
                                      className="mr-2"
                                    />
                                    <Label htmlFor="query" className="cursor-pointer">Query Parameter</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="queryParams">Query Parameters (JSON or query string)</Label>
                            <Textarea
                              id="queryParams"
                              value={queryParams}
                              onChange={(e) => setQueryParams(e.target.value)}
                              className="mt-1"
                              placeholder={'{"version": "1.0", "format": "json"}\nor\nversion=1.0&format=json'}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter parameters as JSON object or standard query string
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}
              
              {validationErrors.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-700 list-disc pl-5">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
