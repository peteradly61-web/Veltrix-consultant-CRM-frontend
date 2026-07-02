import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseServer: SupabaseClient | null = null;

// Lazy getter — only instantiates the client at runtime when first called,
// not at build time (avoids "Invalid supabaseUrl" crash on Vercel cold builds).
export function getSupabaseServer(): SupabaseClient | null {
  if (_supabaseServer) return _supabaseServer;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseServiceRoleKey) {
    // Env vars missing or invalid — Supabase is unavailable; caller should handle null.
    return null;
  }

  _supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _supabaseServer;
}

// Keep a named export alias so existing imports still compile without changes.
export const supabaseServer = {
  from: (...args: Parameters<SupabaseClient['from']>) => {
    const client = getSupabaseServer();
    if (!client) throw new Error('[Supabase] Client unavailable — env vars not configured.');
    return client.from(...args);
  },
};
