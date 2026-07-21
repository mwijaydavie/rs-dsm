"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface NavUser {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  isGuest?: boolean;
}

const ACCENT = "#3B82F6";
const ACCENT_DARK = "#1E3A5F";
const BRAND_GRADIENT = "linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #3B82F6 100%)";

export default function PremiumTopNav({
  variant = "default",
}: {
  variant?: "default" | "dashboard" | "editor" | "report" | "authority" | "login";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const stored = localStorage.getItem("rsd_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) {
            if (!cancelled) setUser(parsed);
            return;
          }
        }

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
                role: j.user.role || "COMMUNITY",
                isGuest: false,
              };
              localStorage.setItem("rsd_user", JSON.stringify(profileData));
              if (!cancelled) setUser(profileData);
              return;
            }
          }
        } catch {}

        if (!cancelled) setUser(null);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("rsd:user-changed", loadUser);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("rsd:user-changed", loadUser);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("rsd_user");
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    window.dispatchEvent(new Event("rsd:user-changed"));
    router.push("/login");
  };

  const userRole = user?.role || "";
  const isAdmin = userRole === "ADMIN";
  const isPolice = userRole === "POLICE";
  const isTanroads = userRole === "TANROADS";
  const isStaff = isAdmin || isPolice || isTanroads;
  const isLoggedIn = !!user && !user.isGuest;

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/", label: "Home", show: variant !== "login" && variant !== "editor" && variant !== "authority" },
    { href: "/dashboard", label: "Dashboard", show: variant !== "login" && isStaff },
    { href: "/report", label: "Report Accident", show: variant !== "login" && variant !== "editor" },
    { href: "/editor", label: "Queue", show: (variant === "editor" || isStaff) && variant !== "login" },
    { href: "/authority", label: "Authority", show: (variant === "authority" || isAdmin) && variant !== "login" },
  ].filter((l): l is { href: string; label: string; show: true } => l.show === true);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const navStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: scrolled ? "rgba(255, 255, 255, 0.85)" : BRAND_GRADIENT,
    backdropFilter: scrolled ? "saturate(180%) blur(16px)" : "saturate(180%) blur(8px)",
    WebkitBackdropFilter: scrolled ? "saturate(180%) blur(16px)" : "saturate(180%) blur(8px)",
    borderBottom: scrolled ? "1px solid rgba(15, 23, 42, 0.06)" : "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: scrolled
      ? "0 4px 20px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)"
      : variant === "login"
      ? "0 4px 20px rgba(59, 130, 246, 0.15)"
      : "0 4px 20px rgba(37, 99, 235, 0.18)",
    transition: "background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
  };

  const textColor = scrolled ? ACCENT_DARK : "#fff";
  const linkBaseStyle: React.CSSProperties = {
    color: textColor,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
    padding: "8px 14px",
    borderRadius: 10,
    transition: "background 0.2s, color 0.2s",
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  };

  return (
    <>
      <header style={navStyle}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: scrolled ? "10px 20px" : "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            transition: "padding 0.25s ease",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: textColor,
              fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif',
              fontWeight: 700,
              fontSize: scrolled ? 17 : 19,
              letterSpacing: "-0.3px",
              flexShrink: 0,
              transition: "color 0.25s ease, font-size 0.25s ease",
            }}
          >
            <img
              src="/accident-protection.png"
              alt=""
              style={{
                width: scrolled ? 26 : 30,
                height: scrolled ? 26 : 30,
                objectFit: "contain",
                transition: "width 0.25s, height 0.25s",
              }}
            />
            <span style={{ whiteSpace: "nowrap" }}>
              Road Safety{" "}
              <span
                style={{
                  color: scrolled ? ACCENT : "#93C5FD",
                  transition: "color 0.25s",
                }}
              >
                Dar
              </span>
            </span>
          </Link>

          <nav
            className="rsd-nav-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    ...linkBaseStyle,
                    background: active
                      ? scrolled
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(255, 255, 255, 0.18)"
                      : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {user ? (
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: scrolled ? "rgba(59, 130, 246, 0.08)" : "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    padding: "6px 10px 6px 6px",
                    borderRadius: 999,
                    cursor: "pointer",
                    color: textColor,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: scrolled ? ACCENT : "rgba(255, 255, 255, 0.25)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        (user.firstName?.[0] || user.email[0] || "U").toUpperCase()
                      )}
                    </span>
                  <span className="rsd-nav-desktop" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.firstName || user.email.split("@")[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: 240,
                      background: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08)",
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      animation: "rsd-fade-in 0.15s ease",
                    }}
                  >
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Signed in as</div>
                      <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.email}
                      </div>
                      {isLoggedIn && (
                        <div style={{ marginTop: 6, display: "inline-block", fontSize: 11, fontWeight: 700, color: "#fff", background: isAdmin ? "#DC2626" : isPolice ? "#3B82F6" : isTanroads ? "#FBBF24" : "#64748B", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {isAdmin ? "Admin" : isPolice ? "Police" : isTanroads ? "TANROADS" : user.role}
                        </div>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        color: "#0F172A",
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      My Profile
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href="/editor"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: "block",
                            padding: "10px 16px",
                            color: "#0F172A",
                            textDecoration: "none",
                            fontSize: 14,
                            fontWeight: 500,
                            borderBottom: "1px solid #F1F5F9",
                          }}
                        >
                          Review Queue
                        </Link>
                        <Link
                          href="/authority"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: "block",
                            padding: "10px 16px",
                            color: "#0F172A",
                            textDecoration: "none",
                            fontSize: 14,
                            fontWeight: 500,
                            borderBottom: "1px solid #F1F5F9",
                          }}
                        >
                          Authority Console
                        </Link>
                      </>
                    )}
                    {isPolice && !isAdmin && (
                      <Link
                        href="/editor"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "10px 16px",
                          color: "#0F172A",
                          textDecoration: "none",
                          fontSize: 14,
                          fontWeight: 500,
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        Review Queue
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rsd-nav-desktop"
                  style={{
                    color: textColor,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "8px 14px",
                    borderRadius: 10,
                  }}
                >
                  Login
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rsd-nav-mobile-btn"
              style={{
                display: "none",
                background: scrolled ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.15)",
                border: "none",
                padding: 8,
                borderRadius: 10,
                cursor: "pointer",
                color: textColor,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            animation: "rsd-fade-in 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(86vw, 360px)",
              background: "#fff",
              boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
              display: "flex",
              flexDirection: "column",
              animation: "rsd-slide-in 0.25s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #E2E8F0",
                background: BRAND_GRADIENT,
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                <img src="/accident-protection.png" alt="" style={{ width: 24, height: 24 }} />
                Menu
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: 8, borderRadius: 8, cursor: "pointer" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", padding: 12 }}>
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: "14px 16px",
                      color: active ? ACCENT : "#0F172A",
                      textDecoration: "none",
                      fontSize: 16,
                      fontWeight: active ? 700 : 600,
                      borderRadius: 10,
                      background: active ? "rgba(59, 130, 246, 0.08)" : "transparent",
                    }}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <div style={{ height: 1, background: "#E2E8F0", margin: "8px 12px" }} />
              {user ? (
                <>
                  <div style={{ padding: "8px 16px", color: "#475569", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Account
                  </div>
                  <div style={{ padding: "8px 16px", color: "#0F172A", fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>
                    {user.email}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    style={{ padding: "12px 16px", color: "#0F172A", textDecoration: "none", fontSize: 15, fontWeight: 600 }}
                  >
                    My Profile
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href="/editor" onClick={() => setMobileOpen(false)} style={{ padding: "12px 16px", color: "#0F172A", textDecoration: "none", fontSize: 15, fontWeight: 600 }}>
                        Review Queue
                      </Link>
                      <Link href="/authority" onClick={() => setMobileOpen(false)} style={{ padding: "12px 16px", color: "#0F172A", textDecoration: "none", fontSize: 15, fontWeight: 600 }}>
                        Authority Console
                      </Link>
                    </>
                  )}
                  {isPolice && !isAdmin && (
                    <Link href="/editor" onClick={() => setMobileOpen(false)} style={{ padding: "12px 16px", color: "#0F172A", textDecoration: "none", fontSize: 15, fontWeight: 600 }}>
                      Review Queue
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    style={{
                      margin: "12px 16px",
                      padding: "12px 16px",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      margin: "12px 16px 6px",
                      padding: "12px 16px",
                      background: "#F1F5F9",
                      color: "#0F172A",
                      textDecoration: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      borderRadius: 10,
                      textAlign: "center",
                    }}
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes rsd-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rsd-slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 820px) {
          .rsd-nav-desktop { display: none !important; }
          .rsd-nav-mobile-btn { display: inline-flex !important; }
        }
        @media (min-width: 821px) {
          .rsd-nav-mobile-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
