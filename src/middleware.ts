import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type RouteGuard = {
  path: string;
  allowedRoles: string[];
  redirect: string;
};

const ROUTE_GUARDS: RouteGuard[] = [
  { path: "/dashboard", allowedRoles: ["ADMIN", "POLICE", "TANROADS"], redirect: "/login" },
  { path: "/editor", allowedRoles: ["ADMIN", "POLICE"], redirect: "/dashboard" },
  { path: "/authority", allowedRoles: ["ADMIN"], redirect: "/dashboard" },
  { path: "/profile", allowedRoles: ["ADMIN", "POLICE", "TANROADS"], redirect: "/login" },
];

async function getUserRoleFromSession(request: NextRequest): Promise<string | null> {
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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
          if (["ADMIN", "POLICE", "TANROADS"].includes(appRole)) {
            return appRole;
          }
        }
      } catch {}
    }

    const appRole = user.app_metadata?.role as string | undefined;
    if (appRole && ["ADMIN", "POLICE", "TANROADS"].includes(appRole)) {
      return appRole;
    }

    const { getSupabaseAdmin } = await import("@/lib/supabase-server");
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from("UserProfile")
      .select("role")
      .eq("supabaseUid", user.id)
      .maybeSingle();

    if (profile) {
      const role = (profile as any).role;
      if (["ADMIN", "POLICE", "TANROADS"].includes(role)) return role;
    }

    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const guard = ROUTE_GUARDS.find((g) => path.startsWith(g.path));

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

  if (guard && !user) {
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
