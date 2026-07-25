import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    // Build the response first so we can attach Set-Cookie headers to it.
    // @supabase/ssr's setAll() must run on the response, not just the request,
    // otherwise the browser never receives the session cookies and the next
    // request's supabase.auth.getUser() in middleware returns null.
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the client-side callback page, which will:
      //   1. Confirm the session is live in the browser
      //   2. Fetch /api/me and stash the profile in localStorage
      //   3. Push to /dashboard with everything in place
      // The cookies set on `response` get copied onto `redirectResponse`
      // so the browser actually receives them.
      // NOTE: This page is at /auth/callback/DONE (not /auth/callback) because
      // route.ts cannot coexist with page.tsx at the same path in App Router.
      const callbackUrl = `${origin}/auth/callback/done?next=${encodeURIComponent(next)}`;
      const redirectResponse = NextResponse.redirect(new URL(callbackUrl));
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, {
          path: "/",
          sameSite: "lax",
          ...(c as any),
        });
      });
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
