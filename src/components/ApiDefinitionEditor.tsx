
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

interface ApiDefinitionEditorProps {
  apiDefinition: {
    id: string;
    name: string;
    description: string;
    format: string;
    content: string;
  };
  onSave: (updatedDefinition: any) => void;
  onCancel: () => void;
}

const ApiDefinitionEditor: React.FC<ApiDefinitionEditorProps> = ({
  apiDefinition,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(apiDefinition.name);
  const [description, setDescription] = useState(apiDefinition.description || '');
  const [format, setFormat] = useState(apiDefinition.format);
  const [content, setContent] = useState(apiDefinition.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedDefinition = {
      name,
      description,
      format,
      content,
    };
    
    onSave(updatedDefinition);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">API Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter API name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter API description"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="format">Format</Label>
          <Select
            value={format}
            onValueChange={setFormat}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openapi">OpenAPI</SelectItem>
              <SelectItem value="swagger">Swagger</SelectItem>
              <SelectItem value="graphql">GraphQL</SelectItem>
              <SelectItem value="grpc">gRPC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="content">API Definition</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your API definition here"
            className="font-mono text-sm"
            rows={15}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ApiDefinitionEditor;
