import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Checkbox
} from './ui/checkbox';
import {
  Switch
} from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Search, Filter, Check, X, Tag, ChevronsUpDown } from 'lucide-react';
import type { Endpoint } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ScrollArea } from './ui/scroll-area';

interface EndpointSelectorProps {
  endpoints: Endpoint[];
  selectedEndpoints: Endpoint[];
  onEndpointsChange: (endpoints: Endpoint[]) => void;
}

export function AdvancedEndpointSelector({
  endpoints,
  selectedEndpoints,
  onEndpointsChange,
}: EndpointSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'resources' | 'tools'>('all');
  const [showSelected, setShowSelected] = useState(false);
  const [categoryState, setCategoryState] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Auto-categorize endpoints based on path patterns
  const categorizeEndpoints = (endpoints: Endpoint[]): Record<string, Endpoint[]> => {
    const categories: Record<string, Endpoint[]> = {};
    
    // Helper function to get category from path
    const getCategoryFromPath = (path: string): string => {
      // Remove leading slash and extract first segment
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      const segments = normalizedPath.split('/');
      
      // If path has segments, use the first one as category
      if (segments.length > 0 && segments[0]) {
        return segments[0];
      }
      
      return 'general';
    };
    
    // Group endpoints by category
    endpoints.forEach(endpoint => {
      const category = getCategoryFromPath(endpoint.path);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(endpoint);
    });
    
    return categories;
  };

  // Process endpoints into categories
  const categorizedEndpoints = categorizeEndpoints(endpoints);
  
  // Initialize category state
  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    Object.keys(categorizedEndpoints).forEach(category => {
      initialState[category] = true;
    });
    setCategoryState(initialState);
    setOpenCategories(initialState);
  }, [endpoints.length]);

  // Filter endpoints based on search, filter type, and selected state
  const filteredEndpoints = () => {
    let filtered = [...endpoints];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ep => ep.path.toLowerCase().includes(searchLower) || 
          ep.description?.toLowerCase().includes(searchLower) ||
          ep.method.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply resource/tool filter
    if (filter === 'resources') {
      filtered = filtered.filter(ep => ep.mcpType === 'resource');
    } else if (filter === 'tools') {
      filtered = filtered.filter(ep => ep.mcpType === 'tool');
    }
    
    // Apply selected filter
    if (showSelected) {
      filtered = filtered.filter(ep => selectedEndpoints.some(sel => sel.id === ep.id));
    }
    
    return filtered;
  };

  // Toggle selection of a single endpoint
  const toggleEndpoint = (endpoint: Endpoint) => {
    const isSelected = selectedEndpoints.some(ep => ep.id === endpoint.id);
    
    if (isSelected) {
      onEndpointsChange(selectedEndpoints.filter(ep => ep.id !== endpoint.id));
    } else {
      onEndpointsChange([...selectedEndpoints, { ...endpoint, selected: true }]);
    }
  };

  // Toggle all endpoints in a category
  const toggleCategory = (category: string, selected: boolean) => {
    const newCategoryState = { ...categoryState, [category]: selected };
    setCategoryState(newCategoryState);
    
    let newSelectedEndpoints = [...selectedEndpoints];
    
    // Add or remove all endpoints in the category
    if (selected) {
      // Add all endpoints from this category that aren't already selected
      const endpointsToAdd = categorizedEndpoints[category].filter(
        ep => !newSelectedEndpoints.some(sel => sel.id === ep.id)
      );
      newSelectedEndpoints = [...newSelectedEndpoints, ...endpointsToAdd];
    } else {
      // Remove all endpoints from this category
      newSelectedEndpoints = newSelectedEndpoints.filter(
        ep => !categorizedEndpoints[category].some(catEp => catEp.id === ep.id)
      );
    }
    
    onEndpointsChange(newSelectedEndpoints);
  };

  // Toggle MCP type between resource and tool
  const toggleMcpType = (endpoint: Endpoint, mcpType: 'resource' | 'tool' | 'none') => {
    // First remove from selected if it exists
    const otherEndpoints = selectedEndpoints.filter(ep => ep.id !== endpoint.id);
    
    // Then add the updated endpoint if it's now selected
    if (endpoint.selected) {
      onEndpointsChange([...otherEndpoints, { ...endpoint, mcpType }]);
    } else {
      onEndpointsChange(otherEndpoints);
    }
  };

  // Toggle selection for all visible endpoints
  const selectAllVisible = () => {
    const visible = filteredEndpoints();
    const newSelected = [...selectedEndpoints];

    visible.forEach(endpoint => {
      if (!newSelected.some(ep => ep.id === endpoint.id)) {
        newSelected.push({ ...endpoint, selected: true });
      }
    });

    onEndpointsChange(newSelected);
  };

  // Deselect all visible endpoints
  const deselectAllVisible = () => {
    const visible = filteredEndpoints();
    const visibleIds = new Set(visible.map(ep => ep.id));
    
    const newSelected = selectedEndpoints.filter(ep => !visibleIds.has(ep.id));
    onEndpointsChange(newSelected);
  };

  // Auto-classify endpoints based on method type
