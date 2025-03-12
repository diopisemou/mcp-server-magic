
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { validateApiDefinition } from '@/utils/apiValidator';
import { useToast } from "@/components/ui/use-toast";

interface APIFileUploaderProps {
  onApiParsed: (result: any) => void;
  buttonLabel?: string;
}

export default function APIFileUploader({ onApiParsed, buttonLabel = "Upload API Definition" }: APIFileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await file.text();
      console.log(`File loaded: ${file.name}, size: ${content.length} bytes`);
      
      // Validate the API definition
      const result = await validateApiDefinition(content, file.name);
      
      if (result.isValid) {
        toast({
          title: "API Definition Loaded",
          description: `Successfully parsed ${result.format} definition.`,
        });
        onApiParsed(result);
      } else {
        toast({
          title: "Invalid API Definition",
          description: `Errors: ${result.errors?.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error parsing API file:", error);
      toast({
        title: "Error Parsing File",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset the file input
      event.target.value = '';
    }
  }, [onApiParsed, toast]);

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={() => document.getElementById('api-file-upload')?.click()}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : buttonLabel}
      </Button>
      <input
        id="api-file-upload"
        type="file"
        accept=".json,.yaml,.yml,.raml"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
