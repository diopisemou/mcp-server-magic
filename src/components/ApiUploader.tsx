import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { ApiDefinition, Endpoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { validateApiDefinition, fetchApiDefinition, testApiEndpoint } from '@/utils/apiValidator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import EndpointsList from './EndpointsList';
import { toast } from 'sonner';

interface ApiUploaderProps {
  onUploadComplete: (apiDefinition: ApiDefinition) => void;
}

interface EndpointTestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
}

export default function ApiUploader({ onUploadComplete }: ApiUploaderProps) {
  const [content, setContent] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');
  const [format, setFormat] = useState<string>('OpenAPI3');
  const [sourceType, setSourceType] = useState<'raw' | 'url' | 'file'>('raw');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [testEndpoint, setTestEndpoint] = useState<EndpointTestConfig>({
    url: '',
    method: 'GET',
    headers: {},
    queryParams: {},
    body: ''
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When switching to URL mode, clear the content
    if (sourceType === 'url') {
      setContent('');
      setRawContent('');
    }
  }, [sourceType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawContent(e.target.value);
    try {
      // Try to parse as JSON to validate
      if (e.target.value.trim()) {
        const parsed = JSON.parse(e.target.value);
        setContent(JSON.stringify(parsed));
      } else {
        setContent('');
      }
      setError(null);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const handleAddHeader = () => {
    setTestEndpoint({
      ...testEndpoint,
      headers: {
        ...testEndpoint.headers,
        '': ''
      }
    });
  };

  const handleAddQueryParam = () => {
    setTestEndpoint({
      ...testEndpoint,
      queryParams: {
        ...testEndpoint.queryParams,
        '': ''
      }
    });
  };

  const handleHeaderChange = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...testEndpoint.headers };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = value;
    setTestEndpoint({
      ...testEndpoint,
      headers: newHeaders
    });
  };

  const handleQueryParamChange = (oldKey: string, newKey: string, value: string) => {
    const newParams = { ...testEndpoint.queryParams };
    if (oldKey !== newKey) {
      delete newParams[oldKey];
    }
    newParams[newKey] = value;
    setTestEndpoint({
      ...testEndpoint,
      queryParams: newParams
    });
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...testEndpoint.headers };
    delete newHeaders[key];
    setTestEndpoint({
      ...testEndpoint,
      headers: newHeaders
    });
  };

  const handleRemoveQueryParam = (key: string) => {
    const newParams = { ...testEndpoint.queryParams };
    delete newParams[key];
    setTestEndpoint({
      ...testEndpoint,
      queryParams: newParams
    });
  };

  const handleFetchApiDefinition = async () => {
    if (!apiUrl) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiDefinition = await fetchApiDefinition(apiUrl);

      if (!apiDefinition) {
        setError('Failed to fetch API definition');
        setLoading(false);
        return;
      }

      // Handle Swagger URL redirection
      if (apiDefinition.swaggerUrl) {
        const fullUrl = new URL(apiDefinition.swaggerUrl, apiUrl).href;
        const swaggerDef = await fetchApiDefinition(fullUrl);

        if (!swaggerDef) {
          setError('Failed to fetch Swagger definition');
          setLoading(false);
          return;
        }

        const jsonContent = JSON.stringify(swaggerDef, null, 2);
        setContent(jsonContent);
        setRawContent(jsonContent);
        processApiDefinition(swaggerDef);
      } else {
        const jsonContent = JSON.stringify(apiDefinition, null, 2);
        setContent(jsonContent);
        setRawContent(jsonContent);
        processApiDefinition(apiDefinition);
      }
    } catch (err) {
      setError(`Error fetching API definition: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const processApiDefinition = (apiDef: any) => {
    // Try to determine the format automatically
    let detectedFormat = format;

    if (apiDef.swagger && apiDef.swagger.startsWith('2.')) {
      detectedFormat = 'OpenAPI2';
    } else if (apiDef.openapi && apiDef.openapi.startsWith('3.')) {
      detectedFormat = 'OpenAPI3';
    } else if (apiDef.raml) {
      detectedFormat = 'RAML';
    } else if (apiDef.blueprint) {
      detectedFormat = 'APIBlueprint';
    }

    setFormat(detectedFormat);

    // Extract endpoints
    const extractedEndpoints = validateApiDefinition(apiDef, detectedFormat);
    setEndpoints(extractedEndpoints);
  };

  const handleUpload = () => {
    setIsValidating(true);

    try {
      if (sourceType === 'raw' && !content) {
        setError('Please enter an API definition');
        setIsValidating(false);
        return;
      }

      let parsedDefinition;
      try {
        parsedDefinition = JSON.parse(content);
      } catch (err) {
        setError('Invalid JSON format');
        setIsValidating(false);
        return;
      }

      // Extract endpoints from the parsed definition
      const extractedEndpoints = validateApiDefinition(parsedDefinition, format);

      if (extractedEndpoints.length === 0) {
        setError('No valid endpoints found in the API definition');
        setIsValidating(false);
        return;
      }

      const apiDefinition: ApiDefinition = {
        format,
        content: JSON.stringify({
          parsedDefinition,
          format,
          source: sourceType === 'url' ? apiUrl : 'manual'
        }),
        endpoints: extractedEndpoints
      };

      onUploadComplete(apiDefinition);
      toast.success('API definition uploaded successfully');
    } catch (error) {
      setError(`Error validating API definition: ${(error as Error).message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestEndpoint = async () => {
    if (!testEndpoint.url) {
      toast.error('Please enter an endpoint URL');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      let bodyParams = {};
      if (testEndpoint.body) {
        try {
          bodyParams = JSON.parse(testEndpoint.body);
        } catch (error) {
          toast.error('Invalid JSON in request body');
          setTestLoading(false);
          return;
        }
      }

      const result = await testApiEndpoint(
        testEndpoint.url,
        testEndpoint.method,
        testEndpoint.method === 'GET' ? testEndpoint.queryParams : bodyParams,
        testEndpoint.headers
      );

      setTestResult(result);

      if (result.ok) {
        toast.success(`API test successful: ${result.status}`);

        // Create an endpoint from the test
        const newEndpoint: Endpoint = {
          id: `endpoint-${Math.random().toString(36).substring(2)}`,
          path: new URL(testEndpoint.url).pathname,
          method: testEndpoint.method as any,
          description: `Endpoint added from test: ${testEndpoint.url}`,
          parameters: Object.entries(testEndpoint.method === 'GET' ? testEndpoint.queryParams : bodyParams).map(([name, value]) => ({
            name,
            type: typeof value,
            required: false,
            description: ''
          })),
          responses: [{ statusCode: result.status, description: 'Success' }],
          mcpType: testEndpoint.method === 'GET' ? 'resource' : 'tool'
        };

        setEndpoints([...endpoints, newEndpoint]);
      } else {
        toast.error(`API test failed: ${result.status}`);
      }
    } catch (error) {
      toast.error(`Error testing endpoint: ${(error as Error).message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          setRawContent(event.target.result as string);
          try {
            const parsed = JSON.parse(event.target.result as string);
            setContent(JSON.stringify(parsed, null, 2));
            setError(null);
          } catch (err) {
            setError('Invalid JSON format');
          }
        }
      };

      reader.readAsText(file);
    }
  };

  return (
    <div className="py-24 relative overflow-hidden" id="start">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-bold text-3xl md:text-5xl mb-4">API Definition</h1>
            <p className="text-md md:text-lg text-muted-foreground">
              Upload your API definition to generate an MCP server
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex space-x-4 mb-4">
                  <Button 
                    variant={sourceType === 'raw' ? 'default' : 'outline'} 
                    onClick={() => setSourceType('raw')}
                    className="flex-1"
                  >
                    Paste JSON
                  </Button>
                  <Button 
                    variant={sourceType === 'url' ? 'default' : 'outline'} 
                    onClick={() => setSourceType('url')}
                    className="flex-1"
                  >
                    URL
                  </Button>
                  <Button
                    variant={sourceType === 'file' ? 'default' : 'outline'}
                    onClick={() => {
                      setSourceType('file');
                      setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    className="flex-1"
                  >
                    Upload File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,.yaml,.yml"
                    className="hidden"
                  />
                </div>

                {sourceType === 'raw' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OpenAPI3">OpenAPI 3.0</SelectItem>
                          <SelectItem value="OpenAPI2">OpenAPI 2.0 (Swagger)</SelectItem>
                          <SelectItem value="custom">Custom JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="definition">Paste API Definition (JSON)</Label>
                      <Textarea
                        id="definition"
                        placeholder='{"openapi": "3.0.0", "info": {"title": "Sample API", "version": "1.0.0"}, "paths": {...}}'
                        value={rawContent}
                        onChange={handleInputChange}
                        className="h-64 font-mono text-sm"
                      />
                      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                  </div>
                )}

                {sourceType === 'file' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OpenAPI3">OpenAPI 3.0</SelectItem>
                          <SelectItem value="OpenAPI2">OpenAPI 2.0 (Swagger)</SelectItem>
                          <SelectItem value="custom">Custom JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                      <div className="space-y-2">
                        <div className="text-muted-foreground">
                          {rawContent ? (
                            <div className="text-left">
                              <p className="font-medium text-green-600">File content loaded successfully</p>
                              <pre className="mt-2 bg-gray-100 p-2 rounded-md text-xs overflow-auto max-h-32">
                                {rawContent.length > 300 ? `${rawContent.substring(0, 300)}...` : rawContent}
                              </pre>
                            </div>
                          ) : (
                            <>
                              <p>Drag and drop your API definition file here, or click to select</p>
                              <p className="text-xs mt-1">Supports JSON, YAML formats</p>
                            </>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  </div>
                )}

                {sourceType === 'url' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="api-url">API Definition URL</Label>
                      <Input
                        id="api-url"
                        placeholder="https://example.com/api-spec.json"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {endpoints.length > 0 && (
                  <div className="space-y-4 mb-4">
                    <h3 className="text-lg font-semibold">Detected Endpoints</h3>
                    <EndpointsList endpoints={endpoints} />
                  </div>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={isValidating || (!content && sourceType === 'raw')}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Upload and Continue
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Rest of the component remains unchanged */}
          {sourceType === 'url' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Definition URL</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter the URL of your OpenAPI, Swagger, or RAML definition, or a Swagger UI page
                </p>
                <div className="flex space-x-2">
                  <Input 
                    id="apiUrl" 
                    placeholder="https://example.com/openapi.json" 
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <Button 
                    onClick={handleFetchApiDefinition}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Fetch
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-mode"
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                />
                <Label htmlFor="advanced-mode">Advanced Mode</Label>
              </div>

              {advancedMode && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="test-endpoint">
                    <AccordionTrigger>Test Endpoint</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="endpointUrl">Endpoint URL</Label>
                          <Input
                            id="endpointUrl"
                            placeholder="https://api.example.com/users"
                            value={testEndpoint.url}
                            onChange={(e) => setTestEndpoint({...testEndpoint, url: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="method">HTTP Method</Label>
                          <Select 
                            value={testEndpoint.method} 
                            onValueChange={(val) => setTestEndpoint({...testEndpoint, method: val})}
                          >
                            <SelectTrigger id="method">
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

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Headers</Label>
                            <Button size="sm" variant="outline" onClick={handleAddHeader}>
                              Add Header
                            </Button>
                          </div>

                          {Object.entries(testEndpoint.headers).map(([key, value], index) => (
                            <div key={`header-${index}`} className="flex items-center space-x-2">
                              <Input 
                                placeholder="Header name"
                                value={key}
                                onChange={(e) => handleHeaderChange(key, e.target.value, value)}
                              />
                              <Input 
                                placeholder="Value"
                                value={value}
                                onChange={(e) => handleHeaderChange(key, key, e.target.value)}
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleRemoveHeader(key)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>

                        {testEndpoint.method === 'GET' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Query Parameters</Label>
                              <Button size="sm" variant="outline" onClick={handleAddQueryParam}>
                                Add Parameter
                              </Button>
                            </div>

                            {Object.entries(testEndpoint.queryParams).map(([key, value], index) => (
                              <div key={`param-${index}`} className="flex items-center space-x-2">
                                <Input 
                                  placeholder="Parameter name"
                                  value={key}
                                  onChange={(e) => handleQueryParamChange(key, e.target.value, value)}
                                />
                                <Input 
                                  placeholder="Value"
                                  value={value}
                                  onChange={(e) => handleQueryParamChange(key, key, e.target.value)}
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleRemoveQueryParam(key)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="requestBody">Request Body (JSON)</Label>
                            <Textarea
                              id="requestBody"
                              placeholder='{ "name": "John Doe", "email": "john@example.com" }'
                              value={testEndpoint.body}
                              onChange={(e) => setTestEndpoint({...testEndpoint, body: e.target.value})}
                              rows={5}
                            />
                          </div>
                        )}

                        <Button 
                          onClick={handleTestEndpoint}
                          disabled={testLoading}
                          className="w-full"
                        >
                          {testLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Test Endpoint
                        </Button>

                        {testResult && (
                          <div className="mt-4">
                            <Alert variant={testResult.ok ? "default" : "destructive"}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Status: {testResult.status}</AlertTitle>
                              <AlertDescription>
                                <pre className="mt-2 w-full rounded bg-slate-950 p-4 overflow-x-scroll text-white">
                                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                                </pre>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}