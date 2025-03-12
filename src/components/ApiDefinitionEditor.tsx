import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ApiDefinitionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ApiDefinitionEditor = ({ value, onChange }: ApiDefinitionEditorProps) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-sm text-gray-600 mb-2">
          Define your API endpoints in YAML or JSON format. This will be used to generate your MCP server code.
        </p>
        <p className="text-xs text-gray-500">
          Example format:
        </p>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
{`endpoints:
  - path: /users
    method: GET
    description: Get all users
    mcpType: resource
    parameters: []
  - path: /users/{id}
    method: GET
    description: Get user by ID
    mcpType: resource
    parameters:
      - name: id
        type: string
        required: true`}
        </pre>
      </div>

      <Textarea
        value={localValue}
        onChange={handleChange}
        placeholder="Enter your API definition here..."
        className="font-mono min-h-[400px]"
      />
    </div>
  );
};

export default ApiDefinitionEditor;