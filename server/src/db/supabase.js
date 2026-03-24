import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
}

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export function requireData(result, fallbackMessage = 'Database operation failed') {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }
  return result.data;
}
