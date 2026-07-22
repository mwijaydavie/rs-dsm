"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  const _ = (key: string, fb?: string) => t(key, lang, fb);
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      style={{
        background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
        borderTop: "1px solid #E2E8F0",
        padding: "48px 24px 32px",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
          marginBottom: 32,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src="/accident-protection.png" alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>
                Road Safety <span style={{ color: "#3B82F6" }}>Dar</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.6, maxWidth: 260 }}>
              Real-time accident hotspot intelligence for Tanzania's commercial capital. Citizen-powered, police-verified.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{_("nav.home")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/", label: _("nav.home") },
                { href: "/dashboard", label: _("nav.dashboard") },
                { href: "/report", label: _("nav.report") },
                { href: "/login", label: _("nav.login") },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
                >{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Districts */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Coverage</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"].map((d) => (
                <Link key={d} href={`/dashboard?district=${d.toLowerCase()}`} style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
                >{d}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{_("footer.contact")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#475569" }}>
              <a href="mailto:roadsafetydar@gmail.com" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600 }}>roadsafetydar@gmail.com</a>
              <span>Dar es Salaam, Tanzania</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>SDG 11.2 — Safer urban transport</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid #E2E8F0",
          paddingTop: 20,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            &copy; {year} <strong style={{ color: "#64748B" }}>Dar es Salaam Road Safety</strong> — {_("footer.rights")}.
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>{_("footer.privacy")}</Link>
            <Link href="/terms" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>{_("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}