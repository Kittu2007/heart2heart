import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let _supabaseAdmin: SupabaseClient<Database> | null = null;

function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    _supabaseAdmin = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabaseAdmin;
}

/** Proxy for backward compat — actual client created lazily at runtime */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db = supabaseAdmin;
