
import { supabase } from '../integrations/supabase/client';
import type { ApiDefinition, EndpointDefinition } from '../types';
import { 
  convertRecordToApiDefinition, 
  convertEndpointsToJson, 
  prepareApiForDatabase 
} from './typeConverters';

export async function saveApiDefinition(
  apiDefinition: Partial<ApiDefinition>,
  endpointDefinitions?: EndpointDefinition[]
): Promise<ApiDefinition> {
  // Prepare the data for the database
  const dbData = prepareApiForDatabase(apiDefinition, endpointDefinitions);
  
  const { data, error } = apiDefinition.id
    ? await supabase.from('api_definitions').update(dbData).eq('id', apiDefinition.id).select().single()
    : await supabase.from('api_definitions').insert(dbData).select().single();

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
