// GET /api/me
// Returns the current user's profile (role, firstName, etc).
// Uses Supabase REST for User + UserProfile lookups.

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

    const avatarUrl: string | undefined =
      (user.user_metadata as any)?.avatar_url ||
      (user.user_metadata as any)?.picture ||
      (user.user_metadata as any)?.avatarUrl ||
      undefined;

    const { data: profile, error: pErr } = await admin
      .from("UserProfile")
      .select("userId, role, supabaseUid, user:User(id, email, firstName, lastName, role, status)")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (pErr) {
      console.error("[api/me] profile lookup error:", pErr.message);
    }

    if (!profile && user.email) {
      const { data: emailMatch } = await admin
        .from("User")
        .select("id, email, firstName, lastName, role")
        .eq("email", user.email)
        .maybeSingle();

      if (emailMatch && emailMatch.role) {
        await admin.from("UserProfile").upsert(
          {
            userId: emailMatch.id,
            role: emailMatch.role,
            supabaseUid: user.id,
          },
          { onConflict: "userId" }
        );

        return NextResponse.json({
          user: {
            email: emailMatch.email,
            firstName: emailMatch.firstName || (user.email?.split("@")[0] || "User"),
            lastName: emailMatch.lastName || "",
            avatar: avatarUrl,
            role: emailMatch.role,
          },
        });
      }
    }

    if (profile) {
      const dbUser = (profile as any).user;
      const userStatus = dbUser?.status ?? "ACTIVE";
      if (userStatus !== "ACTIVE") {
        return NextResponse.json({
          user: null,
          status: userStatus,
          message: userStatus === "PENDING" ? "Your account is awaiting administrator approval." : userStatus === "REJECTED" ? "Your account has been rejected. Please contact the administrator." : "Your account has been disabled.",
        });
      }
      return NextResponse.json({
        user: {
          email: dbUser?.email ?? user.email,
          firstName: dbUser?.firstName ?? (user.email?.split("@")[0] || "User"),
          lastName: dbUser?.lastName ?? "",
          avatar: avatarUrl,
          role: (profile as any).role ?? null,
        },
      });
    }

    return NextResponse.json({ user: null });
  } catch (err) {
    console.error("[api/me] error:", err);
    return NextResponse.json(
      { user: null, error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
