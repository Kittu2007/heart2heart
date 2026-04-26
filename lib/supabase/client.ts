import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let _supabase: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _supabase = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabase;
}

/** @deprecated Use getSupabase() instead — kept for backward compatibility */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function getSupabaseWithAuth(firebaseUid: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient<Database>(url, key, {
    global: {
      headers: {
        'X-User-Id': firebaseUid,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
