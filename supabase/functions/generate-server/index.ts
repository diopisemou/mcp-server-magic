import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { generateNodeServer } from '../../src/utils/serverTemplates/nodeServer.ts';
import { generatePythonServer } from '../../src/utils/serverTemplates/pythonServer.ts';
import { generateGoServer } from '../../src/utils/serverTemplates/goServer.ts';

// Define the server file type
interface ServerFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation';
  language?: string;
}

// Define the server generation result
interface GenerationResult {
  success: boolean;
  serverUrl?: string;
  files?: ServerFile[];
  error?: string;
}

// Define server configuration
interface ServerConfig {
  name: string;
  description: string;
  language: 'TypeScript' | 'Python' | 'Go';
  authentication: {
    type: 'None' | 'API Key' | 'Bearer Token' | 'Basic Auth';
    location?: 'header' | 'query' | 'cookie';
    name?: string;
    value?: string;
  };
  hosting: {
    provider: 'AWS' | 'GCP' | 'Azure' | 'Self-hosted';
    type: 'Serverless' | 'Container' | 'VM';
    region?: string;
  };
  endpoints: Array<{
    id: string;
    path: string;
    method: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    responses: Array<{
      statusCode: number | string;
      description: string;
      schema: any;
    }>;
    mcpType: 'none' | 'resource' | 'tool';
    selected?: boolean;
  }>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Core server generation function - used by both local and edge function implementations
 * 
 * This function selects the appropriate generator based on the language specified
 * in the server configuration and returns a standardized result.
 */
function generateServerCode(config: ServerConfig): GenerationResult {
  try {
    // Validate the configuration
    if (!config.language) {
      throw new Error("Language is required");
    }

    // Call the appropriate generator based on language
    let result: GenerationResult;
    switch (config.language) {
      case "TypeScript":
        result = generateNodeServer(config);
        break;
      case "Python":
        result = generatePythonServer(config);
        break;
      case "Go":
        result = generateGoServer(config);
        break;
      default:
        throw new Error(`Unsupported language: ${config.language}`);
    }

    // Add the server URL to the result
    return {
      ...result,
      serverUrl: `https://mcp-${
        config.name ? config.name.toLowerCase().replace(/\s+/g, "-") : "server"
      }.example.com`,
    };
  } catch (error) {
    console.error("Error generating server:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server generation function for the edge function
async function generateServer(config: ServerConfig): Promise<GenerationResult> {
  try {
    // Use the core generation function
    return generateServerCode(config);
  } catch (error) {
    console.error('Error generating server:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { deploymentId, config } = await req.json();

    if (!deploymentId || !config) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log('Received request to generate server for deployment ID:', deploymentId);
    console.log('Server config:', JSON.stringify(config, null, 2).substring(0, 500) + '...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update deployment status to processing
    const { error: updateError } = await supabase
      .from('deployments')
      .update({ status: 'processing' })
      .eq('id', deploymentId);

    if (updateError) {
      console.error('Error updating deployment status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update deployment status' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Generate the server using our shared core generation function
    const result = await generateServer(config as ServerConfig);

    // Update deployment with the results
    const { error: finalUpdateError } = await supabase
      .from('deployments')
      .update({
        status: result.success ? 'success' : 'failed',
        server_url: result.serverUrl,
        logs: JSON.stringify({
          timestamp: new Date().toISOString(),
          success: result.success,
          message: result.success ? 'Server generated successfully' : result.error
        }),
        files: result.files
      })
      .eq('id', deploymentId);

    if (finalUpdateError) {
      console.error('Error saving generation results:', finalUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save generation results' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
