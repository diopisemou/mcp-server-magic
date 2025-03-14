import { useEffect, useState } from "react";
import { ApiDefinition, Endpoint, Parameter, Response } from "@/types";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { extractEndpointsFromDefinition } from "@/utils/apiValidator";
import { AlertCircle, Check, Edit, Plus, Trash2, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface EndpointMapperProps {
  apiDefinition: ApiDefinition;
  onContinue: (endpoints: Endpoint[]) => void;
}

const AdvancedEndpointMapper = (
  { apiDefinition, onContinue }: EndpointMapperProps,
) => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [endpointToDelete, setEndpointToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (apiDefinition?.parsedDefinition) {
      //const extractedEndpoints = extractEndpointsFromDefinition(apiDefinition.parsedDefinition, apiDefinition.format)
      const extractedEndpoints = extractEndpointsFromDefinition(
        apiDefinition.content,
        apiDefinition.file?.name,
      )
        //const extractedEndpoints = parseApiDefinition(apiDefinition)
        .map((endpoint) => ({
          ...endpoint,
          id: uuidv4(),
          // Ensure method is cast to the correct union type
          method: endpoint.method.toUpperCase() as Endpoint["method"],
          mcpType: suggestMcpType(
            endpoint.method.toUpperCase() as Endpoint["method"],
          ),
        }));

      setEndpoints(extractedEndpoints as Endpoint[]);
    }
  }, [apiDefinition]);

  const suggestMcpType = (
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD",
  ): "resource" | "tool" | "none" => {
    if (["GET", "OPTIONS", "HEAD"].includes(method)) {
      return "resource";
    } else if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return "tool";
    }
    return "none";
  };

  const toggleEndpointType = (
    id: string | undefined,
    type: "resource" | "tool" | "none",
  ) => {
    if (!id) return;

    const updated = endpoints.map((endpoint) =>
      endpoint.id === id ? { ...endpoint, mcpType: type } : endpoint
    );
    setEndpoints(updated);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-700";
      case "POST":
        return "bg-blue-100 text-blue-700";
      case "PUT":
        return "bg-amber-100 text-amber-700";
      case "DELETE":
        return "bg-rose-100 text-rose-700";
      case "PATCH":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleEditEndpoint = (endpoint: Endpoint) => {
    setEditingEndpoint({ ...endpoint });
    setIsEditDialogOpen(true);
  };

  const handleSaveEndpoint = () => {
    if (!editingEndpoint) return;

    if (!editingEndpoint.path.trim()) {
      toast.error("Endpoint path cannot be empty");
      return;
    }

    const updatedEndpoints = endpoints.map((endpoint) =>
      endpoint.id === editingEndpoint.id ? editingEndpoint : endpoint
    );

    setEndpoints(updatedEndpoints);
    setIsEditDialogOpen(false);
    setEditingEndpoint(null);
    toast.success("Endpoint updated successfully");
  };

  const addParameter = () => {
    if (!editingEndpoint) return;

    const newParam: Parameter = {
      name: "",
      type: "string",
      required: false,
      description: "",
    };

    setEditingEndpoint({
      ...editingEndpoint,
      parameters: [...editingEndpoint.parameters, newParam],
    });
  };

  const updateParameter = (
    index: number,
    field: keyof Parameter,
    value: any,
  ) => {
    if (!editingEndpoint) return;

    const updatedParams = [...editingEndpoint.parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value,
    };

    setEditingEndpoint({
      ...editingEndpoint,
      parameters: updatedParams,
    });
  };

  const removeParameter = (index: number) => {
    if (!editingEndpoint) return;

    const updatedParams = [...editingEndpoint.parameters];
    updatedParams.splice(index, 1);

    setEditingEndpoint({
      ...editingEndpoint,
      parameters: updatedParams,
    });
  };

  const addResponse = () => {
    if (!editingEndpoint) return;

    const newResponse: Response = {
      statusCode: 200,
      description: "Success response",
    };

    setEditingEndpoint({
      ...editingEndpoint,
      responses: [...editingEndpoint.responses, newResponse],
    });
  };

  const updateResponse = (index: number, field: keyof Response, value: any) => {
    if (!editingEndpoint) return;

    const updatedResponses = [...editingEndpoint.responses];
    updatedResponses[index] = {
      ...updatedResponses[index],
      [field]: field === "statusCode" ? parseInt(value, 10) : value,
    };

    setEditingEndpoint({
      ...editingEndpoint,
      responses: updatedResponses,
    });
  };

  const removeResponse = (index: number) => {
    if (!editingEndpoint) return;

    const updatedResponses = [...editingEndpoint.responses];
    updatedResponses.splice(index, 1);

    setEditingEndpoint({
      ...editingEndpoint,
      responses: updatedResponses,
    });
  };

  const confirmDeleteEndpoint = (id: string | undefined) => {
    if (!id) return;
    setEndpointToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteEndpoint = () => {
    if (!endpointToDelete) return;

    const updatedEndpoints = endpoints.filter((endpoint) =>
      endpoint.id !== endpointToDelete
    );
    setEndpoints(updatedEndpoints);
    setIsDeleteDialogOpen(false);
    setEndpointToDelete(null);
    toast.success("Endpoint deleted successfully");
  };

  const addNewEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: uuidv4(),
      path: "/api/new-endpoint",
      method: "GET",
      description: "New endpoint",
      parameters: [],
      responses: [
        {
          statusCode: 200,
          description: "Success response",
        },
      ],
      mcpType: "resource",
    };

    setEditingEndpoint(newEndpoint);
    setIsEditDialogOpen(true);
  };

  const handleAddEndpoint = () => {
    if (!editingEndpoint) return;

    // Check if it's a new endpoint (not already in the list)
    const isNew = !endpoints.some((endpoint) =>
      endpoint.id === editingEndpoint.id
    );

    if (isNew) {
      setEndpoints([...endpoints, editingEndpoint]);
    } else {
      // If not new, update existing
      handleSaveEndpoint();
      return;
    }

    setIsEditDialogOpen(false);
    setEditingEndpoint(null);
    toast.success("New endpoint added successfully");
  };

  const handleContinue = () => {
    onContinue(endpoints);
  };

  return (
    <>
      <div className="py-24 bg-white relative">
        <div className="content-container">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                API Mapping
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Map Your API Endpoints to MCP Capabilities
              </h2>
              <p className="text-muted-foreground">
                Review, edit and customize how your API endpoints are mapped to
                MCP resources and tools. GET endpoints typically map to
                resources, while POST, PUT, and DELETE endpoints map to tools.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{apiDefinition.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {apiDefinition.format} • {endpoints.length} endpoints
                  </p>
                </div>
                <Button
                  onClick={addNewEndpoint}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Endpoint
                </Button>
              </div>

              {endpoints.length === 0
                ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No endpoints found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      We couldn't detect any endpoints in your API definition.
                    </p>
                    <Button onClick={addNewEndpoint}>
                      Add Endpoint Manually
                    </Button>
                  </div>
                )
                : (
                  <div className="divide-y divide-border">
                    {endpoints.map((endpoint, index) => (
                      <div
                        key={endpoint.id}
                        className="p-6 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-md text-xs font-medium",
                                  getMethodColor(endpoint.method),
                                )}
                              >
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {endpoint.description}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2 justify-end">
                              <Button
                                variant={endpoint.mcpType === "resource"
                                  ? "default"
                                  : "outline"}
                                size="sm"
                                onClick={() =>
                                  toggleEndpointType(endpoint.id, "resource")}
                                className={endpoint.mcpType === "resource"
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : ""}
                              >
                                Resource
                              </Button>
                              <Button
                                variant={endpoint.mcpType === "tool"
                                  ? "default"
                                  : "outline"}
                                size="sm"
                                onClick={() =>
                                  toggleEndpointType(endpoint.id, "tool")}
                                className={endpoint.mcpType === "tool"
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : ""}
                              >
                                Tool
                              </Button>
                              <Button
                                variant={endpoint.mcpType === "none"
                                  ? "default"
                                  : "outline"}
                                size="sm"
                                onClick={() =>
                                  toggleEndpointType(endpoint.id, "none")}
                                className={endpoint.mcpType === "none"
                                  ? "bg-gray-600 hover:bg-gray-700"
                                  : ""}
                              >
                                Skip
                              </Button>
                            </div>
                            <div className="flex flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEndpoint(endpoint)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  confirmDeleteEndpoint(endpoint.id)}
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              <div className="p-6 border-t border-border">
                <Button
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue Server Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Endpoint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEndpoint?.id &&
                  endpoints.some((e) => e.id === editingEndpoint.id)
                ? "Edit Endpoint"
                : "Add New Endpoint"}
            </DialogTitle>
          </DialogHeader>

          {editingEndpoint && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Method
                  </label>
                  <select
                    value={editingEndpoint.method}
                    onChange={(e) =>
                      setEditingEndpoint({
                        ...editingEndpoint,
                        method: e.target.value as any,
                        mcpType: suggestMcpType(e.target.value as any),
                      })}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="OPTIONS">OPTIONS</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Path</label>
                  <Input
                    value={editingEndpoint.path}
                    onChange={(e) =>
                      setEditingEndpoint({
                        ...editingEndpoint,
                        path: e.target.value,
                      })}
                    placeholder="/api/resource/{id}"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={editingEndpoint.description}
                  onChange={(e) =>
                    setEditingEndpoint({
                      ...editingEndpoint,
                      description: e.target.value,
                    })}
                  placeholder="Describe what this endpoint does"
                  rows={2}
                />
              </div>

              <Accordion type="single" collapsible defaultValue="parameters">
                <AccordionItem value="parameters">
                  <AccordionTrigger>Parameters</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {editingEndpoint.parameters.length === 0
                        ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No parameters defined. Add one below.
                          </p>
                        )
                        : (
                          editingEndpoint.parameters.map((param, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 items-start"
                            >
                              <div className="col-span-3">
                                <Input
                                  value={param.name}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "name",
                                      e.target.value,
                                    )}
                                  placeholder="Name"
                                  className="text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <select
                                  value={param.type}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "type",
                                      e.target.value,
                                    )}
                                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                                >
                                  <option value="string">string</option>
                                  <option value="number">number</option>
                                  <option value="integer">integer</option>
                                  <option value="boolean">boolean</option>
                                  <option value="array">array</option>
                                  <option value="object">object</option>
                                </select>
                              </div>
                              <div className="col-span-1 flex items-center justify-center h-10">
                                <input
                                  type="checkbox"
                                  checked={param.required}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "required",
                                      e.target.checked,
                                    )}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="col-span-5">
                                <Input
                                  value={param.description}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "description",
                                      e.target.value,
                                    )}
                                  placeholder="Description"
                                  className="text-sm"
                                />
                              </div>
                              <div className="col-span-1 flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeParameter(index)}
                                  className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}

                      <Button
                        variant="outline"
                        onClick={addParameter}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Parameter
                      </Button>

                      {editingEndpoint.parameters.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                          <div className="col-span-3">Name</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-1 text-center">Req.</div>
                          <div className="col-span-5">Description</div>
                          <div className="col-span-1"></div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="responses">
                  <AccordionTrigger>Responses</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {editingEndpoint.responses.length === 0
                        ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No responses defined. Add one below.
                          </p>
                        )
                        : (
                          editingEndpoint.responses.map((response, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 items-start"
                            >
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  value={response.statusCode}
                                  onChange={(e) =>
                                    updateResponse(
                                      index,
                                      "statusCode",
                                      e.target.value,
                                    )}
                                  placeholder="Status"
                                  className="text-sm"
                                  min={100}
                                  max={599}
                                />
                              </div>
                              <div className="col-span-9">
                                <Input
                                  value={response.description}
                                  onChange={(e) =>
                                    updateResponse(
                                      index,
                                      "description",
                                      e.target.value,
                                    )}
                                  placeholder="Description"
                                  className="text-sm"
                                />
                              </div>
                              <div className="col-span-1 flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeResponse(index)}
                                  className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}

                      <Button
                        variant="outline"
                        onClick={addResponse}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Response
                      </Button>

                      {editingEndpoint.responses.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                          <div className="col-span-2">Status</div>
                          <div className="col-span-9">Description</div>
                          <div className="col-span-1"></div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={editingEndpoint?.id &&
                  endpoints.some((e) => e.id === editingEndpoint.id)
                ? handleSaveEndpoint
                : handleAddEndpoint}
            >
              {editingEndpoint?.id &&
                  endpoints.some((e) => e.id === editingEndpoint.id)
                ? "Save Changes"
                : "Add Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this endpoint? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEndpoint}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedEndpointMapper;
