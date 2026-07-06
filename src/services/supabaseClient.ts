import { createClient } from '@supabase/supabase-js';

// Retrieve from environment variables or local storage set via IntegrationsModal
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key') || 'public-anon-key';

export const isSupabaseConfigured = !!(
  (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-project.supabase.co' && import.meta.env.VITE_SUPABASE_URL.trim() !== '') ||
  (localStorage.getItem('supabase_url') && localStorage.getItem('supabase_url') !== 'https://placeholder-project.supabase.co' && localStorage.getItem('supabase_url')?.trim() !== '')
);

export const supabase = createClient(supabaseUrl, supabaseKey);

