import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PASSWORD_MIN = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ROLES = ["community", "police", "tanroads", "researcher"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

function getAuthSignUpClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = await request.json().catch(() => ({} as any));
    const { email, password, username, firstName, lastName, phone, role, badgeNumber, station, employeeId, institution } = body || {};

    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!password || String(password).length < PASSWORD_MIN) {
      return NextResponse.json({ error: `Password must be at least ${PASSWORD_MIN} characters.` }, { status: 400 });
    }
    if (!firstName || String(firstName).trim().length < 1) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanFirst = String(firstName).trim();
    const cleanLast = String(lastName || "").trim();
    const cleanPhone = phone ? String(phone).trim() : null;
    const emailLocal = cleanEmail.split("@")[0] || "user";
    const requestedUsername = (username ? String(username).trim() : "") || emailLocal;
    if (requestedUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }

    let requestedRole: Role = "community";
    if (role && (ALLOWED_ROLES as readonly string[]).includes(role)) {
      requestedRole = role as Role;
    }

    // Role-specific field validation
    if (requestedRole === "police") {
      if (!badgeNumber || String(badgeNumber).trim().length < 2) {
        return NextResponse.json({ error: "Police Badge/ID Number is required." }, { status: 400 });
      }
      if (!station || String(station).trim().length < 2) {
        return NextResponse.json({ error: "Police Station/Region is required." }, { status: 400 });
      }
    }
    if (requestedRole === "tanroads") {
      if (!employeeId || String(employeeId).trim().length < 2) {
        return NextResponse.json({ error: "TANROADS Employee ID is required." }, { status: 400 });
      }
    }
    if (requestedRole === "researcher") {
      if (!institution || String(institution).trim().length < 2) {
        return NextResponse.json({ error: "Institution name is required." }, { status: 400 });
      }
    }

    const isStaff = requestedRole === "police";
    const isSuperuser = requestedRole === "tanroads";

    const sbServer = getAuthSignUpClient();
    const { data: signUp, error: signErr } = await sbServer.auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: {
        data: {
          username: requestedUsername,
          first_name: cleanFirst,
          last_name: cleanLast,
          phone: cleanPhone,
          role: requestedRole,
        },
      },
    });

    if (signErr || !signUp?.user) {
      console.error("[register] signUp failed:", signErr?.message);
      return NextResponse.json({ error: signErr?.message || "Could not create account" }, { status: 400 });
    }

    const supabaseUserId = signUp.user.id;
    const admin = getSupabaseAdmin();

    // Set role in app_metadata immediately (like Firebase custom claims)
    // This ensures middleware can read the role without a DB query.
    try {
      const adminAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      await adminAuth.auth.admin.updateUserById(supabaseUserId, {
        app_metadata: { role: requestedRole },
      });
    } catch (metaErr) {
      console.warn("[register] Failed to set app_metadata:", metaErr);
      // Non-fatal — the DB trigger will sync it later
    }

    let cleanUsername = requestedUsername;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existingUsername } = await admin
        .from("User")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();
      if (!existingUsername) break;
      cleanUsername = `${requestedUsername}${Math.floor(Math.random() * 9000) + 1000}`;
    }

    const { data: newUser, error: userErr } = await admin
      .from("User")
      .insert({
        email: cleanEmail,
        username: cleanUsername,
        firstName: cleanFirst,
        lastName: cleanLast,
        password: "!supabase-managed",
        isStaff,
        isSuperuser,
        isActive: true,
        dateJoined: new Date().toISOString(),
      })
      .select("id, email, username, firstName, lastName, isStaff, isSuperuser")
      .single();

    if (userErr || !newUser) {
      console.error("[register] User insert failed:", userErr?.message);
      return NextResponse.json({ error: "Failed to save user record.", detail: userErr?.message }, { status: 500 });
    }

    const now = new Date().toISOString();
    const profilePhone = cleanPhone || `+255000${String((newUser as any).id).padStart(6, "0")}`;

    const profileData: Record<string, any> = {
      userId: (newUser as any).id,
      role: requestedRole,
      phone: profilePhone,
      supabaseUid: supabaseUserId,
      badgeNumber: requestedRole === "police" ? String(badgeNumber).trim() : "",
      station: requestedRole === "police" ? String(station).trim() : "",
      employeeId: requestedRole === "tanroads" ? String(employeeId).trim() : "",
      institution: requestedRole === "researcher" ? String(institution).trim() : "",
      updatedAt: now,
      createdAt: now,
    };

    // Try with supabaseUid first; fallback to minimal insert if column doesn't exist yet
    const { error: profileErr } = await admin.from("UserProfile").insert(profileData);

    if (profileErr) {
      console.warn("[register] UserProfile insert warning:", profileErr.message);
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: (newUser as any).id,
          email: cleanEmail,
          username: requestedUsername,
          firstName: cleanFirst,
          lastName: cleanLast,
          role: requestedRole,
          isStaff,
          isSuperuser,
        },
        session: signUp.session
          ? {
              accessToken: signUp.session.access_token,
              refreshToken: signUp.session.refresh_token,
            }
          : null,
        _meta: { latencyMs: Date.now() - start },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
