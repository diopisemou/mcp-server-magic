
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ApiDefinition } from "@/types";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileText,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseApiDefinition } from "@/utils/apiParsingUtils";


import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { File as LucideFile, Upload, Link, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateApiDefinition, extractSwaggerUrl } from '@/utils/apiValidator';
import { ApiDefinition, EndpointDefinition } from '@/types';
import { saveApiDefinition } from '@/utils/apiService';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiDefinition, ValidationResult } from '@/types';
import { toast } from 'sonner';
import { validateApiDefinition } from '@/utils/apiValidator';


export interface ApiUploaderProps {
  onUploadComplete: (definition: ApiDefinition) => void;
}


export default function ApiUploader({ onUploadComplete }: ApiUploaderProps) {
  // State definitions - consolidated to avoid duplicates
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [urlType, setUrlType] = useState<"direct" | "swagger">("direct");

const ApiUploader: React.FC<ApiUploaderProps> = ({ projectId, onApiDefinitionUploaded }) => {
  const [apiName, setApiName] = useState('');
  const [apiFormat, setApiFormat] = useState<string | null>(null);
  const [apiContent, setApiContent] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [authType, setAuthType] = useState<"none" | "bearer" | "api-key">(
    "none",
  );
  const [authToken, setAuthToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyName, setApiKeyName] = useState("X-Api-Key");
  const [queryParams, setQueryParams] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("GET");
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<
    { success: boolean; message: string } | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUrl, setIsUrl] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

const ApiUploader: React.FC<ApiUploaderProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [apiName, setApiName] = useState('');

  const [apiUrl, setApiUrl] = useState('');
  const [apiFile, setApiFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Common file processing logic
  const handleFileProcessing = async (file: File) => {
    try {
      setIsUploading(false);

      setIsValidating(true);
      setValidationError(null);
      
      // Generate a name if not provided
      const name = apiName || file.name.split('.')[0];
      
      // Read file content
      const fileContent = await readFileContent(file);
      
      // Validate API definition
      const result = await validateApiDefinition(fileContent, name);
      
      if (result && result.isValid) {
        const apiDefinition: ApiDefinition = {
          id: `api-${Date.now()}`,
          name: name,
          format: result.format,
          content: typeof fileContent === 'string' ? fileContent : JSON.stringify(fileContent),
          parsedDefinition: result.parsedDefinition,
          file: file,
          created_at: new Date().toISOString(),
          endpoint_definition: result.endpoints
        };
        
        onUploadComplete(apiDefinition);
        toast.success('API definition validated successfully!');
      } else {
        setValidationError(result?.errors?.join('\n') || 'Invalid API definition format');
        toast.error('API validation failed');
      }
    } catch (error: any) {
      console.error('File processing error:', error);
      setValidationError(error.message || 'Error processing file');
      toast.error('Error processing file');
    } finally {
      setIsValidating(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error('Please upload a valid API definition file');
      return;
    }
    
    const file = acceptedFiles[0];
    setApiFile(file);
    setApiName(file.name.split('.')[0]);
    await handleFileProcessing(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/plain': ['.raml', '.md', '.apib']
    },
    maxFiles: 1
  });

  const handleApiNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiName(e.target.value);
  };

  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApiContent(e.target.value);
  };

  // Common file handling logic
  const handleFileSelection = (file: File) => {
    // Check file type
    const validTypes = [
      "application/json",
      "application/yaml",
      "application/x-yaml",
      "text/yaml",
      "text/x-yaml",
      "text/plain",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith(".json") &&
      !file.name.endsWith(".yaml") &&
      !file.name.endsWith(".yml")
    ) {
      setFileError("Please upload a valid JSON or YAML file");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setFileError("File is too large. Maximum size is 10MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFileError(null);

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);

  };

  
  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {

      let apiDefinition: ApiDefinition;

      if (uploadMethod === "file") {
        if (!selectedFile) {
          throw new Error("Please select a file to upload");
        }

        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev < 90) return prev + 10;
            clearInterval(interval);
            return prev;
          });
        }, 200);

        const content = await readFileContent(selectedFile);

        // Determine format based on file extension
        const format = selectedFile.name.endsWith(".json") ? "json" : "yaml";

        apiDefinition = {
          id: null,
          name: selectedFile.name.replace(/\.(json|yaml|yml)$/, ""),
          content,
          format,
          parsedDefinition: null,
          created_at: new Date().toISOString(),
        };

        clearInterval(interval);
        setUploadProgress(100);
      } else {
        if (!apiUrl) {
          throw new Error("Please enter an API URL");
        }

        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev < 90) return prev + 10;
            clearInterval(interval);
            return prev;
          });
        }, 200);

        // Prepare request options based on auth method
        const requestOptions: RequestInit = {
          method: requestMethod,
          headers: {},
        };

        if (authType === "bearer") {
          requestOptions.headers = {
            ...requestOptions.headers,
            "Authorization": `Bearer ${authToken}`,
          };
        } else if (authType === "api-key") {
          requestOptions.headers = {
            ...requestOptions.headers,
            [apiKeyName]: apiKey,
          };
        }

        // Add request body for POST requests
        if (requestMethod === "POST" && requestBody) {
          try {
            requestOptions.body = requestBody;
            requestOptions.headers = {
              ...requestOptions.headers,
              "Content-Type": "application/json",
            };
          } catch (e) {
            throw new Error("Invalid JSON in request body");
          }
        }

        // Add query parameters if any
        let fetchUrl = apiUrl;
        if (queryParams) {
          try {
            const params = new URLSearchParams();
            const queryParamsObj = JSON.parse(`{${queryParams}}`);
            Object.entries(queryParamsObj).forEach(([key, value]) => {
              params.append(key, String(value));
            });
            fetchUrl += `?${params.toString()}`;
          } catch (e) {
            throw new Error("Invalid query parameters format");
          }
        }

        const response = await fetch(fetchUrl, requestOptions);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch API: ${response.status} ${response.statusText}`,
          );
        }

        const content = await response.text();

        // Try to determine if it's JSON or YAML
        let format = "json";
        try {
          JSON.parse(content);
        } catch (e) {
          format = "yaml";
        }

        const urlParts = new URL(apiUrl).pathname.split("/");
        const fileName = urlParts[urlParts.length - 1] || "api-definition";

        apiDefinition = {
          id: null,
          name: fileName.replace(/\.(json|yaml|yml)$/, ""),
          content,
          format,
          parsedDefinition: null,
          created_at: new Date().toISOString(),
        };

        clearInterval(interval);
        setUploadProgress(100);
      }

      // Validate the API definition
      const validationResult = parseApiDefinition(
        apiDefinition.content,
        apiDefinition.file?._name,
      );

      if (!validationResult.validationResult.isValid) {
        setValidationErrors(
          validationResult.validationResult.errors ||
            ["Invalid API definition"],
        );
        throw new Error("API definition validation failed");
      }

      // Extract endpoints for preview
      setEndpoints(validationResult.endpoints || []);
      //setEndpoints(validationResult || []);
      setShowEndpoints(true);

      // Complete the upload
      onUploadComplete({
        ...apiDefinition,
        parsedDefinition: validationResult.validationResult.parsedDefinition,
      });

      toast.success("API definition uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );

    } finally {
      setIsUploading(false);
    }
  };


  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          resolve(e.target.result);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  };

  // Test API URL
  const testApiUrl = async () => {
    if (!testUrl) {
      toast.error("Please enter a URL to test");
      return;
    }

    try {
      const response = await fetch(testUrl);
      if (response.ok) {
        setTestResult({
          success: true,
          message: `Success! Status: ${response.status}`,
        });
        toast.success(`Test successful! Status: ${response.status}`);
      } else {
        setTestResult({
          success: false,
          message: `Failed with status: ${response.status}`,
        });
        toast.error(`Test failed! Status: ${response.status}`);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error
          ? error.message
          : "An unknown error occurred",
      });
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );

    try {
      setIsUploading(true);
      setValidationError(null);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch API definition: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      let content;
      
      if (contentType.includes('application/json')) {
        content = await response.json();
      } else {
        content = await response.text();
      }
      
      // Generate a name from URL if not provided
      const urlParts = apiUrl.split('/');
      const name = apiName || urlParts[urlParts.length - 1].split('?')[0] || 'API Definition';
      
      // Validate API definition
      const result = await validateApiDefinition(content, name);
      
      if (result && result.isValid) {
        const apiDefinition: ApiDefinition = {
          id: `api-${Date.now()}`,
          name: name,
          format: result.format,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          parsedDefinition: result.parsedDefinition,
          url: apiUrl,
          created_at: new Date().toISOString(),
          endpoint_definition: result.endpoints
        };
        
        onUploadComplete(apiDefinition);
        toast.success('API definition validated successfully!');
      } else {
        setValidationError(result?.errors?.join('\n') || 'Invalid API definition format');
        toast.error('API validation failed');
      }
    } catch (error: any) {
      console.error('URL fetch error:', error);
      setValidationError(error.message || 'Error fetching URL');
      toast.error('Error fetching URL');
    } finally {
      setIsFetching(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          try {
            // Try to parse as JSON
            if (file.type === 'application/json') {
              const jsonContent = JSON.parse(event.target.result as string);
              resolve(jsonContent);
            } else {
              // Return as plain text
              resolve(event.target.result as string);
            }
          } catch (error) {
            // If JSON parsing fails, return as string
            resolve(event.target.result as string);
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleApiPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle pasted files
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          setApiFile(file);
          setApiName(file.name.split('.')[0]);
          await handleFileProcessing(file);
          return;
        }
      }
      
      // Handle pasted text that might be JSON/YAML
      if (item.kind === 'string' && (item.type === 'text/plain' || item.type.includes('json'))) {
        item.getAsString(async (text) => {
          try {
            setIsValidating(true);
            setValidationError(null);
            
            // Try to validate the pasted content
            const result = await validateApiDefinition(text, apiName || 'Pasted API');
            
            if (result && result.isValid) {
              const apiDefinition: ApiDefinition = {
                id: `api-${Date.now()}`,
                name: apiName || 'Pasted API',
                format: result.format,
                content: text,
                parsedDefinition: result.parsedDefinition,
                created_at: new Date().toISOString(),
                endpoint_definition: result.endpoints
              };
              
              onUploadComplete(apiDefinition);
              toast.success('API definition validated successfully!');
            } else {
              setValidationError(result?.errors?.join('\n') || 'Invalid API definition format');
              toast.error('API validation failed');
            }
          } catch (error: any) {
            console.error('Paste processing error:', error);
            setValidationError(error.message || 'Error processing pasted content');
            toast.error('Error processing pasted content');
          } finally {
            setIsValidating(false);
          }
        });
        return;
      }
    }
  };

  return (
    <div className="relative py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            API Definition
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Upload Your API Definition
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload your OpenAPI, Swagger, or other API definition to quickly map
            it to MCP capabilities. We support JSON and YAML formats.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-border">
          <div className="p-6">
            <RadioGroup
              value={uploadMethod}
              onValueChange={(value) =>
                setUploadMethod(value as "file" | "url")}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div
                className={cn(
                  "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors",
                  uploadMethod === "file"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary",
                )}
              >
                <RadioGroupItem value="file" id="file" />
                <Label
                  htmlFor="file"
                  className="cursor-pointer flex items-center"
                >
                  <FileJson className="h-5 w-5 mr-2 text-primary" />
                  Upload File
                </Label>
              </div>
              <div
                className={cn(
                  "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors",
                  uploadMethod === "url"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary",
                )}
              >
                <RadioGroupItem value="url" id="url" />
                <Label
                  htmlFor="url"
                  className="cursor-pointer flex items-center"
                >
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Fetch from URL
                </Label>
              </div>
            </RadioGroup>

            {uploadMethod === "file"
              ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/50",
                      fileError && "border-destructive bg-destructive/5",
                    )}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".json,.yaml,.yml"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      {selectedFile
                        ? (
                          <div>
                            <p className="font-medium mb-1">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(2)} KB •{" "}
                              {selectedFile.type || "Unknown type"}
                            </p>
                          </div>
                        )
                        : (
                          <div>
                            <p className="font-medium mb-1">
                              {fileError ||
                                "Drag & drop or click to select a file"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Supports JSON and YAML formats (.json, .yaml,
                              .yml)
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )
              : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-url">API URL</Label>
                    <Input
                      id="api-url"
                      type="url"
                      placeholder="https://example.com/api-spec.json"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL to your API definition (OpenAPI, Swagger, etc.)
                    </p>
                  </div>

                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm flex items-center"
                      onClick={toggleAdvancedOptions}
                    >
                      {showAdvancedOptions
                        ? <ChevronUp className="h-4 w-4 mr-1" />
                        : <ChevronDown className="h-4 w-4 mr-1" />}
                      Advanced Options
                    </Button>
                  </div>

                  {showAdvancedOptions && (
                    <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
                      <div>
                        <Label htmlFor="request-method">Request Method</Label>
                        <Select
                          value={requestMethod}
                          onValueChange={(value) =>
                            setRequestMethod(value as "GET" | "POST")}
                        >
                          <SelectTrigger id="request-method">
                            <SelectValue placeholder="Request Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="auth-type">Authentication</Label>
                        <Select
                          value={authType}
                          onValueChange={(value) =>
                            setAuthType(value as "none" | "bearer" | "api-key")}
                        >
                          <SelectTrigger id="auth-type">
                            <SelectValue placeholder="Authentication Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {authType === "bearer" && (
                        <div>
                          <Label
                            htmlFor="auth-token"
                            className="flex items-center gap-1"
                          >
                            <Lock className="h-3 w-3" /> Bearer Token
                          </Label>
                          <Input
                            id="auth-token"
                            type="password"
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            placeholder="Enter your bearer token"
                          />
                        </div>
                      )}

                      {authType === "api-key" && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="api-key-name">
                              API Key Header Name
                            </Label>
                            <Input
                              id="api-key-name"
                              value={apiKeyName}
                              onChange={(e) => setApiKeyName(e.target.value)}
                              placeholder="X-Api-Key"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="api-key"
                              className="flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" /> API Key
                            </Label>
                            <Input
                              id="api-key"
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="Enter your API key"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="query-params">Query Parameters</Label>
                        <Textarea
                          id="query-params"
                          value={queryParams}
                          onChange={(e) => setQueryParams(e.target.value)}
                          placeholder='"format": "json", "version": "2.0"'
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          JSON format as key-value pairs
                        </p>
                      </div>

                      {requestMethod === "POST" && (
                        <div>
                          <Label htmlFor="request-body">Request Body</Label>
                          <Textarea
                            id="request-body"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder="{}"
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="pt-2">
                        <Label htmlFor="test-url">
                          Test with a Sample Endpoint
                        </Label>
                        <div className="flex space-x-2">
                          <Input
                            id="test-url"
                            type="url"
                            value={testUrl}
                            onChange={(e) => setTestUrl(e.target.value)}
                            placeholder="https://example.com/api/test"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={testApiUrl}
                          >
                            Test
                          </Button>
                        </div>
                        {testResult && (
                          <div
                            className={cn(
                              "mt-2 text-sm rounded p-2",
                              testResult.success
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700",
                            )}
                          >
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {isUploading && (
              <div className="mt-4">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {uploadMethod === "file"
                    ? "Processing file..."
                    : "Fetching from URL..."}
                </p>
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading
                  ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadMethod === "file"
                        ? "Processing..."
                        : "Fetching API..."}
                    </>
                  )
                  : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload API Definition
                    </>
                  )}
              </Button>

              {showEndpoints && (
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="endpoints">
                    <AccordionTrigger>
                      Detected Endpoints ({endpoints.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      {endpoints.length === 0
                        ? (
                          <p className="text-muted-foreground text-sm">
                            No endpoints detected
                          </p>
                        )
                        : (
                          <ul className="space-y-1">
                            {endpoints.map((endpoint, index) => (
                              <li key={index} className="text-sm">
                                <span
                                  className={cn(
                                    "inline-block px-2 py-0.5 rounded text-xs font-medium mr-2",
                                    endpoint.method === "GET"
                                      ? "bg-green-100 text-green-700"
                                      : endpoint.method === "POST"
                                      ? "bg-blue-100 text-blue-700"
                                      : endpoint.method === "PUT"
                                      ? "bg-amber-100 text-amber-700"
                                      : endpoint.method === "DELETE"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-gray-100 text-gray-700",
                                  )}
                                >
                                  {endpoint.method}
                                </span>
                                <code className="font-mono bg-secondary px-1 py-0.5 rounded">
                                  {endpoint.path}
                                </code>
                              </li>
                            ))}
                          </ul>
                        )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

    <Card>
      <CardHeader>
        <CardTitle>Upload API Definition</CardTitle>
        <CardDescription>
          Import your API definition from a file or URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <Label htmlFor="apiName">API Name</Label>
          <Input
            id="apiName"
            placeholder="My API"
            value={apiName}
            onChange={handleNameChange}
          />
        </div>
        
    <div className="space-y-6" onPaste={handleApiPaste}>
      <div className="space-y-2">
        <Label htmlFor="apiName">API Name</Label>
        <Input 
          id="apiName" 
          value={apiName} 
          onChange={handleApiNameChange} 
          placeholder="Enter a name for your API"
        />
      </div>
      
      <div className="flex flex-col gap-4">

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isDragActive 
                ? 'Drop the file here...' 
                : 'Drag and drop your API definition file, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports OpenAPI (Swagger), RAML, and API Blueprint formats
            </p>
          </div>
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="apiUrl">API URL</Label>
          <div className="relative">
            <Input
              id="apiUrl"
              placeholder="https://example.com/openapi.json"
              value={apiUrl}
              onChange={handleApiUrlChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              onClick={handleFetchApi}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Fetch
                </>
              )}
            </Button>
          </div>
          {fetchError && (
            <p className="text-sm text-red-500">{fetchError}</p>
          {apiFile && (
            <div className="mt-2 text-sm font-medium text-primary">
              Selected: {apiFile.name}
            </div>

          )}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">OR</div>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">API Definition URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="apiUrl" 
                  value={apiUrl} 
                  onChange={handleApiUrlChange} 
                  placeholder="https://example.com/swagger.json"
                  className="flex-1"
                />
                <Button 
                  onClick={handleUrlUpload} 
                  disabled={isUploading || !apiUrl}
                  className="whitespace-nowrap"
                >
                  {isUploading ? 'Fetching...' : 'Fetch URL'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isValidating && (
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm font-medium">Validating API definition...</p>
        </div>
      )}
      
      {validationError && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-2">Validation Error</p>
          <pre className="text-xs whitespace-pre-wrap font-mono">{validationError}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiUploader;
