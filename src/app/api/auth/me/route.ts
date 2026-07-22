// GET /api/auth/me
// Returns the current Supabase user + the linked UserProfile role + User data.
//
// IMPORTANT: Uses @supabase/ssr createServerClient to read session cookies.
// The service-role client (getSupabaseAdmin) does NOT read cookies and
// would return { user: null } for browser requests, breaking the admin
// page permission check.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const sb = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("UserProfile")
      .select("userId, role, user:User(id, username, email, role)")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    let dbUser: any = (profile as any)?.user ?? null;
    let role = (profile as any)?.role ?? null;

    if (!dbUser && user.email) {
      const { data: emailMatch } = await admin
        .from("User")
        .select("id, username, email, role")
        .eq("email", user.email)
        .maybeSingle();
      dbUser = emailMatch;

      if (dbUser && dbUser.role) {
        role = dbUser.role;
        await admin.from("UserProfile").upsert(
          {
            userId: dbUser.id,
            role,
            supabaseUid: user.id,
          },
          { onConflict: "userId" }
        );
      }
    }

    if (!role) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      supabaseUser: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        avatar: user.user_metadata?.avatar_url || null,
      },
      role,
      dbUser: dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
          }
        : null,
    });
  } catch (err) {
    console.error("[api/auth/me] error:", err);
    return NextResponse.json(
      { user: null, error: "Server error" },
      { status: 500 }
    );
  }
}
