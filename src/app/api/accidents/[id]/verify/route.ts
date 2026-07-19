// POST /api/accidents/[id]/verify
// Admin or Police approves or rejects a pending accident.
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

    const sb = getSupabaseAdmin();

    let dbUser: any = null;
    const { data: profile } = await sb
      .from("UserProfile")
      .select("role, userId, user:User(id, email, role)")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (profile) {
      dbUser = (profile as any).user;
      const role = (profile as any).role ?? null;

      if (role !== "ADMIN" && role !== "POLICE") {
        return NextResponse.json(
          { error: "Forbidden — only ADMIN and POLICE can verify accidents." },
          { status: 403 }
        );
      }
    } else if (user.email) {
      const { data: emailMatch } = await sb
        .from("User")
        .select("id, email, role")
        .eq("email", user.email)
        .maybeSingle();

      if (!emailMatch || (emailMatch.role !== "ADMIN" && emailMatch.role !== "POLICE")) {
        return NextResponse.json(
          { error: "Forbidden — only ADMIN and POLICE can verify accidents." },
          { status: 403 }
        );
      }
      dbUser = emailMatch;
    } else {
      return NextResponse.json(
        { error: "Forbidden — only ADMIN and POLICE can verify accidents." },
        { status: 403 }
      );
    }

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

      await sb.from("AuditLog").insert({
        accidentId,
        userId: dbUser?.id ?? null,
        action: "verified",
        description: "Verified",
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
        description: body.reason || "Rejected",
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
