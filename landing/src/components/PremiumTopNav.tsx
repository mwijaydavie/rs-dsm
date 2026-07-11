"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PremiumTopNav({
  variant = "default",
}: {
  variant?: "default" | "dashboard" | "editor" | "report" | "authority" | "login";
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rsd_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) setUserEmail(parsed.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const bg =
    variant === "login"
      ? "#3B82F6"
      : variant === "authority"
        ? "#1E293B"
        : "linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #3B82F6 100%)";

  const textColor = "#fff";

  const navLinkStyle: React.CSSProperties = {
    color: textColor,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
    padding: "8px 12px",
    borderRadius: 10,
    transition: "background 0.2s",
  };

  const brandFontFamily = '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif';

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        background: bg,
        color: textColor,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(37, 99, 235, 0.25)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
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
          fontFamily: brandFontFamily,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "-0.3px",
        }}
      >
        <img
          src="/accident-protection.png"
          alt=""
          style={{ width: 30, height: 30, objectFit: "contain" }}
        />
        <span>
          Road Safety <span style={{ color: "#93C5FD" }}>Dar es Salaam</span>
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {variant !== "login" && (
          <Link href="/dashboard/" style={navLinkStyle}>
            Dashboard
          </Link>
        )}
        {variant !== "login" && variant !== "editor" && (
          <Link href="/report/" style={navLinkStyle}>
            Report
          </Link>
        )}
        {variant === "editor" && (
          <Link href="/editor" style={navLinkStyle}>
            Queue
          </Link>
        )}
        {variant === "authority" && (
          <Link href="/authority" style={navLinkStyle}>
            Authority
          </Link>
        )}

        {userEmail ? (
          <span style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, padding: "0 6px" }}>
            {userEmail}
          </span>
        ) : (
          <Link href="/login" style={{ ...navLinkStyle, background: "rgba(255,255,255,0.15)" }}>
            Sign In
          </Link>
        )}
      </nav>

      <style jsx>{`
        nav a:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </header>
  );
}

