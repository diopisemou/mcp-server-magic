
import { supabase } from '../integrations/supabase/client';
import type { ApiDefinition, EndpointDefinition } from '../types/api';

export async function saveApiDefinition(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[]
): Promise<ApiDefinition> {
  const definition = { ...apiDefinition, endpoint_definition: endpointDefinitions };
  const { data, error } = apiDefinition.id
    ? await supabase.from('api_definitions').update(definition).eq('id', apiDefinition.id).select().single()
    : await supabase.from('api_definitions').insert(definition).select().single();

  if (error) throw new Error(`Failed to save API definition: ${error.message}`);
  return data as ApiDefinition;
}

export async function getApiDefinition(id: string): Promise<ApiDefinition> {
  const { data, error } = await supabase.from('api_definitions').select('*').eq('id', id).single();
  if (error) throw new Error(`Failed to get API definition: ${error.message}`);
  return data as ApiDefinition;
}

export async function getApiDefinitions(): Promise<ApiDefinition[]> {
  const { data, error } = await supabase.from('api_definitions').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to get API definitions: ${error.message}`);
  return data as ApiDefinition[];
}

export async function deleteApiDefinition(id: string): Promise<boolean> {
  const { error } = await supabase.from('api_definitions').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete API definition: ${error.message}`);
  return true;
}