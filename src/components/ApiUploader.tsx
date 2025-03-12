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
import { validateApiDefinition } from '@/utils/apiValidator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle, AlertCircle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";


interface ApiUploaderProps {
  onUploadComplete: (apiDefinition: ApiDefinition) => void;
}

export default function ApiUploader({ onUploadComplete }: ApiUploaderProps) {
  const [uploadMethod, setUploadMethod] = useState('file');
  const [apiUrl, setApiUrl] = useState('');
  const [apiDefinitionText, setApiDefinitionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [authType, setAuthType] = useState('none');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('api_key');
  const [queryParams, setQueryParams] = useState('');
  const [headerParams, setHeaderParams] = useState('');
  const [urlType, setUrlType] = useState('api-definition'); // 'api-definition' or 'swagger'

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

  const [isUrl, setIsUrl] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


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

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUrlUpload();
  };


  const handleUrlUpload = async () => {
    if (!apiUrl) {
      setUploadError('Please enter a valid URL');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      let content;
      let fileName = apiUrl.split('/').pop() || 'API Definition';

      // Prepare request headers
      const headers = new Headers();
      if (showAdvancedOptions) {
        // Parse and add header parameters
        try {
          if (headerParams) {
            const headerObj = JSON.parse(headerParams);
            Object.entries(headerObj).forEach(([key, value]) => {
              headers.append(key, value as string);
            });
          }
        } catch (err) {
          console.error('Error parsing header params:', err);
          setUploadError('Invalid header parameters format. Use valid JSON.');
          setIsUploading(false);
          return;
        }

        // Add authentication headers if specified
        if (authType === 'bearer' && authToken) {
          headers.append('Authorization', `Bearer ${authToken}`);
        } else if (authType === 'api-key' && apiKey) {
          headers.append(apiKeyName, apiKey);
        }
      }

      // Prepare URL with query parameters
      let fetchUrl = apiUrl;
      if (showAdvancedOptions && queryParams) {
        try {
          const queryObj = JSON.parse(queryParams);
          const searchParams = new URLSearchParams();
          Object.entries(queryObj).forEach(([key, value]) => {
            searchParams.append(key, value as string);
          });

          // Append query parameters to URL
          fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + searchParams.toString();
        } catch (err) {
          console.error('Error parsing query params:', err);
          setUploadError('Invalid query parameters format. Use valid JSON.');
          setIsUploading(false);
          return;
        }
      }

      // Fetch the API definition
      const response = await fetch(fetchUrl, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch API definition: ${response.statusText} (${response.status})`);
      }

      let responseText = await response.text();

      // Handle different URL types
      if (urlType === 'swagger') {
        // If this is a Swagger UI page, try to extract the API definition
        if (responseText.includes('swagger-ui')) {
          // Look for the URL to the actual Swagger JSON/YAML
          const matches = responseText.match(/url:\s*['"](.*?)['"]/);
          if (matches && matches[1]) {
            const swaggerDefUrl = new URL(matches[1], apiUrl).href;
            const swaggerResponse = await fetch(swaggerDefUrl);
            if (!swaggerResponse.ok) {
              throw new Error(`Failed to fetch Swagger definition: ${swaggerResponse.statusText}`);
            }
            responseText = await swaggerResponse.text();
            fileName = swaggerDefUrl.split('/').pop() || 'swagger';
          } else {
            throw new Error('Could not extract Swagger definition URL from the page');
          }
        }
      }

      // Validate the API definition
      const validationResult = await validateApiDefinition(responseText, fileName);

      if (!validationResult.isValid) {
        setUploadError(`Invalid API definition: ${validationResult.errors?.join(', ')}`);
        setIsUploading(false);
        return;
      }

      // Call the onUploadComplete callback with the validated API definition
      onUploadComplete({
        name: fileName,
        format: validationResult.format,
        content: responseText, // Use the raw response text instead of JSON.stringify(validationResult)
        parsedDefinition: validationResult.parsedDefinition
      });

    } catch (error) {
      console.error('Error uploading API definition from URL:', error);
      setUploadError(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    if (uploadMethod === 'file' && selectedFile) {
      handleFiles(new DataTransfer().items.add(selectedFile)); //Simulate FileList
    } else if (uploadMethod === 'url') {
      handleUrlUpload();
    }
  }

  return (
    <div className="py-24 relative overflow-hidden" id="start">
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
                    uploadMethod !== 'url' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground/80"
                  )}
                  onClick={() => setUploadMethod('file')}
                >
                  Upload File
                </button>
                <button
                  className={cn(
                    "pb-2 text-sm font-medium transition-colors",
                    uploadMethod === 'url' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground/80"
                  )}
                  onClick={() => setUploadMethod('url')}
                >
                  Provide URL
                </button>
              </div>
            </div>

            <div className="p-6">
              {uploadMethod === 'file' ? (
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
                    <div className="flex flex-col gap-4">
                      <div>
                        <Label htmlFor="api-url">API Definition URL</Label>
                        <Input 
                          id="api-url" 
                          placeholder="https://example.com/api-definition.json" 
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                        />
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <RadioGroup value={urlType} onValueChange={setUrlType} className="flex space-x-2">
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="api-definition" id="api-definition" />
                                <Label htmlFor="api-definition">API Definition URL (JSON/YAML)</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="swagger" id="swagger" />
                                <Label htmlFor="swagger">Swagger UI URL</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="advanced-options" 
                          checked={showAdvancedOptions}
                          onCheckedChange={(checked) => setShowAdvancedOptions(!!checked)}
                        />
                        <Label htmlFor="advanced-options" className="cursor-pointer">
                          Show Advanced Options
                        </Label>
                      </div>

                      {showAdvancedOptions && (
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
                                  <SelectItem value="bearer">Bearer Token</SelectItem>
                                  <SelectItem value="api-key">API Key</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {authType === 'bearer' && (
                              <div>
                                <Label htmlFor="token">Bearer Token</Label>
                                <Input
                                  id="token"
                                  value={authToken}
                                  onChange={(e) => setAuthToken(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            )}

                            {authType === 'api-key' && (
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
                                      value={apiKey}
                                      onChange={(e) => setApiKey(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div>
                              <Label htmlFor="queryParams">Query Parameters (JSON)</Label>
                              <Textarea
                                id="queryParams"
                                value={queryParams}
                                onChange={(e) => setQueryParams(e.target.value)}
                                className="mt-1"
                                placeholder={'{"param1": "value1", "param2": "value2"}'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="headerParams">Header Parameters (JSON)</Label>
                              <Textarea
                                id="headerParams"
                                value={headerParams}
                                onChange={(e) => setHeaderParams(e.target.value)}
                                className="mt-1"
                                placeholder={'{"Content-Type": "application/json"}'}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    <Button type="submit" disabled={isUploading || !apiUrl}>
                      {isUploading ? 'Fetching...' : 'Fetch'}
                    </Button>
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
              <div className="mt-6">
                {uploadError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {uploadError}
                      {uploadMethod === 'url' && uploadError.includes('Failed to fetch') && (
                        <p className="mt-2 text-sm">
                          This could be due to CORS restrictions. Try using the advanced options or uploading a file directly.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadMethod === 'file' ? 'Processing...' : 'Fetching API...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload API Definition
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}