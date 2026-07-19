// GET /api/me/accidents
// Returns accidents reported by the currently logged-in user.
// Uses the Supabase session cookie to identify the user, then looks up
// their User record via UserProfile.supabaseUid or email fallback.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Read session from cookies
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
      return NextResponse.json({ accidents: [], error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Find the local User ID via UserProfile.supabaseUid or email
    let localUserId: number | null = null;

    const { data: profile } = await admin
      .from("UserProfile")
      .select("userId")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (profile) {
      localUserId = (profile as any).userId;
    } else if (user.email) {
      // Fallback: find by email
      const { data: userMatch } = await admin
        .from("User")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (userMatch) {
        localUserId = (userMatch as any).id;
      }
    }

    if (!localUserId) {
      return NextResponse.json({ accidents: [] });
    }

    // Fetch accidents submitted by this user
    const { data: accidents, error: accErr } = await admin
      .from("Accident")
      .select("id, lat, lng, district, ward, junctionName, occurredAt, severity, vehicleTypes, casualties, fatalities, injuries, description, verificationStatus, verified, upvoteCount, photoUrl, createdAt")
      .eq("submittedById", localUserId)
      .order("occurredAt", { ascending: false })
      .limit(50);

    if (accErr) {
      console.error("[api/me/accidents] error:", accErr.message);
      return NextResponse.json({ accidents: [], error: accErr.message }, { status: 500 });
    }

    // Parse vehicleTypes JSON string
    const parsed = (accidents ?? []).map((a: any) => ({
      ...a,
      vehicleTypes: safeParseArray(a.vehicleTypes),
    }));

    return NextResponse.json({ accidents: parsed });
  } catch (err: any) {
    console.error("[api/me/accidents] error:", err);
    return NextResponse.json({ accidents: [], error: err?.message || "Server error" }, { status: 500 });
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v: any) => String(v)) : [];
  } catch {
    return [];
  }
}