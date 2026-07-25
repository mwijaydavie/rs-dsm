// GET /api/me
// Returns the current user's profile (role, isStaff, isSuperuser, firstName, etc).
// Uses Supabase REST for User + UserProfile lookups.
//
// IMPORTANT: This endpoint has an email-based fallback for Google OAuth users.
// When a user signs in via Google, their supabaseUid may not be linked to a
// UserProfile row yet. We fall back to matching by email, and if the email
// matches a known User in our DB, we return that user's flags (isStaff,
// isSuperuser). This ensures the admin email roadsafetydar@gmail.com is
// recognized as admin even if the DB link hasn't been created yet.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hardcoded admin emails that should always have superuser access. */
const ADMIN_EMAILS = ["roadsafetydar@gmail.com"];

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Use @supabase/ssr createServerClient to read session cookies
    // from the incoming request. The service-role client (getSupabaseAdmin)
    // does NOT read cookies — it would return { user: null } for browser
    // requests, breaking Google OAuth profile loading.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const sb = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only — we don't set cookies here */ },
      },
    });

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const admin = getSupabaseAdmin();

    // Extract avatar from Supabase user metadata (works for Google OAuth)
    const avatarUrl: string | undefined =
      (user.user_metadata as any)?.avatar_url ||
      (user.user_metadata as any)?.picture ||
      (user.user_metadata as any)?.avatarUrl ||
      undefined;

    // 1. Lookup UserProfile by supabaseUid
    const { data: profile, error: pErr } = await admin
      .from("UserProfile")
      .select("userId, role, supabaseUid, user:User(id, email, firstName, lastName, isStaff, isSuperuser)")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (pErr) {
      console.error("[api/me] profile lookup error:", pErr.message);
    }

    // 2. If no profile by supabaseUid, try email-based fallback
    if (!profile && user.email) {
      const { data: emailMatch } = await admin
        .from("User")
        .select("id, email, firstName, lastName, isStaff, isSuperuser")
        .eq("email", user.email)
        .maybeSingle();

      if (emailMatch) {
        // Link the profile to this Supabase UID for future lookups
        await admin.from("UserProfile").upsert(
          {
            userId: emailMatch.id,
            role: emailMatch.isSuperuser ? "admin" : "community",
            supabaseUid: user.id,
          },
          { onConflict: "userId" }
        ).maybeSingle();

        return NextResponse.json({
          user: {
            email: emailMatch.email,
            firstName: emailMatch.firstName || (user.email?.split("@")[0] || "User"),
            lastName: emailMatch.lastName || "",
            avatar: avatarUrl,
            role: emailMatch.isSuperuser ? "admin" : "community",
            isStaff: emailMatch.isStaff === true,
            isSuperuser: emailMatch.isSuperuser === true,
          },
        });
      }
    }

    // 3. If we have a profile from supabaseUid lookup, use it
    if (profile) {
      const dbUser = (profile as any).user;
      return NextResponse.json({
        user: {
          email: dbUser?.email ?? user.email,
          firstName: dbUser?.firstName ?? (user.email?.split("@")[0] || "User"),
          lastName: dbUser?.lastName ?? "",
          avatar: avatarUrl,
          role: (profile as any).role ?? "community",
          isStaff: dbUser?.isStaff === true,
          isSuperuser: dbUser?.isSuperuser === true,
        },
      });
    }

    // 4. Final fallback: check if this email is a hardcoded admin
    const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    return NextResponse.json({
      user: {
        email: user.email,
        firstName: user.email?.split("@")[0] || "User",
        lastName: "",
        avatar: avatarUrl,
        role: isAdminEmail ? "admin" : "community",
        isStaff: isAdminEmail ? true : false,
        isSuperuser: isAdminEmail ? true : false,
      },
    });
  } catch (err) {
    console.error("[api/me] error:", err);
    return NextResponse.json(
      { user: null, error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
