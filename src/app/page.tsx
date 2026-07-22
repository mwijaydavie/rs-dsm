"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";
import Footer from "@/components/Footer";
import CountUp from "@/components/CountUp";
import ScrollReveal from "@/components/ScrollReveal";
import dynamic from "next/dynamic";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), { ssr: false });

interface Accident {
  id: number; lat: number; lng: number; severity: string;
  vehicleTypes: string[]; district: string; ward?: string;
  junctionName: string; occurredAt: string; casualties: number;
  fatalities: number; verified: boolean; upvoteCount: number;
  intensity: number; photoUrl?: string; description?: string;
  weather?: string; roadCondition?: string;
}

export default function Home() {
  const { lang } = useLang();
  const _ = (key: string, fb?: string) => t(key, lang, fb);

  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    from: "", to: "", year: "", month: "", district: "",
    ward: "", severity: "", weather: "", roadType: "",
  });

  const fetchAccidents = useCallback(async () => {
    try {
      const res = await fetch("/api/accidents?status=verified");
      if (res.ok) {
        const data = await res.json();
        setAccidents(data || []);
      }
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchAccidents(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchAccidents, fetchStats]);

  const filteredAccidents = accidents.filter((a) => {
    if (filters.district && a.district?.toLowerCase() !== filters.district.toLowerCase()) return false;
    if (filters.severity && a.severity !== filters.severity) return false;
    if (filters.weather && a.weather?.toLowerCase() !== filters.weather.toLowerCase()) return false;
    if (filters.from && a.occurredAt < filters.from) return false;
    if (filters.to && a.occurredAt > filters.to) return false;
    return true;
  });

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+` : `${n}`;

  return (
    <>
      <PremiumTopNav variant="default" />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero Section */}
        <ScrollReveal>
          <section className="home-hero">
            <div className="home-hero-overlay" />
            <div className="home-hero-content">
              <div className="home-hero-badge">
                <span className="home-hero-dot" />
                <span>SDG 11.2 — {_("app.tagline")}</span>
              </div>
              <h1 className="home-hero-title">
                {_("app.title")}
              </h1>
              <p className="home-hero-sub">
                Real-time accident hotspot intelligence for Tanzania&apos;s commercial capital.
                Citizen-powered reports and official police data, verified and mapped for every district.
                Working towards safer urban transport across all five municipalities.
              </p>
              <div className="home-hero-actions">
                <Link href="/report" className="home-hero-btn-primary">
                  Report an Accident
                </Link>
                <a href="#map-section" className="home-hero-btn-secondary">
                  View Hotspot Map
                </a>
              </div>
              <div className="home-hero-strip">
                <div><strong>5</strong> Districts</div>
                <div><strong>24/7</strong> Monitoring</div>
                <div><strong>Police</strong> Verified</div>
                <div><strong>Real-time</strong> Updates</div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* About Section */}
        <ScrollReveal>
          <section className="home-about">
            <div className="home-about-text">
              <span className="home-section-badge">About the System</span>
              <h2>Road Safety Intelligence Platform</h2>
              <p>
                Dar es Salaam Road Safety is a comprehensive accident monitoring and analytics platform
                serving the five districts of Tanzania&apos;s commercial capital. The system aggregates
                crowdsourced reports from citizens alongside official Traffic Police and TANROADS data,
                providing real-time hotspot intelligence for authorities and the public.
              </p>
              <p>
                Every report is reviewed by traffic officers before appearing on the verified map,
                ensuring data integrity. The platform supports evidence-based decision making for
                road safety interventions, junction improvements, and targeted enforcement.
              </p>
              <div className="home-about-grid">
                <div className="home-about-stat">
                  <span className="home-about-stat-num">{stats ? formatNum(stats.total) : "0"}</span>
                  <span className="home-about-stat-label">Total Reports</span>
                </div>
                <div className="home-about-stat">
                  <span className="home-about-stat-num">{stats ? formatNum(stats.verified) : "0"}</span>
                  <span className="home-about-stat-label">Verified</span>
                </div>
                <div className="home-about-stat">
                  <span className="home-about-stat-num">{stats ? formatNum(stats.junctionCount) : "0"}</span>
                  <span className="home-about-stat-label">Junctions Tracked</span>
                </div>
                <div className="home-about-stat">
                  <span className="home-about-stat-num">5</span>
                  <span className="home-about-stat-label">Districts</span>
                </div>
              </div>
            </div>
            <div className="home-about-visual">
              <div className="home-about-card">
                <div className="home-about-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 4.5-3.5 8.5-8 9.5V12l-6-6"/><path d="M12 2a10 10 0 0 0-10 10c0 4.5 3.5 8.5 8 9.5V12l6-6"/></svg>
                </div>
                <h4>Community Powered</h4>
                <p>Citizens report incidents via mobile or web. Anonymous by default.</p>
              </div>
              <div className="home-about-card">
                <div className="home-about-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <h4>Police Verified</h4>
                <p>Traffic officers review and verify each report before it goes live.</p>
              </div>
              <div className="home-about-card">
                <div className="home-about-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
                <h4>Data Driven</h4>
                <p>Advanced analytics identify high-risk zones and peak accident periods.</p>
              </div>
              <div className="home-about-card">
                <div className="home-about-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h4>Hotspot Mapping</h4>
                <p>Interactive map with clustering, heatmap, and severity indicators.</p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* KPI Stats */}
        {stats && (
          <ScrollReveal>
            <div className="home-kpi-grid">
              {[
                { label: "Total Reports", value: stats.total, color: "#3B82F6", desc: "Crowdsourced + official" },
                { label: "Fatal Accidents", value: stats.fatal || 0, color: "#EF4444", desc: `${stats.totalFatalities || 0} lives lost` },
                { label: "Serious Injuries", value: stats.totalCasualties || 0, color: "#F59E0B", desc: "Requiring hospital care" },
                { label: "Verified Reports", value: stats.verified || 0, color: "#22C55E", desc: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% of all reports` },
                { label: "Tracked Junctions", value: stats.junctionCount || 0, color: "#8B5CF6", desc: "Across 5 districts" },
                { label: "Minor Injuries", value: Math.max(0, (stats.totalCasualties || 0) - (stats.totalFatalities || 0)), color: "#14B8A6", desc: "Non-hospital treated" },
              ].map((kpi) => (
                <div key={kpi.label} className="home-kpi-card">
                  <div className="home-kpi-top" style={{ borderTopColor: kpi.color }} />
                  <CountUp end={kpi.value} className="home-kpi-value" style={{ color: kpi.color }} />
                  <div className="home-kpi-label">{kpi.label}</div>
                  <div className="home-kpi-desc">{kpi.desc}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Map + Filters Section */}
        <ScrollReveal>
          <section id="map-section">
            <div className="home-section-header">
              <span className="home-section-badge">Interactive Map</span>
              <h2>Accident Hotspot Map</h2>
              <p>Explore verified accident reports across Dar es Salaam. Use filters to refine by date, district, severity, and more.</p>
            </div>
            <FilterBar filters={filters} onChange={setFilters} />
            {loading ? (
              <div style={{ height: 500, borderRadius: 16, background: "#E2E8F0", animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : (
              <DashboardMap
                accidents={filteredAccidents}
                selectedHour="all"
                seriousMode={false}
              />
            )}
          </section>
        </ScrollReveal>

        {/* Analytics Section */}
        <ScrollReveal>
          <section>
            <div className="home-section-header">
              <span className="home-section-badge">Analytics</span>
              <h2>Accident Statistics & Trends</h2>
              <p>Comprehensive data visualizations powered by verified police reports and citizen submissions.</p>
            </div>
            <AnalyticsDashboard
              filters={{
                from: filters.from || undefined,
                to: filters.to || undefined,
                district: filters.district || undefined,
                severity: filters.severity || undefined,
                weather: filters.weather || undefined,
                roadType: filters.roadType || undefined,
              }}
            />
          </section>
        </ScrollReveal>

        {/* Road Safety Awareness Section */}
        <ScrollReveal>
          <section className="home-awareness">
            <div className="home-awareness-header">
              <span className="home-section-badge">Awareness</span>
              <h2>Road Safety Tips</h2>
              <p>Simple actions that save lives on Dar es Salaam&apos;s roads.</p>
            </div>
            <div className="home-awareness-grid">
              <div className="home-awareness-card" style={{ borderTop: "3px solid #22C55E" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h4>Stay Alert</h4>
                <p>Always be aware of your surroundings. Avoid using mobile phones while crossing roads or driving.</p>
              </div>
              <div className="home-awareness-card" style={{ borderTop: "3px solid #3B82F6" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h4M14 10h4M6 14h2M14 14h4"/></svg>
                </div>
                <h4>Use Designated Crossings</h4>
                <p>Always use pedestrian crossings, footbridges, and designated bus stops. Never jaywalk on major roads.</p>
              </div>
              <div className="home-awareness-card" style={{ borderTop: "3px solid #F59E0B" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <h4>Helmet & Seatbelt</h4>
                <p>Bodaboda and motorcycle riders must wear helmets. All vehicle occupants must wear seatbelts at all times.</p>
              </div>
              <div className="home-awareness-card" style={{ borderTop: "3px solid #EF4444" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <h4>Follow Speed Limits</h4>
                <p>Speed is the leading cause of fatal accidents. Observe posted limits and reduce speed in built-up areas and near schools.</p>
              </div>
              <div className="home-awareness-card" style={{ borderTop: "3px solid #8B5CF6" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h4>Report Dangerous Junctions</h4>
                <p>Use our platform to report hazardous junctions, potholes, missing signage, and poor lighting near roads.</p>
              </div>
              <div className="home-awareness-card" style={{ borderTop: "3px solid #14B8A6" }}>
                <div className="home-awareness-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                </div>
                <h4>Never Drink & Drive</h4>
                <p>Alcohol impairs judgment and reaction time. Use designated drivers or public transport if you have been drinking.</p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .home-hero {
          position: relative; border-radius: 28px; overflow: hidden; margin-bottom: 48px;
          background: linear-gradient(135deg, #0B1A33 0%, #1A365D 50%, #1E3A5F 100%);
          min-height: 380px; display: flex; align-items: center;
        }
        .home-hero-overlay {
          position: absolute; inset: 0; opacity: 0.06;
          background-image: radial-gradient(circle at 25% 50%, #3B82F6 0%, transparent 60%),
            radial-gradient(circle at 75% 30%, #60A5FA 0%, transparent 50%);
        }
        .home-hero-content { position: relative; z-index: 1; padding: 56px 48px; width: 100%; }
        .home-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(59, 130, 246, 0.15); color: #93C5FD;
          padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.04em; text-transform: uppercase;
          border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 20px;
        }
        .home-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #60A5FA; }
        .home-hero-title {
          margin: 0; font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.08;
          color: #FFFFFF; letter-spacing: -0.02em; max-width: 700px;
        }
        .home-hero-sub {
          margin: 16px 0 0; font-size: clamp(15px, 1.5vw, 18px); color: #94A3B8;
          max-width: 600px; line-height: 1.6;
        }
        .home-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 28px 0; }
        .home-hero-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          color: #fff; text-decoration: none; font-size: 15px; font-weight: 700;
          padding: 14px 32px; border-radius: 12px;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
        }
        .home-hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37, 99, 235, 0.5); }
        .home-hero-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); color: #E2E8F0; text-decoration: none;
          border: 1px solid rgba(255,255,255,0.2); font-size: 15px; font-weight: 600;
          padding: 14px 28px; border-radius: 12px; backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .home-hero-btn-secondary:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }
        .home-hero-strip {
          display: flex; flex-wrap: wrap; gap: 24px; padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 13px; color: #94A3B8;
        }
        .home-hero-strip strong { color: #fff; font-weight: 700; }

        .home-section-badge {
          display: inline-block; background: #DBEAFE; color: #1D4ED8;
          padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
        }
        .home-section-header { text-align: center; margin-bottom: 32px; }
        .home-section-header h2 {
          margin: 0 0 8px; font-size: clamp(24px, 3vw, 32px); font-weight: 700; color: #0F172A;
        }
        .home-section-header p {
          margin: 0; font-size: 15px; color: #64748B; max-width: 600px; margin-inline: auto;
        }

        .home-about {
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 48px;
          padding: 48px; background: #fff; border-radius: 20px;
          border: 1px solid #E2E8F0;
        }
        .home-about-text h2 { margin: 0 0 16px; font-size: clamp(22px, 3vw, 30px); }
        .home-about-text p { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 12px; }
        .home-about-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
        .home-about-stat {
          padding: 16px; background: #F8FAFC; border-radius: 12px; text-align: center;
          border: 1px solid #E2E8F0;
        }
        .home-about-stat-num {
          display: block; font-family: "Hubot Sans","Nunito",system-ui,sans-serif;
          font-size: 28px; font-weight: 800; color: #3B82F6;
        }
        .home-about-stat-label { font-size: 12px; color: #64748B; font-weight: 600; }
        .home-about-visual { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .home-about-card {
          padding: 24px 20px; background: #F8FAFC; border-radius: 16px;
          border: 1px solid #E2E8F0; text-align: center;
        }
        .home-about-card-icon {
          width: 56px; height: 56px; border-radius: 14px; background: #EFF6FF;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
        }
        .home-about-card h4 { margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #0F172A; }
        .home-about-card p { margin: 0; font-size: 13px; color: #64748B; line-height: 1.5; }

        .home-kpi-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px; margin-bottom: 48px;
        }
        .home-kpi-card {
          background: #fff; border-radius: 16px; overflow: hidden;
          border: 1px solid #E2E8F0; padding: 24px 16px; text-align: center;
          transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.24s;
        }
        .home-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
        .home-kpi-top { height: 3px; margin: -24px -16px 20px; }
        .home-kpi-value {
          font-family: "Hubot Sans","Nunito","Quicksand",system-ui,sans-serif;
          font-size: 36px; font-weight: 800; line-height: 1;
        }
        .home-kpi-label { font-size: 15px; color: #0F172A; margin-top: 8px; font-weight: 700; }
        .home-kpi-desc { font-size: 12px; color: #94A3B8; margin-top: 4px; }

        .home-awareness { margin: 48px 0; }
        .home-awareness-header { text-align: center; margin-bottom: 32px; }
        .home-awareness-header h2 { margin: 0 0 8px; }
        .home-awareness-header p { margin: 0; color: #64748B; font-size: 15px; }
        .home-awareness-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;
        }
        .home-awareness-card {
          background: #fff; border-radius: 16px; padding: 28px 24px;
          border: 1px solid #E2E8F0; transition: transform 0.24s, box-shadow 0.24s;
        }
        .home-awareness-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
        .home-awareness-icon { margin-bottom: 16px; }
        .home-awareness-card h4 { margin: 0 0 8px; font-size: 17px; font-weight: 700; color: #0F172A; }
        .home-awareness-card p { margin: 0; font-size: 14px; color: #475569; line-height: 1.6; }

        @media (max-width: 768px) {
          .home-hero-content { padding: 32px 24px; }
          .home-hero-title { font-size: 28px; }
          .home-about { grid-template-columns: 1fr; padding: 24px; }
          .home-about-visual { grid-template-columns: repeat(2, 1fr); }
          .home-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .home-kpi-value { font-size: 28px; }
          .home-awareness-grid { grid-template-columns: 1fr; }
          .home-about-stat-num { font-size: 22px; }
        }
        @media (max-width: 480px) {
          .home-hero-content { padding: 24px 16px; }
          .home-hero-actions { flex-direction: column; }
          .home-hero-actions a { width: 100%; justify-content: center; text-align: center; }
          .home-hero-strip { flex-direction: column; gap: 8px; }
          .home-about-visual { grid-template-columns: 1fr; }
          .home-kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .home-kpi-card { padding: 16px 12px; }
          .home-kpi-value { font-size: 24px; }
          .home-about { padding: 16px; }
          .home-about-grid { grid-template-columns: 1fr 1fr; }
          .home-section-header { text-align: left; }
        }
      `}</style>
    </>
  );
}
