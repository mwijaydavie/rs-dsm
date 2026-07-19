"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";
import { createClient } from "@/lib/supabase-browser";

interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
}

interface Accident {
  id: number;
  district: string;
  ward: string;
  junctionName: string;
  occurredAt: string;
  severity: string;
  verificationStatus: string;
  verified: boolean;
  upvoteCount: number;
  casualties: number;
  fatalities: number;
  description?: string;
  photoUrl?: string;
  vehicleTypes: string[];
}

const SEV_COLORS: Record<string, string> = {
  fatal: "#DC2626",
  critical: "#FBBF24",
  serious: "#3B82F6",
  minor: "#22C55E",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);
  const [accidentLoading, setAccidentLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Load user from localStorage or /api/me
      const stored = localStorage.getItem("rsd_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          if (!cancelled) setUser(parsed);
        }
      } else {
        // Try to fetch from API
        try {
          const r = await fetch("/api/me", { cache: "no-store" });
          if (r.ok) {
            const j = await r.json();
            if (j?.user?.email) {
              const profileData = {
                email: j.user.email,
                firstName: j.user.firstName || j.user.email.split("@")[0],
                lastName: j.user.lastName || "",
                avatar: j.user.avatar || undefined,
                role: j.user.role || "ADMIN",
              };
              localStorage.setItem("rsd_user", JSON.stringify(profileData));
              if (!cancelled) setUser(profileData);
            }
          }
        } catch {}
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch user's reported accidents
  useEffect(() => {
    let cancelled = false;

    async function loadAccidents() {
      try {
        const r = await fetch("/api/me/accidents", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (!cancelled) setAccidents(j.accidents || []);
        }
      } catch {}
      if (!cancelled) setAccidentLoading(false);
    }

    loadAccidents();
    return () => { cancelled = true; };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("rsd_user");
    setUser(null);
    window.dispatchEvent(new Event("rsd:user-changed"));
    router.push("/login");
  };

  if (!loading && !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <PremiumTopNav />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 48, opacity: 0.5 }}>!</div>
          <h2 style={{ margin: 0, color: "#0F172A" }}>Not signed in</h2>
          <p style={{ color: "#64748B", margin: 0 }}>Please sign in to view your profile.</p>
          <Link href="/login" style={{ background: "#3B82F6", color: "#fff", padding: "12px 32px", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] || "User";

  const roleBadge = user?.role === "ADMIN"
    ? { label: "Admin", color: "#DC2626" }
    : user?.role === "POLICE"
    ? { label: "Police", color: "#3B82F6" }
    : user?.role === "TANROADS"
    ? { label: "TANROADS", color: "#FBBF24" }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <PremiumTopNav />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Profile card */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #E2E8F0",
          padding: 32,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
            background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 32, fontWeight: 700, color: "#fff",
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (displayName[0] || "U").toUpperCase()
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F172A" }}>
                {displayName}
              </h1>
              {roleBadge && (
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: roleBadge.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <div style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>{user?.email}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
              {accidents.length} accident{accidents.length !== 1 ? "s" : ""} reported
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                border: "1px solid #FECACA",
                background: "#FEF2F2",
                color: "#DC2626",
                fontWeight: 700,
                fontSize: 14,
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.7 : 1,
              }}
            >
              {signingOut ? "Signing out…" : "Log Out"}
            </button>
          </div>
        </div>

        {/* Reported accidents */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #E2E8F0",
          padding: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
              My Reports
            </h2>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              {accidents.length} total
            </span>
          </div>

          {accidentLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading your reports…</div>
          ) : accidents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>0</div>
              <div style={{ color: "#64748B", fontWeight: 600, marginBottom: 4 }}>No reports yet</div>
              <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 20px" }}>
                You haven't reported any accidents yet.
              </p>
              <Link
                href="/report"
                style={{
                  display: "inline-block",
                  background: "#3B82F6",
                  color: "#fff",
                  padding: "12px 28px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Report an Accident
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {accidents.map((a) => {
                const sevColor = SEV_COLORS[a.severity] || "#3B82F6";
                const statusLabel =
                  a.verificationStatus === "verified"
                    ? { text: "✓ Verified", color: "#166534", bg: "#DCFCE7" }
                    : a.verificationStatus === "rejected"
                    ? { text: "✗ Rejected", color: "#991B1B", bg: "#FEE2E2" }
                    : { text: "⏳ Pending", color: "#92400E", bg: "#FEF3C7" };

                return (
                  <div key={a.id} className="rsd-grid-auto-1fr" style={{
                    padding: 16,
                    borderRadius: 14,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: sevColor, flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: sevColor, textTransform: "uppercase" }}>
                          {a.severity}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: statusLabel.bg, color: statusLabel.color }}>
                          {statusLabel.text}
                        </span>
                        {a.fatalities > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: 999 }}>
                            {a.fatalities} fatality{a.fatalities !== 1 ? "ies" : ""}
                          </span>
                        )}
                        {a.casualties > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 999 }}>
                            {a.casualties} injured
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.junctionName || "(unnamed junction)"}{a.district ? `, ${a.district}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {new Date(a.occurredAt).toLocaleString()}
                        {a.description && ` • ${a.description.slice(0, 60)}${a.description.length > 60 ? "…" : ""}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>
                        {a.upvoteCount}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                        applauds
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}