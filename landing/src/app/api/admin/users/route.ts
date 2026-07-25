// GET  /api/admin/users — list all users with their roles
// POST /api/admin/users — update a user's role/staff status
//
// Requires superuser (isSuperuser === true) access.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hardcoded admin emails that bypass the DB check for Google OAuth users. */
const ADMIN_EMAILS = ["roadsafetydar@gmail.com"];

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const { user, error: authErr } = await getAuthUser(request);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Check superuser — fallback to hardcoded admin emails for Google OAuth users
    // whose email may not exist in the local User table yet.
    const userEmail = user.email?.toLowerCase() ?? "";
    if (ADMIN_EMAILS.includes(userEmail)) {
      // Hardcoded admin — skip DB check
    } else {
      const { data: dbUser } = await admin
        .from("User")
        .select("id, isSuperuser")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (!(dbUser as any)?.isSuperuser) {
        return NextResponse.json({ error: "Forbidden — superuser access required" }, { status: 403 });
      }
    }

    // Fetch all users with their profiles
    const { data: users, error: uErr } = await admin
      .from("User")
      .select(`
        id, email, username, firstName, lastName, isStaff, isSuperuser, isActive, dateJoined,
        profile:UserProfile(role, phone, supabaseUid)
      `)
      .order("dateJoined", { ascending: false })
      .limit(200);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    return NextResponse.json({ users: users ?? [] });
  } catch (err: any) {
    console.error("[api/admin/users] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authErr } = await getAuthUser(request);
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Check superuser — fallback to hardcoded admin emails
    const userEmail = user.email?.toLowerCase() ?? "";
    if (!ADMIN_EMAILS.includes(userEmail)) {
      const { data: dbUser } = await admin
        .from("User")
        .select("id, isSuperuser")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (!(dbUser as any)?.isSuperuser) {
        return NextResponse.json({ error: "Forbidden — superuser access required" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { userId, action, role, isStaff, isSuperuser, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (action === "update_role") {
      // Update UserProfile.role
      if (!role) {
        return NextResponse.json({ error: "role is required" }, { status: 400 });
      }
      const { error: upErr } = await admin
        .from("UserProfile")
        .upsert({ userId, role }, { onConflict: "userId" });

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }

      // Also update User.isStaff if role is editor or admin
      const isStaffFlag = role === "editor" || role === "admin";
      await admin.from("User").update({ isStaff: isStaffFlag }).eq("id", userId);

      // Sync role to Supabase app_metadata for immediate effect (no delay waiting for DB trigger)
      try {
        const { data: profileWithUid } = await admin
          .from("UserProfile")
          .select("supabaseUid")
          .eq("userId", userId)
          .maybeSingle();

        if (profileWithUid?.supabaseUid) {
          const adminAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );
          await adminAuth.auth.admin.updateUserById(profileWithUid.supabaseUid, {
            app_metadata: { role },
          });
        }
      } catch (metaErr) {
        console.warn("[admin/users] Failed to sync app_metadata:", metaErr);
        // Non-fatal — the DB trigger will sync on the next UserProfile update
      }

      return NextResponse.json({ success: true, message: `Role updated to ${role}` });
    }

    if (action === "update_flags") {
      const updates: Record<string, any> = {};
      if (typeof isStaff === "boolean") updates.isStaff = isStaff;
      if (typeof isSuperuser === "boolean") updates.isSuperuser = isSuperuser;
      if (typeof isActive === "boolean") updates.isActive = isActive;

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No flags to update" }, { status: 400 });
      }

      const { error: upErr } = await admin
        .from("User")
        .update(updates)
        .eq("id", userId);

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "User flags updated" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/admin/users] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

async function getAuthUser(request: NextRequest): Promise<{ user: any; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const sb = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll() { /* read-only */ },
    },
  });

  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) {
    return { user: null, error: "Not authenticated" };
  }
  return { user };
}