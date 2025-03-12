
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ApiUploaderProps {
  onUploadComplete: (definition: ApiDefinition) => void;
}

const ApiUploader = ({ onUploadComplete }: ApiUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUrl, setIsUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
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
    
    // Check file type
    const validTypes = ['application/json', 'application/x-yaml', 'text/yaml', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JSON or YAML files.');
      setUploading(false);
      return;
    }
    
    // Simulate file processing with a delay
    try {
      // Read file content
      const content = await file.text();
      
      // Create API definition object
      const apiDefinition: ApiDefinition = {
        name: file.name,
        format: 'OpenAPI3', // Default, would be determined by validation
        content,
        file
      };
      
      // Simulate API validation delay
      setTimeout(() => {
        onUploadComplete(apiDefinition);
        setUploading(false);
        toast.success('API definition uploaded successfully');
      }, 1500);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please try again.');
      setUploading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    // Simulate URL validation and fetching
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Please enter a valid URL');
      setUploading(false);
      return;
    }
    
    // Simulate API fetching with a delay
    setTimeout(() => {
      const apiDefinition: ApiDefinition = {
        name: url.split('/').pop() || 'api-definition',
        format: 'OpenAPI3', // Default, would be determined by validation
        content: '{"openapi": "3.0.0", "info": {"title": "Sample API", "version": "1.0.0"}}', // Placeholder
        url
      };
      
      onUploadComplete(apiDefinition);
      setUploading(false);
      toast.success('API definition fetched successfully');
    }, 2000);
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
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="40" 
                      height="40" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mx-auto mb-4 text-muted-foreground"
                    >
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                      <path d="M12 12v9" />
                      <path d="m16 16-4-4-4 4" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">
                      {dragActive 
                        ? 'Drop your API definition file here' 
                        : 'Drag and drop your API definition file here'
                      }
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Supports OpenAPI, RAML, and API Blueprint formats
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
