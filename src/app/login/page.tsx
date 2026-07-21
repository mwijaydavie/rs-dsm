"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PremiumTopNav from "@/components/PremiumTopNav";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          router.replace("/dashboard");
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    let profileData: any = {
      email,
      firstName: email.split("@")[0],
      avatar: undefined,
      role: "COMMUNITY",
    };
    try {
      const r = await fetch("/api/me");
      if (r.ok) {
        const j = await r.json();
        if (j?.user) profileData = { ...profileData, ...j.user };
      }
    } catch {}

    localStorage.setItem("rsd_user", JSON.stringify(profileData));
    window.dispatchEvent(new Event("rsd:user-changed"));
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <PremiumTopNav variant="login" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 12px 16px", flex: 1 }}>
        <div
          style={{
            background: "#fff",
            padding: "clamp(20px, 4vw, 40px)",
            borderRadius: 20,
            maxWidth: 440,
            width: "100%",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)",
            border: "1px solid rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Sign In</h2>
            <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>Authorized personnel only</p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: "#FEE2E2",
                color: "#DC2626",
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Email *</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="your@email.com" autoComplete="email"
                style={{ padding: "11px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 15, minHeight: 46, outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Password *</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ width: "100%", padding: "11px 44px 11px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 15, minHeight: 46, outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 6, cursor: "pointer", color: "#64748B" }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} style={{
                width: "100%", background: "#3B82F6", color: "#fff", border: "none",
                padding: "13px 16px", borderRadius: 999, fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, minHeight: 48,
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)", marginBottom: 16,
              }}>
              {loading ? "Please wait..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: "#fff",
              color: "#0F172A",
              border: "1px solid #E2E8F0",
              padding: "12px 16px",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              minHeight: 48,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <footer
        style={{
          marginTop: "auto",
          textAlign: "center",
          padding: "24px 20px",
          background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/accident-protection.png" alt="" style={{ width: 18, height: 18, opacity: 0.7 }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Dar es Salaam Road Safety</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B" }}>
            &copy; {new Date().getFullYear()} <strong>Dar es Salaam Road Safety</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
