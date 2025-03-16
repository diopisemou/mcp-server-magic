import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid path' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract the operation and listing ID from the path
    const operation = pathParts[2]; // e.g., "increment_stars", "increment_downloads"
    
    if (req.method === 'POST') {
      const body = await req.json();
      const listingId = body.listing_id;
      
      if (!listingId) {
        return new Response(
          JSON.stringify({ error: 'Missing listing_id in request body' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }

      // Handle different operations
      if (operation === 'increment_stars') {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .update({ stars: supabase.rpc('increment_counter', { row_id: listingId, column_name: 'stars' }) })
          .eq('id', listingId)
          .select('stars');

        if (error) {
          console.error('Error incrementing stars:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to increment stars' }),
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
          JSON.stringify({ 
            success: true, 
            stars: data?.[0]?.stars || 0 
          }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      } 
      else if (operation === 'decrement_stars') {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .update({ stars: supabase.rpc('decrement_counter', { row_id: listingId, column_name: 'stars' }) })
          .eq('id', listingId)
          .select('stars');

        if (error) {
          console.error('Error decrementing stars:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to decrement stars' }),
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
          JSON.stringify({ 
            success: true, 
            stars: data?.[0]?.stars || 0 
          }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
      else if (operation === 'increment_downloads') {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .update({ downloads: supabase.rpc('increment_counter', { row_id: listingId, column_name: 'downloads' }) })
          .eq('id', listingId)
          .select('downloads');

        if (error) {
          console.error('Error incrementing downloads:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to increment downloads' }),
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
          JSON.stringify({ 
            success: true, 
            downloads: data?.[0]?.downloads || 0 
          }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
      else {
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
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