const autoClassifyEndpoints = () => {
    const classified = selectedEndpoints.map(endpoint => {
      // GET endpoints are typically resources, others are tools
      const suggestedType = endpoint.method === 'GET' ? 'resource' as const : 'tool' as const;
      return { ...endpoint, mcpType: suggestedType };
    });
    
    onEndpointsChange(classified);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>API Endpoints</span>
          <div className="flex space-x-2">
            <Badge variant="outline">{endpoints.length} Total</Badge>
            <Badge variant="default">{selectedEndpoints.length} Selected</Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Select endpoints to include in your MCP server and categorize them as resources or tools
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Tabs defaultValue="all" className="w-[200px]" onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showSelected}
                onCheckedChange={setShowSelected}
                id="show-selected"
              />
              <Label htmlFor="show-selected">Selected Only</Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            <Check className="mr-2 h-4 w-4" />
            Select All Visible
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAllVisible}>
            <X className="mr-2 h-4 w-4" />
            Deselect All Visible
          </Button>
          <Button variant="outline" size="sm" onClick={autoClassifyEndpoints}>
            <Tag className="mr-2 h-4 w-4" />
            Auto-Classify
          </Button>
        </div>

        {/* Endpoints List */}
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {Object.entries(categorizedEndpoints).map(([category, categoryEndpoints]) => {
            // Filter endpoints in this category
            const filtered = categoryEndpoints.filter(ep => 
              filteredEndpoints().some(fep => fep.id === ep.id)
            );
            
            // Skip categories with no matching endpoints
            if (filtered.length === 0) return null;
            
            // Calculate if all visible endpoints in this category are selected
            const allSelected = filtered.every(ep => 
              selectedEndpoints.some(sel => sel.id === ep.id)
            );
            
            // Calculate if some but not all endpoints are selected
            const someSelected = filtered.some(ep => 
              selectedEndpoints.some(sel => sel.id === ep.id)
            ) && !allSelected;
            
            return (
              <Collapsible 
                key={category} 
                open={openCategories[category]} 
                onOpenChange={(open) => 
                  setOpenCategories({...openCategories, [category]: open})
                }
                className="mb-4"
              >
                <div className="flex items-center justify-between py-2 px-4 bg-secondary/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={(checked) => 
                        toggleCategory(category, checked === true)
                      }
                      id={`category-${category}`}
                    />
                    <Label 
                      htmlFor={`category-${category}`}
                      className="font-semibold text-lg capitalize"
                    >
                      {category}
                    </Label>
                    <Badge variant="outline">{filtered.length}</Badge>
                  </div>
                  
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle {category}</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="pl-6 pt-2 space-y-2">
                    {filtered.map(endpoint => {
                      const isSelected = selectedEndpoints.some(ep => ep.id === endpoint.id);
                      const mcpType = selectedEndpoints.find(ep => ep.id === endpoint.id)?.mcpType || endpoint.mcpType;
                      
                      return (
                        <div key={endpoint.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/20">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleEndpoint(endpoint)}
                            id={`endpoint-${endpoint.id}`}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  endpoint.method === 'GET' ? 'default' : 
                                  endpoint.method === 'POST' ? 'destructive' :
                                  endpoint.method === 'PUT' ? 'warning' :
                                  endpoint.method === 'DELETE' ? 'destructive' : 'outline'
                                }
                                className="font-mono"
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="font-medium font-mono">{endpoint.path}</span>
                            </div>
                            {endpoint.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {endpoint.description}
                              </p>
                            )}
                          </div>
                          
                          {isSelected && (
                            <Select
                              value={mcpType || 'none'}
                              onValueChange={(value) => 
                                toggleMcpType(endpoint, value as 'resource' | 'tool' | 'none')
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="resource">Resource</SelectItem>
                                <SelectItem value="tool">Tool</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          
          {filteredEndpoints().length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No endpoints match your filters</p>
              <Button variant="link" onClick={() => {
                setSearchTerm('');
                setFilter('all');
                setShowSelected(false);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Resources are typically GET endpoints, Tools are typically POST, PUT, DELETE
        </div>
        <Button onClick={autoClassifyEndpoints} variant="secondary">
          Auto-Classify Endpoints
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AdvancedEndpointSelector;
