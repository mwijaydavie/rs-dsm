"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";
import { ExportBar } from "./ExportBar";
import { createClient } from "@/lib/supabase-browser";
import CountUp from "@/components/CountUp";
import ScrollReveal from "@/components/ScrollReveal";
import LoadingScreen from "@/components/LoadingScreen";
import Footer from "@/components/Footer";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FilterBar, FilterState } from "@/components/FilterBar";
import dynamic from "next/dynamic";

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      borderRadius: 16, marginBottom: 24, border: "1px solid #E2E8F0",
      height: "500px", minHeight: "400px", width: "100%",
      background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#94A3B8", fontSize: 14,
    }}>
      Loading map...
    </div>
  ),
});

interface Accident {
  id: number;
  lat: number;
  lng: number;
  severity: string;
  vehicleTypes: string[];
  district: string;
  junctionName: string;
  occurredAt: string;
  casualties: number;
  fatalities: number;
  verified: boolean;
  upvoteCount: number;
  intensity: number;
  photoUrl?: string;
  description?: string;
}

interface Stats {
  total: number;
  fatal: number;
  serious: number;
  minor: number;
  critical: number;
  verified: number;
  totalFatalities: number;
  totalCasualties: number;
  junctionCount: number;
  severity: Record<string, number>;
  vehicles: Record<string, number>;
  monthly: { month: string; count: number }[];
  hourly: { hour: number; count: number }[];
}



async function fetchAccidents(url: string): Promise<Accident[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data as Accident[];
  } catch {
    return [];
  }
}

