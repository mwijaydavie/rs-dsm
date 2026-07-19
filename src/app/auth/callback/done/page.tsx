"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

/**
 * Client-side auth callback handler.
 * The server route /auth/callback exchanges the OAuth code for session cookies
 * and redirects here. This page:
 *   1. Confirms a Supabase session exists
 *   2. Fetches /api/me to get the user's role/profile
 *   3. Stores it in localStorage so the dashboard knows who the user is
 *   4. Sends them to /dashboard
 *
 * Without this, the Google OAuth flow leaves Supabase session cookies in place
 * but localStorage.rsd_user empty, so the dashboard has no user data.
 *
 * Note: this page lives at /auth/callback/DONE to avoid colliding with the
 * server route handler at /auth/callback (route.ts). The route exchanges the
 * OAuth code and redirects here with the same `next` query param.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "no-session" | "ok">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessErr || !data.session) {
        setStatus("no-session");
        setError(sessErr?.message || "No session after OAuth");
        return;
      }

      // Sync role to app_metadata for middleware fast path
      try {
        await fetch("/api/auth/sync-role", { method: "POST" });
      } catch {
        // Non-fatal
      }

      // Fetch profile data and stash it for the dashboard
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (j?.user) {
            // Extract avatar from multiple possible sources
            const sessionAvatar =
              (data.session.user.user_metadata as any)?.avatar_url ||
              (data.session.user.user_metadata as any)?.picture ||
              (data.session.user.user_metadata as any)?.avatarUrl ||
              undefined;
            const profileData = {
              email: j.user.email ?? data.session.user.email,
              firstName: j.user.firstName ?? (data.session.user.email?.split("@")[0] || "User"),
              lastName: j.user.lastName ?? "",
              avatar: j.user.avatar ?? sessionAvatar,
              role: j.user.role ?? "community",
            };
            localStorage.setItem("rsd_user", JSON.stringify(profileData));
            window.dispatchEvent(new Event("rsd:user-changed"));
          }
        } else {
          // Even if /api/me fails, build a minimal profile so dashboard renders.
          // Check for known admin emails so they get their role immediately.
          const userEmail = data.session.user.email || "";
          const sessionMeta = data.session.user.user_metadata as any;
          const sessionAvatar =
            sessionMeta?.avatar_url || sessionMeta?.picture || sessionMeta?.avatarUrl || undefined;
          const isAdminEmail = userEmail.toLowerCase() === "roadsafetydar@gmail.com";
          const fallback = {
            email: userEmail,
            firstName: userEmail?.split("@")[0] || "User",
            lastName: "",
            avatar: sessionAvatar,
            role: isAdminEmail ? "admin" : "community",
          };
          localStorage.setItem("rsd_user", JSON.stringify(fallback));
          window.dispatchEvent(new Event("rsd:user-changed"));
        }
      } catch (e) {
        // Same fallback for network errors
        const userEmail = data.session.user.email || "";
        const sessionMeta = data.session.user.user_metadata as any;
        const sessionAvatar =
          sessionMeta?.avatar_url || sessionMeta?.picture || sessionMeta?.avatarUrl || undefined;
        const isAdminEmail = userEmail.toLowerCase() === "roadsafetydar@gmail.com";
        const fallback = {
          email: userEmail,
          firstName: userEmail?.split("@")[0] || "User",
          lastName: "",
          avatar: sessionAvatar,
          role: isAdminEmail ? "admin" : "community",
        };
        localStorage.setItem("rsd_user", JSON.stringify(fallback));
        window.dispatchEvent(new Event("rsd:user-changed"));
      }

      setStatus("ok");
      // Small delay so the user sees the success state
      setTimeout(() => {
        if (!cancelled) {
          // Honor the ?next= query param the route passed through
          const params = new URLSearchParams(window.location.search);
          const next = params.get("next") || "/dashboard";
          router.replace(next);
        }
      }, 400);
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#fff",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        padding: "48px 56px",
        textAlign: "center",
        maxWidth: 420,
      }}>
        {status === "loading" && (
          <>
            <div style={{
              width: 56,
              height: 56,
              border: "4px solid rgba(255,255,255,0.2)",
              borderTopColor: "#D4AF37",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 24px",
            }} />
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
              Signing you in…
            </h2>
            <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>
              One moment while we set things up.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
        {status === "ok" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>OK</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
              You're signed in!
            </h2>
            <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>
              Redirecting to the dashboard…
            </p>
          </>
        )}
        {status === "no-session" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>!</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
              Sign-in failed
            </h2>
            <p style={{ margin: "0 0 24px", opacity: 0.7, fontSize: 14 }}>
              {error || "No session was returned from the OAuth provider."}
            </p>
            <a
              href="/login"
              style={{
                display: "inline-block",
                background: "#D4AF37",
                color: "#1E1B4B",
                padding: "12px 24px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
