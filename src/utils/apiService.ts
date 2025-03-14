
import { supabase } from '../integrations/supabase/client';
import type { ApiDefinition, EndpointDefinition } from '../types';
import { convertRecordToApiDefinition, convertEndpointsToJson } from './typeConverters';

export async function saveApiDefinition(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[]
): Promise<ApiDefinition> {
  // Prepare the data for the database
  const definition = { 
    ...apiDefinition,
    // Convert endpoint definitions to JSON-safe format
    endpoint_definition: endpointDefinitions ? convertEndpointsToJson(endpointDefinitions) : undefined
  };
  
  // Remove properties that might not be in the database schema
  const { parsedDefinition, file, url, ...dbDefinition } = definition;

  const { data, error } = apiDefinition.id
    ? await supabase.from('api_definitions').update(dbDefinition).eq('id', apiDefinition.id).select().single()
    : await supabase.from('api_definitions').insert(dbDefinition).select().single();

  if (error) throw new Error(`Failed to save API definition: ${error.message}`);
  
  // Convert the database record back to our application type
  return convertRecordToApiDefinition(data);
}

export async function getApiDefinition(id: string): Promise<ApiDefinition> {
  const { data, error } = await supabase.from('api_definitions').select('*').eq('id', id).single();
  if (error) throw new Error(`Failed to get API definition: ${error.message}`);
  
  // Convert the database record to our application type
  return convertRecordToApiDefinition(data);
}

export async function getApiDefinitions(): Promise<ApiDefinition[]> {
  const { data, error } = await supabase.from('api_definitions').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to get API definitions: ${error.message}`);
  
  // Convert all database records to our application type
  return data.map(convertRecordToApiDefinition);
}

export async function deleteApiDefinition(id: string): Promise<boolean> {
  const { error } = await supabase.from('api_definitions').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete API definition: ${error.message}`);
  return true;
}
