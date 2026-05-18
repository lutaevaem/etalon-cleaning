import { createClient } from '@supabase/supabase-js';

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const SITE_CONTENT_KEY = process.env.SUPABASE_CONTENT_KEY || 'main';
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'site-media';
