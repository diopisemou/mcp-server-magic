import { supabase } from "@/integrations/supabase/client";
import { generateServer as generateServerLocally } from "@/utils/serverGeneratorv1";
import type { ServerConfig, GenerationResult } from "@/types";

/**
 * Options for server generation
 */
export interface GenerateServerOptions {
  /**
   * ID of the deployment record in the database
   */
  deploymentId: string;

  /**
   * Server configuration
   */
  config: ServerConfig;

  /**
   * Whether to use the edge function (true) or local generation (false)
   * Default: true
   */
  useEdgeFunction?: boolean;
}

/**
 * Generate a server using either the local generator or edge function
 * 
 * This utility function provides a unified interface for both UI components
 * to generate servers, with the option to use either the local or edge function
 * implementation. It also handles updating the deployment record in the database.
 */
export async function generateServerForUI({
  deploymentId,
  config,
  useEdgeFunction = true,
}: GenerateServerOptions): Promise<GenerationResult> {
  try {
    let result: GenerationResult;

    if (useEdgeFunction) {
      // Use the edge function
      const { data, error } = await supabase.functions.invoke("generate-server", {
        body: {
          deploymentId,
          config,
        },
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      // The edge function handles updating the deployment record
      result = data as GenerationResult;
    } else {
      // Use local generation
      result = await generateServerLocally(config);

      // Update the deployment in Supabase
      const { error } = await supabase
        .from("deployments")
        .update({
          status: result.success ? "success" : "failed",
          server_url: result.serverUrl,
          files: result.files,
          logs: JSON.stringify({
            timestamp: new Date().toISOString(),
            success: result.success,
            error: result.error,
          }),
        })
        .eq("id", deploymentId);

      if (error) {
        console.error("Error updating deployment:", error);
      }
    }

    return result;
  } catch (error) {
    console.error("Error generating server:", error);
    
    // Update deployment status to failed
    try {
      await supabase
        .from("deployments")
        .update({
          status: "failed",
          logs: JSON.stringify({
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error occurred",
          }),
        })
        .eq("id", deploymentId);
    } catch (updateError) {
      console.error("Error updating deployment status:", updateError);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
