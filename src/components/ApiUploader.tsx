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
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { validateApiDefinition, extractEndpoints } from '@/utils/apiValidator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiUploaderProps {
  onUploadComplete: (apiDefinition: ApiDefinition) => void;
}

export default function ApiUploader({ onUploadComplete }: ApiUploaderProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [urlType, setUrlType] = useState<'direct' | 'swagger'>('direct');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'api-key'>('none');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-Api-Key');
  const [queryParams, setQueryParams] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST'>('GET');
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const handleFiles = async (fileList: FileList | DataTransfer['items']) => {
    // Reset errors
    setFileError(null);
    setEndpoints([]);
    setShowEndpoints(false);

    const file = fileList instanceof FileList 
      ? fileList[0] 
      : fileList[0]?.getAsFile();

    if (!file) {
      setFileError('No file selected');
      return;
    }

    setSelectedFile(file);

    // Validate file
    if (!['.json', '.yaml', '.yml', '.raml', '.md'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      setFileError('Invalid file type. Supported types: JSON, YAML, RAML, and API Blueprint');
      return;
    }

    // Read and validate file content
    try {
      setIsUploading(true);
      setUploadProgress(10);

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 50);
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        const content = e.target?.result as string;

        try {
          setUploadProgress(60);

          // Validate the API definition
          const validationResult = await validateApiDefinition(content, file.name);

          setUploadProgress(90);

          if (!validationResult.isValid) {
            setFileError(`Invalid API definition: ${validationResult.errors?.join(', ')}`);
            setIsUploading(false);
            return;
          }

          // Extract endpoints from the validated API definition
          if (validationResult.parsedDefinition) {
            const extractedEndpoints = extractEndpoints(
              validationResult.parsedDefinition, 
              validationResult.format
            );
            setEndpoints(extractedEndpoints);
            setShowEndpoints(extractedEndpoints.length > 0);
            console.log('Extracted endpoints:', extractedEndpoints);
          }

          setUploadProgress(100);

          // Call the onUploadComplete callback with the validated API definition
          onUploadComplete({
            name: file.name,
            format: validationResult.format,
            content: JSON.stringify({
              content,
              format: validationResult.format,
              parsedDefinition: validationResult.parsedDefinition
            }),
            parsedDefinition: validationResult.parsedDefinition
          });

        } catch (error) {
          console.error('Error validating API definition:', error);
          setFileError(`Error validating API definition: ${(error as Error).message}`);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setFileError('Error reading file');
        setIsUploading(false);
      };

      reader.readAsText(file);

    } catch (error) {
      console.error('Error uploading API definition:', error);
      setFileError(`Error: ${(error as Error).message}`);
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUrlUpload();
  };

  const handleUrlUpload = async () => {
    setUploadError(null);
    setEndpoints([]);
    setShowEndpoints(false);
    setTestResult(null);

    if (!apiUrl) {
      setUploadError('Please enter a URL');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Prepare headers
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      // Add authentication if applicable
      if (showAdvancedOptions) {
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

      // Prepare fetch options
      const fetchOptions: RequestInit = { 
        headers,
        method: showAdvancedOptions ? requestMethod : 'GET'
      };

      // Add request body for POST requests
      if (showAdvancedOptions && requestMethod === 'POST' && requestBody) {
        try {
          // Check if the body is valid JSON
          JSON.parse(requestBody);
          fetchOptions.body = requestBody;
        } catch (err) {
          console.error('Error parsing request body:', err);
          setUploadError('Invalid request body format. Use valid JSON.');
          setIsUploading(false);
          return;
        }
      }

      // If in advanced mode and testUrl is specified, test the endpoint
      if (showAdvancedOptions && testUrl) {
        try {
          const testResponse = await fetch(testUrl, fetchOptions);

          if (testResponse.ok) {
            setTestResult({
              success: true,
              message: `Endpoint test successful! Status: ${testResponse.status} ${testResponse.statusText}`
            });
          } else {
            setTestResult({
              success: false,
              message: `Endpoint test failed. Status: ${testResponse.status} ${testResponse.statusText}`
            });
          }
        } catch (err) {
          console.error('Error testing endpoint:', err);
          setTestResult({
            success: false,
            message: `Error testing endpoint: ${(err as Error).message}`
          });
        }
      }

      // Fetch the API definition
      const response = await fetch(fetchUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`Failed to fetch API definition: ${response.statusText} (${response.status})`);
      }

      let responseText = await response.text();
      setUploadProgress(50);

      // Extract filename from URL
      const url = new URL(apiUrl);
      let fileName = url.pathname.split('/').pop() || 'api-definition';

      // Handle different URL types
      if (urlType === 'swagger') {
        // If this is a Swagger UI page, try to extract the API definition
        if (responseText.includes('swagger-ui')) {
          // Look for the URL to the actual Swagger JSON/YAML
          const matches = responseText.match(/url:\s*['"](.*?)['"]/);
          if (matches && matches[1]) {
            const swaggerDefUrl = new URL(matches[1], apiUrl).href;
            console.log('Found Swagger definition URL:', swaggerDefUrl);
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

      // Extract endpoints from the validated API definition
      if (validationResult.parsedDefinition) {
        const extractedEndpoints = extractEndpoints(
          validationResult.parsedDefinition, 
          validationResult.format
        );
        setEndpoints(extractedEndpoints);
        setShowEndpoints(extractedEndpoints.length > 0);
        console.log('Extracted endpoints:', extractedEndpoints);
      }

      setUploadProgress(100);

      // Call the onUploadComplete callback with the validated API definition
      onUploadComplete({
        name: fileName,
        format: validationResult.format,
        content: JSON.stringify({
          content: responseText,
          format: validationResult.format,
          parsedDefinition: validationResult.parsedDefinition
        }),
        parsedDefinition: validationResult.parsedDefinition
      });

    } catch (error) {
      console.error('Error uploading API definition from URL:', error);
      setUploadError(`Error: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    if (uploadMethod === 'file' && selectedFile) {
      handleFiles(new DataTransfer().items.add(selectedFile)); // Simulate FileList
    } else if (uploadMethod === 'url') {
      handleUrlUpload();
    }
  };

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
                            <RadioGroup value={urlType} onValueChange={(value: any) => setUrlType(value)} className="flex space-x-2">
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="direct" id="direct" />
                                <Label htmlFor="direct">API Definition URL (JSON/YAML)</Label>
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
                                onValueChange={(value: any) => setAuthType(value)}
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
                              <div className="space-y-2">
                                <Label htmlFor="api-key-name">API Key Header</Label>
                                <Input 
                                  id="api-key-name" 
                                  placeholder="X-Api-Key" 
                                  value={apiKeyName}
                                  onChange={(e) => setApiKeyName(e.target.value)}
                                />
                                <Label htmlFor="api-key">API Key</Label>
                                <Input 
                                  id="api-key" 
                                  placeholder="Your API key" 
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="query-params">Query Parameters (JSON object)</Label>
                              <Textarea 
                                id="query-params" 
                                placeholder='{"param1": "value1", "param2": "value2"}' 
                                value={queryParams}
                                onChange={(e) => setQueryParams(e.target.value)}
                                className="h-20"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="test-url">Test Specific Endpoint URL (Optional)</Label>
                              <Input 
                                id="test-url" 
                                placeholder="https://api.example.com/endpoint" 
                                value={testUrl}
                                onChange={(e) => setTestUrl(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter a specific endpoint URL to test if it returns a successful response
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="request-method">Request Method</Label>
                              <Select value={requestMethod} onValueChange={(value: any) => setRequestMethod(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select request method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GET">GET</SelectItem>
                                  <SelectItem value="POST">POST</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {requestMethod === 'POST' && (
                              <div>
                                <Label htmlFor="request-body">Request Body (JSON)</Label>
                                <Textarea
                                  id="request-body"
                                  value={requestBody}
                                  onChange={(e) => setRequestBody(e.target.value)}
                                  className="mt-1"
                                  placeholder='{"key": "value"}'
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                {testResult && (
                  <Alert className="mb-4" variant={testResult.success ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {testResult.success ? 'Success' : 'Error'}
                    </AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
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
                {showEndpoints && (
                  <Accordion type="single" className="mt-4">
                    <AccordionItem value="endpoints">
                      <AccordionTrigger>
                        Endpoints
                        {showEndpoints ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul>
                          {endpoints.map((endpoint, index) => (
                            <li key={index}>
                              {endpoint.path} ({endpoint.methods?.join(', ')})
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}