async function fetchStats(url: string): Promise<Stats | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || "error" in data) return null;
    return data as Stats;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedHour, setSelectedHour] = useState("all");
  const [seriousMode, setSeriousMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"dashboard" | "analytics">("dashboard");
  const [filters, setFilters] = useState<FilterState>({ from: "", to: "", year: "", month: "", district: "", ward: "", severity: "", weather: "", roadType: "" });
  const [aiSummary, setAiSummary] = useState<{
    text: string;
    provider?: string;
    loading: boolean;
    error?: string;
    lang: "en" | "sw";
  }>({ text: "", loading: true, lang: "en" });
  const fetchAiSummary = (lang: "en" | "sw" = "en") => {
    setAiSummary((s) => ({ ...s, loading: true, lang, error: undefined }));
    fetch(`/api/ai-summary?lang=${lang}&fresh=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setAiSummary({ text: d.text, provider: d.provider, loading: false, lang });
        else setAiSummary({ text: "", loading: false, error: d.hint || d.error || "AI unavailable", lang });
      })
      .catch((err) => {
        setAiSummary({ text: "", loading: false, error: err?.message || "Network error", lang });
      });
  };

  useEffect(() => { fetchAiSummary("en"); }, []);
  useEffect(() => {
    fetchAccidents("/api/accidents").then(setAccidents);
    fetchStats("/api/stats").then(setStats);
    const stored = localStorage.getItem("rsd_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const [loadingComplete, setLoadingComplete] = useState(false);
  const sevColors: Record<string, string> = {
    fatal: "#F87171",
    critical: "#FBBF24",
    serious: "#3B82F6",
    minor: "#22C55E",
  };

  if (!loadingComplete) {
    return <LoadingScreen onComplete={() => setLoadingComplete(true)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <PremiumTopNav variant="dashboard" />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 12px", position: "relative", zIndex: 1, flex: 1, width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setView("dashboard")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: view === "dashboard" ? "#0F172A" : "#E2E8F0", color: view === "dashboard" ? "#fff" : "#475569" }}>
            Dashboard
          </button>
          <button onClick={() => setView("analytics")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: view === "analytics" ? "#0F172A" : "#E2E8F0", color: view === "analytics" ? "#fff" : "#475569" }}>
            Analytics
          </button>
        </div>

        {view === "dashboard" ? (<>
        <ExportBar
          accidentCount={
            selectedHour === "all"
              ? accidents.length
              : accidents.filter((a) => new Date(a.occurredAt).getHours() === parseInt(selectedHour)).length
          }
          selectedHour={selectedHour}
        />

        {/* AI Safety Summary Banner */}
        <div style={{
          marginBottom: 24, padding: "20px 24px", borderRadius: 16,
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "#F8FAFC", boxShadow: "0 4px 24px rgba(15, 23, 42, 0.15)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#1E293B",
            }}>✦</div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#D4AF37" }}>
                  AI Safety Brief
                </span>
                {aiSummary.provider && (
                  <span style={{ fontSize: 10, color: "#94A3B8", padding: "2px 6px", border: "1px solid #334155", borderRadius: 999 }}>
                    via {aiSummary.provider === "cloudflare" ? "Llama 3.3 70B" : aiSummary.provider}
                  </span>
                )}
                {aiSummary.loading && <span style={{ fontSize: 10, color: "#94A3B8" }}>thinking...</span>}
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => fetchAiSummary(aiSummary.lang === "sw" ? "en" : "sw")}
                    style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", background: "transparent", border: "1px solid #334155", borderRadius: 999, padding: "2px 8px", cursor: "pointer" }}>
                    {aiSummary.lang === "sw" ? "🇬🇧 EN" : "🇹🇿 SW"}
                  </button>
                  <button type="button" onClick={() => fetchAiSummary(aiSummary.lang)}
                    style={{ fontSize: 10, fontWeight: 700, color: "#D4AF37", background: "transparent", border: "1px solid #D4AF37", borderRadius: 999, padding: "2px 8px", cursor: "pointer" }}>
                    ↻ Refresh
                  </button>
                </div>
              </div>
              {aiSummary.loading && !aiSummary.text ? (
                <div style={{ height: 48, background: "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)", backgroundSize: "200% 100%", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : aiSummary.error ? (
                <div style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>
                  AI summary unavailable. {aiSummary.error.includes("GROQ_API_KEY") || aiSummary.error.includes("CLOUDFLARE_API_TOKEN") ? "Add an API key in landing/.env to enable." : aiSummary.error}
                </div>
              ) : (
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#E2E8F0" }}>{aiSummary.text}</div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        {stats && (
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Reports", value: stats.total, color: "#F87171" },
                { label: "Verified", value: stats.verified, color: "#22C55E" },
                { label: "Fatal", value: stats.fatal, color: "#DC2626" },
                { label: "Critical", value: stats.critical, color: "#FBBF24" },
                { label: "Serious", value: stats.serious, color: "#3B82F6" },
                { label: "Junctions", value: stats.junctionCount, color: "#A855F7" },
              ].map((kpi) => (
                <div key={kpi.label} style={{
                  background: "#fff", padding: "20px 16px", borderRadius: 16,
                  border: "1px solid #E2E8F0", borderTop: `3px solid ${kpi.color}`,
                  textAlign: "center", cursor: "default",
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(15,23,42,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <CountUp end={kpi.value} style={{ fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif', fontSize: 32, fontWeight: 800, color: kpi.color }} />
                  <div style={{ fontSize: 13, color: "#475569", fontWeight: 600, marginTop: 4 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Map controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "12px 16px", background: "#fff", borderRadius: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>Filter by Hour</label>
          <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)}
            style={{ padding: "8px 16px", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, minHeight: 44 }}>
            <option value="all">All Hours</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i}:00 - {(i + 1) % 24}:00</option>
            ))}
          </select>
          <div style={{ width: 1, height: 28, background: "#E2E8F0", margin: "0 4px" }} />
          <button onClick={() => setSeriousMode((v) => !v)} aria-pressed={seriousMode}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", minHeight: 44, borderRadius: 12,
              border: seriousMode ? "1px solid #DC2626" : "1px solid #E2E8F0",
              background: seriousMode ? "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)" : "#fff",
              color: seriousMode ? "#fff" : "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: seriousMode ? "0 4px 14px rgba(220, 38, 38, 0.35)" : "none", transition: "all 0.15s ease",
            }}>
            <span aria-hidden style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: seriousMode ? "#fff" : "#DC2626", boxShadow: seriousMode ? "0 0 0 3px rgba(255,255,255,0.25)" : "none" }} />
            {seriousMode ? "Serious Mode: ON" : "Serious Mode"}
          </button>
          {seriousMode && <span style={{ fontSize: 12, color: "#64748B", marginLeft: 4 }}>Showing fatal / critical / serious, verified or with applauds.</span>}
        </div>

        {/* Map - using npm leaflet package */}
        <DashboardMap accidents={accidents} selectedHour={selectedHour} seriousMode={seriousMode} />

        {/* Serious Incidents feed */}
        {seriousMode && (() => {
          const hourFiltered = selectedHour === "all" ? accidents : accidents.filter((a) => new Date(a.occurredAt).getHours() === parseInt(selectedHour));
          const list = hourFiltered
            .filter((a) => ["fatal", "critical", "serious"].includes(a.severity))
            .filter((a) => a.verified || a.upvoteCount > 0)
            .sort((a, b) => {
              const sevWeight = (s: string) => s === "fatal" ? 3 : s === "critical" ? 2 : 1;
              if (sevWeight(b.severity) !== sevWeight(a.severity)) return sevWeight(b.severity) - sevWeight(a.severity);
              if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
              return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
            }).slice(0, 10);

          if (!list.length) {
            return (
              <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", color: "#fff", padding: 24, borderRadius: 16, marginBottom: 24, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>No serious incidents in this window</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Either no fatal/critical/serious reports have been verified yet, or the time filter is hiding them.</div>
              </div>
            );
          }

          return (
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20, marginBottom: 24, borderTop: "4px solid #DC2626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#DC2626", boxShadow: "0 0 0 4px rgba(220,38,38,0.18)" }} />
                <h3 style={{ margin: 0, fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif', fontSize: 18, fontWeight: 800 }}>Serious Incidents</h3>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{list.length} of {hourFiltered.filter((a) => ["fatal","critical","serious"].includes(a.severity)).length} shown</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map((a) => {
                  const sevColor = sevColors[a.severity] || "#DC2626";
                  return (
                    <div key={a.id} style={{ padding: 12, borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: sevColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: sevColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.severity}</span>
                          {a.verified && <span style={{ fontSize: 10, fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "2px 6px", borderRadius: 999 }}>✓ Verified</span>}
                          {a.fatalities > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: 999 }}>{a.fatalities} fatality{a.fatalities !== 1 ? "ies" : ""}</span>}
                          {a.casualties > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 999 }}>{a.casualties} injured</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, marginTop: 4 }}>{a.junctionName || "(unnamed)"}{a.district ? `, ${a.district}` : ""}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{new Date(a.occurredAt).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>{a.upvoteCount}</div>
                        <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>applaud{a.upvoteCount !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Charts */}
        {stats && (
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 16px", fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif', fontSize: 16, fontWeight: 600 }}>Severity Distribution</h3>
                {Object.entries(stats.severity).map(([sev, count]) => (
                  <div key={sev} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 2 }}>
                      <span>{sev.charAt(0).toUpperCase() + sev.slice(1)}</span>
                      <span style={{ fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: "#E2E8F0", borderRadius: 999 }}>
                      <div style={{ width: `${(count / stats.total) * 100}%`, height: "100%", background: sevColors[sev] || "#3B82F6", borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: "0 0 16px", fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif', fontSize: 16, fontWeight: 600 }}>Vehicle Types</h3>
                {Object.entries(stats.vehicles).map(([v, count]) => (
                  <div key={v} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 2 }}>
                      <span>{v}</span>
                      <span style={{ fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: "#E2E8F0", borderRadius: 999 }}>
                      <div style={{ width: `${(count / stats.total) * 100}%`, height: "100%", background: "#A855F7", borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
        </>) : (
        <div>
          <FilterBar filters={filters} onChange={setFilters} />
          <AnalyticsDashboard filters={{
            from: filters.from || undefined,
            to: filters.to || undefined,
            district: filters.district || undefined,
            severity: filters.severity || undefined,
            weather: filters.weather || undefined,
            roadType: filters.roadType || undefined,
          }} />
        </div>
        )}
      </main>
      <Footer />
    </div>
  );
}