import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service_role key.
 * Bypasses Row Level Security — use only inside trusted API routes.
 *
 * IMPORTANT: This uses the PostgREST API (HTTP/HTTPS) which works over IPv4.
 * The Prisma client (TCP) requires IPv6 connectivity which is unreliable in
 * many hosting environments, so all data access goes through this client.
 *
 * Tables in this project are PascalCase (Prisma convention):
 *   Accident, User, Junction, Location
 */

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY"
    );
  }

  _client = createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      // Use the fetch shipped with Node 18+
      fetch: ((...args: Parameters<typeof fetch>) => fetch(...args)) as typeof fetch,
    },
  });

  return _client;
}

// Backwards-compat alias — older route files import { createClient } from here.
// Returns the same service-role client. Prefer getSupabaseAdmin() in new code.
export const createClient = getSupabaseAdmin;

/**
 * Verify the service client can reach Supabase. Returns the count of
 * Accident rows on success or an error string. Useful for /api/health.
 */
export async function pingSupabase(): Promise<
  { ok: true; count: number; latencyMs: number } | { ok: false; error: string; latencyMs: number }
> {
  const start = Date.now();
  try {
    const sb = getSupabaseAdmin();
    const { count, error } = await sb
      .from("Accident")
      .select("id", { count: "exact", head: true });
    const latencyMs = Date.now() - start;
    if (error) return { ok: false, error: error.message, latencyMs };
    return { ok: true, count: count ?? 0, latencyMs };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - start,
    };
  }
}
