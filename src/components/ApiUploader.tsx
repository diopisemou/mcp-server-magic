
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiDefinition, ValidationResult } from '@/types';
import { toast } from 'sonner';
import { validateApiDefinition } from '@/utils/apiValidator';

export interface ApiUploaderProps {
  onUploadComplete: (definition: ApiDefinition) => void;
}

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

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };

  const handleUrlUpload = async () => {
    if (!apiUrl) {
      toast.error('Please enter an API definition URL');
      return;
    }

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
      setIsUploading(false);
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
