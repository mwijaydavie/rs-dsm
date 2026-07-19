// POST /api/auth/sync-role
// Syncs the current user's role from UserProfile to Supabase app_metadata.
// This ensures middleware can read the role instantly (fast path).
//
// Call this after login or after an admin changes a user's role.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const sb = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("UserProfile")
      .select("role")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    let role = profile?.role || null;

    if (!role && user.email) {
      const { data: userMatch } = await admin
        .from("User")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (userMatch && userMatch.role) {
        role = userMatch.role;
      }
    }

    if (!role) {
      return NextResponse.json({ error: "No role assigned" }, { status: 403 });
    }

    const adminAuth = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    await adminAuth.auth.admin.updateUserById(user.id, {
      app_metadata: { role },
    });

    return NextResponse.json({
      ok: true,
      role,
      message: `Role synced to app_metadata as '${role}'`,
    });
  } catch (err: any) {
    console.error("[api/auth/sync-role] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to sync role" },
      { status: 500 }
    );
  }
}
