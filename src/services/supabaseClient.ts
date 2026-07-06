import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables.
// As part of the MVP setup for Orion Enterprises LLC, these are placeholders
// that will be replaced with real Supabase project URL and anon key once provisioned.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_URL.trim() !== '' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'public-anon-key' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== ''
);

export const supabase = createClient(supabaseUrl, supabaseKey);

