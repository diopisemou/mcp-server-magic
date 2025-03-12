
import { supabase } from '../integrations/supabase/client';
import type { ApiDefinition, EndpointDefinition } from '../types/api';

export async function saveApiDefinition(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[]
) {
  if (endpointDefinitions) {
    apiDefinition.endpoint_definition = endpointDefinitions;
  }

  if (apiDefinition.id) {
    // Update existing API definition
    const { data, error } = await supabase
      .from('api_definitions')
      .update(apiDefinition)
      .eq('id', apiDefinition.id)
      .select();

    if (error) throw error;
    return data?.[0];
  } else {
    // Create new API definition
    const { data, error } = await supabase
      .from('api_definitions')
      .insert(apiDefinition)
      .select();

    if (error) throw error;
    return data?.[0];
  }
}

export async function getApiDefinition(id: string) {
  const { data, error } = await supabase
    .from('api_definitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ApiDefinition;
}

export async function getApiDefinitions() {
  const { data, error } = await supabase
    .from('api_definitions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ApiDefinition[];
}

export async function deleteApiDefinition(id: string) {
  const { error } = await supabase
    .from('api_definitions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
