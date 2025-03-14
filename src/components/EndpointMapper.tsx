import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from 'uuid';
import { Endpoint, Parameter, Response } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface EndpointMapperProps {
  endpoint: Endpoint;
  onUpdate: (updatedEndpoint: Endpoint) => void;
  onDelete: (id: string) => void;
}

const EndpointMapper: React.FC<EndpointMapperProps> = ({ endpoint, onUpdate, onDelete }) => {
  const [id, setId] = useState(endpoint.id);
  const [path, setPath] = useState(endpoint.path);
  const [method, setMethod] = useState(endpoint.method);
  const [description, setDescription] = useState(endpoint.description);
  const [parameters, setParameters] = useState(endpoint.parameters);
  const [responses, setResponses] = useState(endpoint.responses);
  const [selected, setSelected] = useState(endpoint.selected !== undefined ? endpoint.selected : true);
  const [mcpType, setMcpType] = useState(endpoint.mcpType || 'none');

  const [newParameterName, setNewParameterName] = useState('');
  const [newParameterType, setNewParameterType] = useState('string');
  const [newParameterRequired, setNewParameterRequired] = useState(false);
  const [newParameterDescription, setNewParameterDescription] = useState('');

  const [newResponseStatus, setNewResponseStatus] = useState('');
  const [newResponseDescription, setNewResponseDescription] = useState('');
  const { toast } = useToast();

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMethod(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleParameterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewParameterName(e.target.value);
  };

  const handleParameterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewParameterType(e.target.value);
  };

  const handleParameterRequiredChange = (checked: boolean) => {
    setNewParameterRequired(checked);
  };

  const handleParameterDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewParameterDescription(e.target.value);
  };

  const handleAddParameter = () => {
    if (!newParameterName || !newParameterType) return;

    setParameters([
      ...parameters,
      {
        name: newParameterName,
        type: newParameterType,
        required: newParameterRequired,
        description: newParameterDescription
      }
    ]);

    setNewParameterName('');
    setNewParameterType('string');
    setNewParameterRequired(false);
    setNewParameterDescription('');
  };

  const handleRemoveParameter = (index: number) => {
    const newParams = [...parameters];
    newParams.splice(index, 1);
    setParameters(newParams);
  };

  const handleResponseStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewResponseStatus(e.target.value);
  };

  const handleResponseDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewResponseDescription(e.target.value);
  };

  const handleAddResponse = () => {
    if (!newResponseStatus || !newResponseDescription) return;

    setResponses([
      ...responses,
      {
        statusCode: parseInt(newResponseStatus) || newResponseStatus,
        description: newResponseDescription,
        schema: {} // Add a default empty schema
      }
    ]);

    setNewResponseStatus('');
    setNewResponseDescription('');
  };

  const handleRemoveResponse = (index: number) => {
    const newResponses = [...responses];
    newResponses.splice(index, 1);
    setResponses(newResponses);
  };

  const handleTypeChange = (value: "resource" | "tool" | "none") => {
    setMcpType(value);
  };

  const handleSave = () => {
    const updatedEndpoint: Endpoint = {
      id: id,
      path: path,
      method: method,
      description: description,
      parameters: parameters,
      responses: responses,
      selected: selected,
      mcpType: mcpType
    };
    onUpdate(updatedEndpoint);
    toast({
      title: "Success",
      description: "Endpoint updated successfully.",
    });
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const handleSelectedChange = (checked: boolean) => {
    setSelected(checked);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Endpoint</CardTitle>
        <CardDescription>Modify the endpoint details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="path">Path</Label>
              <Input id="path" value={path} onChange={handlePathChange} />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <Select onValueChange={handleMethodChange} defaultValue={method}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={handleDescriptionChange} />
          </div>

          <div>
            <h4 className="mb-2">Parameters</h4>
            {parameters.map((param, index) => (
              <div key={index} className="flex items-center justify-between mb-2">
                <div>
                  {param.name} ({param.type}) - {param.required ? 'Required' : 'Optional'}: {param.description}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRemoveParameter(index)}>Remove</Button>
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label htmlFor="newParameterName">Name</Label>
                <Input id="newParameterName" value={newParameterName} onChange={handleParameterNameChange} />
              </div>
              <div>
                <Label htmlFor="newParameterType">Type</Label>
                <Select onValueChange={handleParameterTypeChange} defaultValue={newParameterType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newParameterRequired">Required</Label>
                <Switch id="newParameterRequired" checked={newParameterRequired} onCheckedChange={handleParameterRequiredChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="newParameterDescription">Description</Label>
              <Textarea id="newParameterDescription" value={newParameterDescription} onChange={handleParameterDescriptionChange} />
            </div>
            <Button variant="secondary" size="sm" onClick={handleAddParameter}>Add Parameter</Button>
          </div>

          <div>
            <h4 className="mb-2">Responses</h4>
            {responses.map((response, index) => (
              <div key={index} className="flex items-center justify-between mb-2">
                <div>
                  {response.statusCode} - {response.description}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRemoveResponse(index)}>Remove</Button>
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="newResponseStatus">Status Code</Label>
                <Input id="newResponseStatus" value={newResponseStatus} onChange={handleResponseStatusChange} />
              </div>
              <div>
                <Label htmlFor="newResponseDescription">Description</Label>
                <Textarea id="newResponseDescription" value={newResponseDescription} onChange={handleResponseDescriptionChange} />
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleAddResponse}>Add Response</Button>
          </div>

          <div>
            <Label>MCP Type</Label>
            <div className="flex items-center space-x-2">
              <Select onValueChange={handleTypeChange} defaultValue={mcpType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MCP Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="selected">Selected</Label>
            <Switch id="selected" checked={selected} onCheckedChange={handleSelectedChange} />
          </div>
        </div>
      </CardContent>
      <div className="flex justify-end space-x-2 p-4">
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </Card>
  );
};

export default EndpointMapper;
