// POST /api/accidents/[id]/verify
// Editor/admin approves or rejects a pending accident.
// Uses Supabase REST (service role) — Prisma not required.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const accidentId = Number(id);
    if (!Number.isFinite(accidentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // 1. Auth via cookie-bound client (reads the user's session)
    // IMPORTANT: Use @supabase/ssr createServerClient, NOT the service role client!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseUser = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in." },
        { status: 401 }
      );
    }

    // 2. Check staff status via User table (with hardcoded admin fallback)
    const sb = getSupabaseAdmin();
    const userEmail = user.email?.toLowerCase() ?? "";
    const ADMIN_EMAILS = ["roadsafetydar@gmail.com"];

    // Find the local dbUser for audit log purposes (may be null for hardcoded admins)
    let dbUser: any = null;

    if (!ADMIN_EMAILS.includes(userEmail)) {
      // Not a hardcoded admin — check via DB
      const { data: foundUser, error: userErr } = await sb
        .from("User")
        .select("id, email, isStaff, isSuperuser, profile: UserProfile(role)")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (userErr) {
        console.error("[verify] user lookup error:", userErr.message);
        return NextResponse.json(
          { error: "Failed to verify permissions." },
          { status: 500 }
        );
      }

      dbUser = foundUser;

      const role = dbUser?.profile?.role ?? "community";
      const isStaff =
        dbUser?.isStaff === true ||
        dbUser?.isSuperuser === true ||
        role === "editor" ||
        role === "admin";

      if (!isStaff) {
        return NextResponse.json(
          { error: "Forbidden — staff access required." },
          { status: 403 }
        );
      }
    }

    // 3. Apply the verification
    if (body.status === "verified") {
      const { error: updErr } = await sb
        .from("Accident")
        .update({
          verificationStatus: "verified",
          verified: true,
          verifiedAt: new Date().toISOString(),
        })
        .eq("id", accidentId);

      if (updErr) {
        return NextResponse.json(
          { error: "Failed to verify", detail: updErr.message },
          { status: 500 }
        );
      }

      // Best-effort audit log
      await sb.from("AuditLog").insert({
        accidentId,
        userId: dbUser?.id ?? null,
        action: "verified",
        description: "Verified by editor",
      });
    } else if (body.status === "rejected") {
      const { error: updErr } = await sb
        .from("Accident")
        .update({
          verificationStatus: "rejected",
          verified: false,
          verifiedAt: new Date().toISOString(),
          rejectionReason: body.reason || "",
        })
        .eq("id", accidentId);

      if (updErr) {
        return NextResponse.json(
          { error: "Failed to reject", detail: updErr.message },
          { status: 500 }
        );
      }

      await sb.from("AuditLog").insert({
        accidentId,
        userId: dbUser?.id ?? null,
        action: "rejected",
        description: body.reason || "Rejected by editor",
      });
    } else {
      return NextResponse.json(
        { error: "status must be 'verified' or 'rejected'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[verify] error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
