import {
  ApiDefinition,
  Deployment,
  Endpoint,
  EndpointDefinition,
  ServerConfig,
  ServerConfiguration,
} from "@/types";
import { Json } from "@/types/json";

// Helper to safely convert database JSON to endpoint definitions
export function convertJsonToEndpointDefinitions(
  jsonData: any,
): EndpointDefinition[] {
  if (!jsonData) return [];

  try {
    if (Array.isArray(jsonData)) {
      return jsonData.map((endpoint) => ({
        id: endpoint.id || "",
        path: endpoint.path || "",
        method: endpoint.method || "GET",
        description: endpoint.description || "",
        parameters: endpoint.parameters || [],
        responses: endpoint.responses?.map((r: any) => ({
          ...r,
          schema: r.schema || null, // Ensure schema is always present
        })) || [],
        selected: endpoint.selected !== undefined ? endpoint.selected : true,
        mcpType: endpoint.mcpType || "none",
        summary: endpoint.summary,
        operationId: endpoint.operationId,
        requestBody: endpoint.requestBody,
        security: endpoint.security,
        tags: endpoint.tags,
      }));
    }
    return [];
  } catch (e) {
    console.error("Error converting JSON to endpoint definitions:", e);
    return [];
  }
}

// Helper to safely convert database record to ApiDefinition
export function convertRecordToApiDefinition(record: any): ApiDefinition {
  const endpointDefs = record.endpoint_definition
    ? convertJsonToEndpointDefinitions(record.endpoint_definition)
    : [];

  return {
    id: record.id || "",
    name: record.name || "",
    format: record.format || "OpenAPI3",
    content: record.content || "",
    created_at: record.created_at || new Date().toISOString(),
    user_id: record.user_id,
    description: record.description,
    project_id: record.project_id,
    parsedDefinition: record.parsedDefinition ||
      tryParseContent(record.content),
    endpoint_definition: endpointDefs,
  };
}

// Try to parse JSON content if possible
function tryParseContent(content: string): any {
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

// Convert endpoints array to database-safe format
export function convertEndpointsToJson(endpoints: Endpoint[]): any {
  return endpoints.map((endpoint) => ({
    ...endpoint,
    responses: endpoint.responses.map((response) => ({
      ...response,
      schema: response.schema || null,
    })),
  }));
}

// Convert ServerConfiguration DB record to ServerConfig
export function convertToServerConfig(record: any): ServerConfig {
  return {
    name: record.name || "",
    description: record.description || "",
    language: record.language as "Python" | "TypeScript",
    authentication: {
      type: record.authentication_type as
        | "None"
        | "API Key"
        | "Bearer Token"
        | "Basic Auth",
      location: record.authentication_details?.location as
        | "header"
        | "query"
        | "cookie",
      name: record.authentication_details?.name,
      value: record.authentication_details?.value,
    },
    hosting: {
      provider: record.hosting_provider as
        | "AWS"
        | "GCP"
        | "Azure"
        | "Self-hosted"
        | "Supabase",
      type: record.hosting_type as
        | "Serverless"
        | "Container"
        | "VM"
        | "Shared"
        | "Dedicated",
      region: record.hosting_region,
    },
    endpoints: [],
  };
}

// Convert ServerConfig to ServerConfigRecord format for the database
export function convertServerConfigToRecord(
  config: ServerConfig,
  projectId: string,
): any {
  return {
    project_id: projectId,
    name: config.name || "",
    description: config.description || "",
    language: config.language,
    authentication_type: config.authentication.type,
    authentication_details: {
      location: config.authentication.location,
      name: config.authentication.name,
      value: config.authentication.value,
    },
    hosting_provider: config.hosting.provider,
    hosting_type: config.hosting.type,
    hosting_region: config.hosting.region,
  };
}

// Convert Deployment DB record to Deployment type
export function convertToDeployment(record: any): Deployment {
  const status = record.status as
    | "pending"
    | "processing"
    | "success"
    | "failed";
  const files = record.files ? record.files : [];

  return {
    id: record.id || "",
    project_id: record.project_id || "",
    configuration_id: record.configuration_id || "",
    status,
    server_url: record.server_url,
    logs: record.logs,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
    files,
  };
}

// Convert API data for Supabase insert/update
export function prepareApiForDatabase(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[],
): any {
  let endpointDefJson = null;

  if (endpointDefinitions) {
    try {
      endpointDefJson = JSON.stringify(
        convertEndpointsToJson(endpointDefinitions),
      );
    } catch (e) {
      console.error("Error converting endpoints to JSON:", e);
    }
  }

  const { parsedDefinition, file, url, ...dbDefinition } = apiDefinition;

  return {
    ...dbDefinition,
    endpoint_definition: endpointDefJson,
    content: apiDefinition.content || "",
    format: apiDefinition.format || "OpenAPI3",
    name: apiDefinition.name || "",
    project_id: apiDefinition.project_id || "",
  };
}

// Function to prepare API definition for Supabase - ensures the endpoint_definition is properly stringified
export function prepareApiDefinitionForDatabase(
  apiDefinition: ApiDefinition,
): any {
  const preparedDefinition = { ...apiDefinition };

  if (
    apiDefinition.endpoint_definition &&
    Array.isArray(apiDefinition.endpoint_definition)
  ) {
    preparedDefinition.endpoint_definition = JSON.stringify(
      apiDefinition.endpoint_definition,
    );
  }

  return preparedDefinition;
}
