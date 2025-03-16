import { supabase } from "@/integrations/supabase/client";
import {
  Deployment,
  MarketplaceListing,
  MarketplaceCapability,
  InstallationInstructions,
  ServerFile,
  MCPCapability,
} from "@/types";

/**
 * Fetch all marketplace listings
 */
export const fetchMarketplaceListings = async (): Promise<MarketplaceListing[]> => {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(`
      *,
      capabilities:marketplace_capabilities(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching marketplace listings:", error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Fetch a specific marketplace listing by ID
 */
export const fetchMarketplaceListing = async (id: string): Promise<MarketplaceListing> => {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(`
      *,
      capabilities:marketplace_capabilities(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching marketplace listing:", error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Submit a deployment to the marketplace
 */
export const publishDeployment = async (
  deployment: Deployment,
  marketplaceData: {
    title: string;
    description: string;
    author: string;
    version: string;
    tags: string[];
    installation_instructions?: InstallationInstructions;
  }
): Promise<MarketplaceListing> => {
  // First, update the deployment to mark it as public
  const { error: deploymentError } = await supabase
    .from("deployments")
    .update({ is_public: true })
    .eq("id", deployment.id);

  if (deploymentError) {
    console.error("Error updating deployment:", deploymentError);
    throw new Error(deploymentError.message);
  }

  // Then create the marketplace listing
  const { data: listingData, error: listingError } = await supabase
    .from("marketplace_listings")
    .insert({
      deployment_id: deployment.id,
      title: marketplaceData.title,
      description: marketplaceData.description,
      author: marketplaceData.author,
      version: marketplaceData.version,
      tags: marketplaceData.tags,
      installation_instructions: marketplaceData.installation_instructions || null,
    })
    .select()
    .single();

  if (listingError) {
    console.error("Error creating marketplace listing:", listingError);
    throw new Error(listingError.message);
  }

  // Get the capabilities from the deployment files (if any)
  const capabilities = extractCapabilitiesFromDeployment(deployment);
  
  if (capabilities.length > 0) {
    const capabilitiesData = capabilities.map(capability => ({
      listing_id: listingData.id,
      type: capability.type,
      name: capability.name,
      description: capability.description,
    }));

    const { error: capabilitiesError } = await supabase
      .from("marketplace_capabilities")
      .insert(capabilitiesData);

    if (capabilitiesError) {
      console.error("Error creating capabilities:", capabilitiesError);
      throw new Error(capabilitiesError.message);
    }
  }

  return await fetchMarketplaceListing(listingData.id);
};

/**
 * Submit a new server directly to the marketplace (without an existing deployment)
 */
export const submitServer = async (
  serverData: {
    title: string;
    description: string;
    author: string;
    version: string;
    tags: string[];
    server_url: string;
    capabilities: MarketplaceCapability[];
    installation_instructions?: InstallationInstructions;
  }
): Promise<MarketplaceListing> => {
  // Create the marketplace listing
  const { data: listingData, error: listingError } = await supabase
    .from("marketplace_listings")
    .insert({
      title: serverData.title,
      description: serverData.description,
      author: serverData.author,
      version: serverData.version,
      tags: serverData.tags,
      installation_instructions: serverData.installation_instructions || null,
    })
    .select()
    .single();

  if (listingError) {
    console.error("Error creating marketplace listing:", listingError);
    throw new Error(listingError.message);
  }

  // Add capabilities
  if (serverData.capabilities && serverData.capabilities.length > 0) {
    const capabilitiesData = serverData.capabilities.map(capability => ({
      listing_id: listingData.id,
      type: capability.type,
      name: capability.name,
      description: capability.description,
    }));

    const { error: capabilitiesError } = await supabase
      .from("marketplace_capabilities")
      .insert(capabilitiesData);

    if (capabilitiesError) {
      console.error("Error creating capabilities:", capabilitiesError);
      throw new Error(capabilitiesError.message);
    }
  }

  return await fetchMarketplaceListing(listingData.id);
};

/**
 * Track a download for a marketplace listing
 */
export const trackDownload = async (listingId: string): Promise<void> => {
  const { error } = await supabase.rpc("increment_downloads", {
    listing_id: listingId,
  });

  if (error) {
    console.error("Error tracking download:", error);
    throw new Error(error.message);
  }
};

/**
 * Star or unstar a marketplace listing
 */
export const toggleStar = async (listingId: string, isStarred: boolean): Promise<void> => {
  const { error } = await supabase.rpc(
    isStarred ? "increment_stars" : "decrement_stars",
    {
      listing_id: listingId,
    }
  );

  if (error) {
    console.error("Error toggling star:", error);
    throw new Error(error.message);
  }
};

/**
 * Search marketplace listings
 */
export const searchMarketplaceListings = async (
  searchTerm: string,
  tags?: string[],
  sort?: "latest" | "popular" | "downloads"
): Promise<MarketplaceListing[]> => {
  let query = supabase
    .from("marketplace_listings")
    .select(`
      *,
      capabilities:marketplace_capabilities(*)
    `);

  // Apply search term if provided
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }

  // Apply tag filtering if provided
  if (tags && tags.length > 0) {
    query = query.contains("tags", tags);
  }

  // Apply sorting
  if (sort === "popular") {
    query = query.order("stars", { ascending: false });
  } else if (sort === "downloads") {
    query = query.order("downloads", { ascending: false });
  } else {
    // Default to latest
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error searching marketplace listings:", error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Extract capabilities from a deployment
 */
const extractCapabilitiesFromDeployment = (deployment: Deployment): MCPCapability[] => {
  const capabilities: MCPCapability[] = [];

  if (!deployment.files) {
    return capabilities;
  }

  // Try to extract capabilities from the files
  // Look for server.ts or mcp_server.py files first
  const serverFile = deployment.files.find(
    file => file.name === "server.ts" || file.name === "mcp_server.py"
  );

  if (serverFile) {
    // Extract capabilities from the code
    const resourceMatches = serverFile.content.match(
      /registerResource\(.*?name:\s*["'](.+?)["'].*?description:\s*["'](.+?)["']/gs
    );
    const toolMatches = serverFile.content.match(
      /registerTool\(.*?name:\s*["'](.+?)["'].*?description:\s*["'](.+?)["']/gs
    );

    if (resourceMatches) {
      resourceMatches.forEach(match => {
        const nameMatch = match.match(/name:\s*["'](.+?)["']/);
        const descMatch = match.match(/description:\s*["'](.+?)["']/);
        
        if (nameMatch && descMatch) {
          capabilities.push({
            type: "resource",
            name: nameMatch[1],
            description: descMatch[1],
          });
        }
      });
    }

    if (toolMatches) {
      toolMatches.forEach(match => {
        const nameMatch = match.match(/name:\s*["'](.+?)["']/);
        const descMatch = match.match(/description:\s*["'](.+?)["']/);
        
        if (nameMatch && descMatch) {
          capabilities.push({
            type: "tool",
            name: nameMatch[1],
            description: descMatch[1],
          });
        }
      });
    }
  }

  return capabilities;
};

/**
 * Generate installation instructions for different platforms
 */
export const generateInstallationInstructions = (
  server: MarketplaceListing,
  serverUrl: string
): InstallationInstructions => {
  // The server name in kebab case for config names
  const serverSlug = server.title.toLowerCase().replace(/\s+/g, "-");
  
  // Generate different installation instructions based on the platform
  return {
    cline: {
      configPath: "c:\\Users\\username\\AppData\\Roaming\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
      configContent: JSON.stringify({
        mcpServers: {
          [serverSlug]: {
            command: "curl",
            args: ["-s", serverUrl],
            disabled: false,
            autoApprove: []
          }
        }
      }, null, 2),
      commands: [
        "Open VS Code and navigate to:", 
        "c:\\Users\\username\\AppData\\Roaming\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
        "Add the configuration to the mcpServers object"
      ]
    },
    claude: {
      configContent: JSON.stringify({
        tools: [
          {
            name: serverSlug,
            url: serverUrl,
            auth: {
              type: "none"
            }
          }
        ]
      }, null, 2),
      usageExamples: [
        `Ask Claude: "Can you use the ${server.title} to get..."`,
        `"Use ${server.title} to help me with..."`,
        `"Access my ${server.title} and perform..."`
      ]
    },
    windsurf: {
      configContent: JSON.stringify({
        mcpServer: {
          name: server.title,
          endpoint: serverUrl,
          auth: "none"
        }
      }, null, 2),
      usageExamples: [
        "Put this in your Windsurf configuration file",
        "Enable the MCP server in Windsurf settings",
        `Ask Windsurf: "Can you access ${server.title} for me?"`
      ]
    }
  };
};
