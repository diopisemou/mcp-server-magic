
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FileJson, Upload, FileText, AlertCircle } from 'lucide-react';
import { validateApiDefinition } from '@/utils/apiValidator';

interface ApiUploaderProps {
  onUploadComplete: (definition: ApiDefinition) => void;
}

const ApiUploader = ({ onUploadComplete }: ApiUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUrl, setIsUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setValidationErrors([]);
    
    // Check file type
    const validTypes = ['application/json', 'application/x-yaml', 'text/yaml', 'text/plain', 'text/markdown'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JSON, YAML, RAML, or Markdown files.');
      setUploading(false);
      return;
    }
    
    try {
      // Read file content
      const content = await file.text();
      
      // Validate API definition
      const { isValid, format, errors, parsedDefinition } = await validateApiDefinition(content, file.name);
      
      if (!isValid) {
        setValidationErrors(errors || ['Invalid API definition format']);
        toast.error('API definition validation failed');
        setUploading(false);
        return;
      }
      
      // Create API definition object
      const apiDefinition: ApiDefinition = {
        name: file.name,
        format,
        content,
        parsedDefinition,
        file
      };
      
      onUploadComplete(apiDefinition);
      setUploading(false);
      toast.success(`API definition (${format}) uploaded successfully`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please try again.');
      setUploading(false);
    }
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
    
    // Fetch and validate API definition from URL
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(async (content) => {
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
      })
      .catch(error => {
        console.error('Error fetching API definition:', error);
        toast.error('Failed to fetch API definition. Please check the URL and try again.');
        setValidationErrors([error.message]);
      })
      .finally(() => {
        setUploading(false);
      });
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
                </form>
              )}
              
              {validationErrors.length > 0 && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-md border border-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Validation errors</p>
                      <ul className="mt-2 text-sm text-destructive space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              By uploading your API definition, you agree to our{' '}
              <a href="#" className="text-primary underline underline-offset-2">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApiUploader;
