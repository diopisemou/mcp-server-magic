import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { File as LucideFile, Upload, Link, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateApiDefinition, extractSwaggerUrl, extractEndpointsFromDefinition } from '@/utils/apiValidator';
import { ApiDefinition, EndpointDefinition } from '@/types';
import { saveApiDefinition } from '@/utils/apiService';
import { v4 as uuidv4 } from 'uuid';

interface ApiUploaderProps {
  projectId: string;
  onApiDefinitionUploaded: (apiDefinition: ApiDefinition) => void;
}

const ApiUploader: React.FC<ApiUploaderProps> = ({ projectId, onApiDefinitionUploaded }) => {
  const [apiName, setApiName] = useState('');
  const [apiFormat, setApiFormat] = useState<string | null>(null);
  const [apiContent, setApiContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      handleFileProcessing(file);
    }
  }, []);
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiName(e.target.value);
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApiContent(e.target.value);
  };
  
  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };
  
  const handleFileProcessing = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          const validationResult = await validateApiDefinition(content, file.name);
          if (validationResult.isValid) {
            setApiFormat(validationResult.format);
            setApiContent(content);
          } else {
            setUploadError(`Invalid API definition: ${validationResult.errors?.join(', ') || 'Unknown error'}`);
          }
        } else {
          setUploadError('Failed to read file content.');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read the file.');
        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File processing error:', error);
      setUploadError('An unexpected error occurred while processing the file.');
      setIsUploading(false);
    }
  };
  
  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      if (!apiName) {
        setUploadError('API Name is required.');
        setIsUploading(false);
        return;
      }
      
      const validationResult = await validateApiDefinition(apiContent);
      if (!validationResult.isValid) {
        setUploadError(`Invalid API definition: ${validationResult.errors?.join(', ') || 'Unknown error'}`);
        setIsUploading(false);
        return;
      }
      
      const apiDefinition: ApiDefinition = {
        id: uuidv4(),
        project_id: projectId,
        name: apiName,
        format: validationResult.format,
        content: apiContent,
        parsedDefinition: validationResult.parsedDefinition,
        endpoint_definition: extractEndpointsFromDefinition(apiContent),
        created_at: new Date().toISOString(),
      };
      
      await saveApiDefinition(apiDefinition);
      
      setUploadSuccess(true);
      toast({
        title: "Success",
        description: "API definition uploaded successfully.",
      });
      
      onApiDefinitionUploaded(apiDefinition);
    } catch (error) {
      console.error('API upload error:', error);
      setUploadError('Failed to upload API definition. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFetchApi = async () => {
    setIsFetching(true);
    setFetchError(null);
    setApiFormat(null);
    
    try {
      if (!apiUrl) {
        setFetchError('API URL is required.');
        setIsFetching(false);
        return;
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      let content = '';
      
      if (contentType?.includes('text/html')) {
        const htmlContent = await response.text();
        const swaggerUrl = extractSwaggerUrl(htmlContent, apiUrl);
        if (swaggerUrl) {
          setApiUrl(swaggerUrl);
          const swaggerResponse = await fetch(swaggerUrl);
          if (!swaggerResponse.ok) {
            throw new Error(`HTTP error fetching Swagger file! status: ${swaggerResponse.status}`);
          }
          content = await swaggerResponse.text();
        } else {
          throw new Error('Could not extract Swagger URL from the HTML.');
        }
      } else {
        content = await response.text();
      }
      
      const validationResult = await validateApiDefinition(content);
      if (validationResult.isValid) {
        setApiFormat(validationResult.format);
        setApiContent(content);
        setApiName('Fetched API');
        toast({
          title: "Success",
          description: "API definition fetched successfully.",
        });
      } else {
        setFetchError(`Invalid API definition: ${validationResult.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('API fetch error:', error);
      setFetchError(`Failed to fetch API definition: ${(error as Error).message}`);
    } finally {
      setIsFetching(false);
    }
  };

const handleFileProcessing = async (file: File) => {
  setIsUploading(true);
  setUploadError(null);
  setUploadSuccess(false);
  
  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const validationResult = await validateApiDefinition(content, file.name);
        if (validationResult.isValid) {
          setApiFormat(validationResult.format);
          setApiContent(content);
        } else {
          setUploadError(`Invalid API definition: ${validationResult.errors?.join(', ') || 'Unknown error'}`);
        }
      } else {
        setUploadError('Failed to read file content.');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file.');
      setIsUploading(false);
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('File processing error:', error);
    setUploadError('An unexpected error occurred while processing the file.');
    setIsUploading(false);
  }
};

const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  setIsDragging(false);
  
  const items = event.dataTransfer.items;
  if (items) {
    // Convert DataTransferItemList to array and process first file
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await handleFileProcessing(file);
          break;
        }
      }
    }
  } else {
    const files = event.dataTransfer.files;
    if (files.length) {
      await handleFileProcessing(files[0]);
    }
  }
};
  
  return (
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
        
        <div 
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${isDragging ? 'border-primary' : 'border-muted-foreground'}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <LucideFile className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop the file here...' : 'Click to upload or drag and drop your API definition file'}
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
          )}
        </div>
        
        <div className="grid gap-4">
          <Label htmlFor="apiContent">API Definition</Label>
          <Textarea
            id="apiContent"
            placeholder="Paste your API definition here"
            value={apiContent}
            onChange={handleContentChange}
            className="min-h-[150px]"
          />
        </div>
        
        {uploadError && (
          <div className="flex items-center text-sm text-red-500">
            <XCircle className="h-4 w-4 mr-1" />
            {uploadError}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="flex items-center text-sm text-green-500">
            <CheckCircle className="h-4 w-4 mr-1" />
            API definition uploaded successfully!
          </div>
        )}
      </CardContent>
      <div className="p-6 flex justify-end">
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload API
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ApiUploader;
