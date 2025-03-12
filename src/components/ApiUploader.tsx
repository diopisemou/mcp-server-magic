import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { FileUploader } from './FileUploader';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { validateApiDefinition, extractEndpoints } from '@/utils/apiValidator';
import { AlertCircle, FileText, Upload, Link as LinkIcon, Code, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Endpoint } from '@/types';

export default function ApiUploader({onUploadComplete}: {onUploadComplete?: (apiDef: any) => void} = {}) {
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState<'file' | 'url' | 'raw'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedApi, setValidatedApi] = useState<any>(null);
  const [extractedEndpoints, setExtractedEndpoints] = useState<Endpoint[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    try {
      const content = await file.text();
      setContent(content);

      // Auto-detect and validate content when file is uploaded
      if (content.trim()) {
        try {
          const result = await validateApiDefinition(content, file.name);
          if (!result.isValid) {
            setError(`Invalid API definition: ${result.errors?.join(', ')}`);
          } else {
            toast.success(`Valid ${result.format} definition detected`);
          }
        } catch (validationErr) {
          console.error("Validation error:", validationErr);
          // Don't show validation errors yet, wait for user to submit
        }
      }
    } catch (err) {
      setError(`Error reading file: ${(err as Error).message}`);
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSelectedFile(null);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    setIsValidating(true);
    setError(null); // Clear any previous errors

    try {
      if (sourceType === 'raw' && !content) {
        setError('Please enter API definition content');
        setIsValidating(false);
        return;
      }

      if (sourceType === 'url' && !url) {
        setError('Please enter a valid URL');
        setIsValidating(false);
        return;
      }

      let apiContent = content;
      let fileName = 'api-definition';

      if (sourceType === 'file') {
        if (!selectedFile) {
          setError('Please select a file');
          setIsValidating(false);
          return;
        }
        fileName = selectedFile.name;
      } else if (sourceType === 'url') {
        // In a real app, fetch content from URL
        setError('URL import is not implemented in this demo');
        setIsValidating(false);
        return;
      }

      // Determine proper file extension and content type based on content
      const contentType = apiContent.trim().startsWith('{') ? 'json' : 'yaml';
      fileName = fileName || `api-definition.${contentType}`;

      console.log('Validating API definition:', {
        contentType,
        fileName,
        contentPreview: apiContent.substring(0, 100) + '...'
      });

      const result = await validateApiDefinition(apiContent, fileName);

      if (!result.isValid) {
        setError(`Invalid API definition: ${result.errors?.join(', ')}`);
        setIsValidating(false);
        return;
      }

      console.log('API validation result:', result);
      setValidatedApi(result);

      // Extract endpoints
      if (result.parsedDefinition && result.format) {
        console.log("Extracting endpoints from validated API");
        const endpoints = extractEndpoints(result.parsedDefinition, result.format);
        console.log("Extracted endpoints:", endpoints);
        setExtractedEndpoints(endpoints);

        if (endpoints.length === 0) {
          toast.warning("No endpoints found in the API definition");
        } else {
          toast.success(`Found ${endpoints.length} endpoints`);
        }
      }

      toast.success('API successfully validated!');
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      console.error('Error during API upload:', err);
      setError(`Error: ${(err as Error).message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setError(null);

    if (!content) {
      setError('No content to validate');
      setIsValidating(false);
      return;
    }

    try {
      const result = await validateApiDefinition(content);
      if (!result.isValid) {
        setError(result.errors?.join(', ') || 'Invalid API definition');
        return;
      }

      const apiDef = {
        name: selectedFile?.name || url || 'API Definition',
        format: result.format,
        content: JSON.stringify({
          originalContent: content,
          parsedDefinition: result.parsedDefinition,
          format: result.format
        })
      };

      setValidatedApi(apiDef);

      const endpoints = extractEndpoints(result.parsedDefinition, result.format);
      setExtractedEndpoints(endpoints);

      toast({
        title: 'API Definition Validated',
        description: `Format: ${result.format}. Found ${endpoints.length} endpoints.`
      });

      // Call onUploadComplete if provided
      if (onUploadComplete) {
        onUploadComplete(apiDef);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Error validating API definition');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="py-24 relative overflow-hidden" id="start">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-bold text-3xl md:text-5xl mb-4">API Definition</h1>
            <p className="text-md md:text-lg text-muted-foreground">
              Upload your API definition to generate an MCP server
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm">
            <Tabs defaultValue="file" onValueChange={(value) => setSourceType(value as any)}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="file" className="flex gap-2 items-center">
                  <FileText className="h-4 w-4" />
                  File
                </TabsTrigger>
                <TabsTrigger value="url" className="flex gap-2 items-center">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="raw" className="flex gap-2 items-center">
                  <Code className="h-4 w-4" />
                  Raw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <FileUploader onFileSelected={handleFileChange} />

                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Selected: {selectedFile.name}</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">API Definition URL</Label>
                  <Input
                    id="api-url"
                    placeholder="https://example.com/openapi.json"
                    onChange={handleUrlChange}
                    value={url}
                  />
                </div>
              </TabsContent>

              <TabsContent value="raw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-content">API Definition</Label>
                  <Textarea
                    id="api-content"
                    placeholder="Paste your OpenAPI, Swagger, RAML or API Blueprint definition here"
                    className="min-h-[300px] font-mono text-sm"
                    onChange={handleContentChange}
                    value={content}
                  />
                </div>
              </TabsContent>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mt-6">
                <Button 
                  onClick={handleUpload}
                  disabled={isValidating}
                  className="w-full"
                >
                  {isValidating ? 'Validating...' : 'Upload API Definition'}
                  {!isValidating && <Upload className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </Tabs>
          </div>

          {validatedApi && validatedApi.isValid && (
            <div className="mt-8 p-6 bg-card rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <CheckCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Valid API Definition</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium">API Information</h3>
                  <p className="text-muted-foreground">
                    {validatedApi.apiInfo?.title} (v{validatedApi.apiInfo?.version})
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: {validatedApi.format}
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-medium">Endpoints ({extractedEndpoints.length})</h3>
                  {extractedEndpoints.length === 0 ? (
                    <p className="text-muted-foreground">No endpoints detected</p>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {extractedEndpoints.slice(0, 5).map((endpoint) => (
                        <li key={endpoint.id} className="p-3 bg-muted rounded-md text-sm">
                          <div className="flex items-center">
                            <span className={
                              endpoint.method === 'GET' ? 'text-blue-600' :
                              endpoint.method === 'POST' ? 'text-green-600' :
                              endpoint.method === 'PUT' ? 'text-amber-600' :
                              endpoint.method === 'DELETE' ? 'text-red-600' :
                              'text-slate-600'
                            }>
                              {endpoint.method}
                            </span>
                            <span className="ml-2 font-mono">{endpoint.path}</span>
                          </div>
                          <p className="text-muted-foreground text-xs mt-1">
                            {endpoint.summary || endpoint.description || 'No description'}
                          </p>
                        </li>
                      ))}
                      {extractedEndpoints.length > 5 && (
                        <li className="text-center text-sm text-muted-foreground">
                          ...and {extractedEndpoints.length - 5} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}