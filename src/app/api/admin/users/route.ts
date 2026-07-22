// GET  /api/admin/users — list all users
// POST /api/admin/users — create a new user (POLICE or TANROADS)
// DELETE /api/admin/users — delete a user
//
// Only ADMIN role can access these endpoints.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function checkAdmin(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const { user, error: authErr } = await getAuthUser(request);
  if (authErr || !user) {
    return { user: null, error: NextResponse.json({ error: authErr || "Unauthorized" }, { status: 401 }) };
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("UserProfile")
    .select("role")
    .eq("supabaseUid", user.id)
    .maybeSingle();

  const role = (profile as any)?.role ?? null;

  if (role !== "ADMIN") {
    if (user.email) {
      const { data: dbUser } = await admin
        .from("User")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (!dbUser || dbUser.role !== "ADMIN") {
        return { user: null, error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
      }
    } else {
      return { user: null, error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
    }
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await checkAdmin(request);
    if (error) return error;

    const admin = getSupabaseAdmin();

    const { data: users, error: uErr } = await admin
      .from("User")
      .select(`
        id, email, firstName, lastName, role, isActive, status, createdAt, updatedAt,
        profile:UserProfile(role, phone, badgeNumber, station, employeeId, supabaseUid)
      `)
      .order("createdAt", { ascending: false })
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
    const { error } = await checkAdmin(request);
    if (error) return error;

    const body = await request.json();
    const { email, password, firstName, lastName, role, phone, badgeNumber, station, employeeId } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "email, password, firstName, lastName, and role are required" },
        { status: 400 }
      );
    }

    if (role !== "POLICE" && role !== "TANROADS") {
      return NextResponse.json(
        { error: "role must be POLICE or TANROADS" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const adminAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let supabaseUserId: string;
    try {
      const { data: authUser, error: createErr } = await adminAuth.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `${firstName} ${lastName}`, role },
        app_metadata: { role },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }
      supabaseUserId = authUser!.user.id;
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Failed to create auth user" }, { status: 500 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: newUser, error: userErr } = await admin
      .from("User")
      .insert({
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        password: hashedPassword,
        organization: role === "POLICE" ? "Traffic Police" : role === "TANROADS" ? "TANROADS" : "",
        status: "ACTIVE",
        isActive: true,
      })
      .select("id")
      .single();

    if (userErr) {
      await adminAuth.auth.admin.deleteUser(supabaseUserId).catch(() => {});
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }

    const profileData: Record<string, any> = {
      userId: newUser.id,
      role,
      phone: phone || "",
      supabaseUid: supabaseUserId,
    };

    if (role === "POLICE") {
      if (badgeNumber) profileData.badgeNumber = badgeNumber;
      if (station) profileData.station = station;
    }

    if (role === "TANROADS") {
      if (employeeId) profileData.employeeId = employeeId;
    }

    const { error: profileErr } = await admin
      .from("UserProfile")
      .insert(profileData);

    if (profileErr) {
      try { await admin.from("User").delete().eq("id", newUser.id); } catch {}
      try { await adminAuth.auth.admin.deleteUser(supabaseUserId); } catch {}
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} created with role ${role}`,
      user: { id: newUser.id, email, role },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[api/admin/users POST] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await checkAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("UserProfile")
      .select("supabaseUid")
      .eq("userId", userId)
      .maybeSingle();

    const supabaseUid = (profile as any)?.supabaseUid;

    const { error: profileDelErr } = await admin
      .from("UserProfile")
      .delete()
      .eq("userId", userId);

    if (profileDelErr) {
      console.error("[admin/users DELETE] profile delete error:", profileDelErr.message);
    }

    const { error: userDelErr } = await admin
      .from("User")
      .delete()
      .eq("id", userId);

    if (userDelErr) {
      return NextResponse.json({ error: userDelErr.message }, { status: 500 });
    }

    if (supabaseUid) {
      try {
        const adminAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );
        await adminAuth.auth.admin.deleteUser(supabaseUid);
      } catch (authErr) {
        console.warn("[admin/users DELETE] failed to delete Supabase auth user:", authErr);
      }
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err: any) {
    console.error("[api/admin/users DELETE] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
