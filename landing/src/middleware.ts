import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";

type RouteGuard = {
  path: string;
  allowedRoles: string[];
  redirect: string;
};

const ROUTE_GUARDS: RouteGuard[] = [
  { path: "/editor", allowedRoles: ["police", "tanroads", "admin"], redirect: "/dashboard" },
  { path: "/authority", allowedRoles: ["tanroads", "police", "admin"], redirect: "/dashboard" },
  { path: "/police", allowedRoles: ["police", "admin"], redirect: "/dashboard" },
  { path: "/researcher", allowedRoles: ["researcher", "admin"], redirect: "/dashboard" },
];

/**
 * Get the user's role, checking app_metadata FIRST (fast path),
 * then falling back to the UserProfile DB query.
 */
/**
 * Get the user's role using the admin Auth API (service_role key).
 * This is the most reliable approach in Vercel middleware because:
 *   1. It uses the service_role key, bypassing RLS
 *   2. admin.getUserById() returns FULL app_metadata including raw_app_meta_data
 *   3. Works correctly on both Node.js and Edge runtimes
 */
async function getUserRoleFromSession(request: NextRequest): Promise<string | null> {
  const guest = request.cookies.get("rsd_guest")?.value === "1";
  if (guest) return "guest";

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    // Step 1: Read session from cookies to get the Supabase user ID
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Step 2: Use admin Auth API to get the FULL user (includes raw_app_meta_data)
    // This is equivalent to Firebase Admin SDK reading custom claims.
    const { createClient } = await import("@supabase/supabase-js");
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (serviceKey) {
      const adminAuth = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      try {
        const { data: adminData } = await adminAuth.auth.admin.getUserById(user.id);
        if (adminData?.user?.app_metadata?.role) {
          const appRole = adminData.user.app_metadata.role as string;
          if (["community", "police", "tanroads", "researcher", "admin", "editor"].includes(appRole)) {
            return appRole;
          }
        }
      } catch {}
    }

    // FAST PATH FALLBACK: Read from session user's app_metadata
    const appRole = user.app_metadata?.role as string | undefined;
    if (appRole && ["community", "police", "tanroads", "researcher", "admin", "editor"].includes(appRole)) {
      return appRole;
    }

    // SECOND FALLBACK: Query UserProfile table (backwards compatibility)
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("UserProfile")
      .select("role")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (profile) return (profile as any).role;

    // THIRD FALLBACK: Check the legacy User table (Django migration)
    if (user.email) {
      const { data: userMatch } = await admin
        .from("User")
        .select("id, isStaff, isSuperuser")
        .eq("email", user.email)
        .maybeSingle();
      if (userMatch) {
        if ((userMatch as any).isSuperuser) return "tanroads";
        if ((userMatch as any).isStaff) return "police";
      }
    }
    return "community";
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const commonProtected = ["/dashboard", "/profile"];
  const isCommonProtected = commonProtected.some((p) => path.startsWith(p));

  const guard = ROUTE_GUARDS.find((g) => path.startsWith(g.path));
  const isGuest = request.cookies.get("rsd_guest")?.value === "1";

  if (isCommonProtected && isGuest) {
    return NextResponse.next({ request });
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  const { createServerClient } = await import("@supabase/ssr");
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if ((isCommonProtected || guard) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (guard && user) {
    const role = await getUserRoleFromSession(request);
    if (!role || !guard.allowedRoles.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = guard.redirect;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
