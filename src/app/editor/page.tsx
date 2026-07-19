"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PremiumTopNav from "@/components/PremiumTopNav";
import { createClient } from "@/lib/supabase-browser";

interface AccidentItem {
  id: number;
  severity: string;
  district: string;
  ward: string;
  junctionName: string;
  occurredAt: string;
  reportedAt: string;
  description: string;
  photoUrl: string;
  verificationStatus: string;
  upvoteCount: number;
  vehicleTypes: string[];
  casualties: number;
  fatalities: number;
  injuries: number;
  weather: string;
  roadCondition: string;
  contact: string;
  reporterType: string;
  trustLevel: number;
}

const SEV_COLORS: Record<string, string> = {
  fatal: "#DC2626", critical: "#FBBF24", serious: "#3B82F6", minor: "#22C55E",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24", verified: "#22C55E", rejected: "#DC2626",
};
const STATUS_BG: Record<string, string> = {
  pending: "#FEF3C7", verified: "#DCFCE7", rejected: "#FEE2E2",
};

export default function EditorPage() {
  const router = useRouter();
  const [accidents, setAccidents] = useState<AccidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [filter, setFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const supabase = createClient();
      const { data: { user: su } } = await supabase.auth.getUser();
      if (!su) { router.push("/login"); return; }

      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (cancelled) return;

      setUser(data.supabaseUser);
      setRole(data.role);

      const isAuthorized = data.role === "POLICE" || data.role === "ADMIN";

      if (!isAuthorized) {
        router.push("/dashboard");
        return;
      }

      loadStats();
    };

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const url = filter === "all"
          ? "/api/accidents"
          : `/api/accidents?status=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAccidents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load accidents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [filter, refreshKey]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          pending: data.pending || 0,
          verified: data.verified || 0,
          rejected: data.rejected || 0,
        });
      }
    } catch {}
  };

  const handleVerify = useCallback(async (id: number) => {
    setActionId(id);
    setError("");
    try {
      const res = await fetch(`/api/accidents/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }
      setAccidents((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed to verify");
    } finally {
      setActionId(null);
    }
  }, []);

  const handleReject = useCallback(async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) return;

    setActionId(id);
    setError("");
    try {
      const res = await fetch(`/api/accidents/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Rejection failed");
      }
      setAccidents((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed to reject");
    } finally {
      setActionId(null);
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this accident report? This cannot be undone.")) return;

    setActionId(id);
    setError("");
    try {
      const res = await fetch(`/api/accidents/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: "Deleted by editor" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      setAccidents((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    } finally {
      setActionId(null);
    }
  }, []);

  const filtered = accidents.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.junctionName?.toLowerCase().includes(q) ||
      a.district?.toLowerCase().includes(q) ||
      a.ward?.toLowerCase().includes(q) ||
      a.contact?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      String(a.id).includes(q)
    );
  });

  const pendingCount = accidents.filter((a) => a.verificationStatus === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <PremiumTopNav variant="editor" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div className="editor-header" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 24, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F172A" }}>
              Verification Queue
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
              Verify, reject, or manage accident reports
            </p>
          </div>
          <div className="editor-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "pending", label: `Pending${stats.pending > 0 ? ` (${stats.pending})` : ""}`, bg: filter === "pending" ? "#FBBF24" : "#fff", color: filter === "pending" ? "#92400E" : "#475569" },
              { key: "verified", label: "Verified", bg: filter === "verified" ? "#22C55E" : "#fff", color: filter === "verified" ? "#fff" : "#475569" },
              { key: "rejected", label: "Rejected", bg: filter === "rejected" ? "#DC2626" : "#fff", color: filter === "rejected" ? "#fff" : "#475569" },
              { key: "all", label: "All", bg: filter === "all" ? "#3B82F6" : "#fff", color: filter === "all" ? "#fff" : "#475569" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => { setFilter(btn.key); setRefreshKey(k => k + 1); }}
                style={{
                  padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: "1px solid #E2E8F0",
                  background: btn.bg, color: btn.color,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by location, contact, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              fontSize: 14,
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 16,
            background: "#FEE2E2", color: "#DC2626", fontSize: 13, fontWeight: 500,
            border: "1px solid #FECACA",
          }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}>✕</button>
          </div>
        )}

        {!loading && (
          <div style={{
            display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap",
            padding: "12px 16px", background: "#fff", borderRadius: 12,
            border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              <strong>{filtered.length}</strong> {filtered.length === 1 ? "report" : "reports"} shown
            </div>
            {filter === "pending" && (
              <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                {pendingCount} awaiting review
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
            Loading reports...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              {filter === "pending" ? "All caught up!" : `No ${filter} reports`}
            </div>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
              {filter === "pending"
                ? "There are no pending reports to review right now."
                : `There are no reports with status "${filter}".`}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((a) => {
              const isExpanded = expandedId === a.id;
              const sevColor = SEV_COLORS[a.severity] || "#3B82F6";
              const statusColor = STATUS_COLORS[a.verificationStatus] || "#94A3B8";
              const statusBg = STATUS_BG[a.verificationStatus] || "#F1F5F9";

              return (
                <div key={a.id} className="editor-accident-card" style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid ${a.verificationStatus === "pending" ? "#FDE68A" : "#E2E8F0"}`,
                  borderLeft: `4px solid ${sevColor}`,
                  overflow: "hidden",
                }}>
                  <div className="editor-card-inner" style={{ padding: 16, display: "flex", gap: 14 }}>
                    {a.photoUrl && (
                      <div className="editor-card-photo" style={{ flexShrink: 0 }}>
                        <img
                          src={a.photoUrl}
                          alt=""
                          style={{
                            width: 100, height: 80, objectFit: "cover", borderRadius: 8,
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(a.photoUrl, "_blank")}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 999,
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          background: `${sevColor}18`, color: sevColor,
                        }}>
                          {a.severity}
                        </span>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 999,
                          fontSize: 10, fontWeight: 700,
                          background: statusBg, color: statusColor,
                        }}>
                          {a.verificationStatus === "verified" ? "Verified" :
                           a.verificationStatus === "rejected" ? "Rejected" : "Pending"}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          #{a.id}
                        </span>
                        {a.trustLevel > 0 && (
                          <span style={{ fontSize: 10, color: "#3B82F6", fontWeight: 600 }}>
                            Trust: {a.trustLevel}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>
                        {a.junctionName || "(unnamed junction)"}
                        {a.district ? `, ${a.district}` : ""}
                        {a.ward ? ` · ${a.ward}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                        {new Date(a.occurredAt).toLocaleString()}
                        {a.reportedAt && ` · reported ${new Date(a.reportedAt).toLocaleString()}`}
                      </div>

                      <div className="editor-meta" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4, fontSize: 12, color: "#475569" }}>
                        <span>{a.vehicleTypes?.join(", ") || "N/A"}</span>
                        {a.casualties > 0 && <span>{a.casualties} casualty{a.casualties !== 1 ? "ies" : ""}</span>}
                        {a.fatalities > 0 && <span style={{ color: "#DC2626", fontWeight: 600 }}>{a.fatalities} fatality{a.fatalities !== 1 ? "ies" : ""}</span>}
                        {a.injuries > 0 && <span>{a.injuries} injured</span>}
                        <span>{a.upvoteCount} applauds</span>
                        {a.contact && <span>{a.contact}</span>}
                      </div>

                      {(a.weather || a.roadCondition) && (
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                          {a.weather && a.weather}
                          {a.weather && a.roadCondition ? " · " : ""}
                          {a.roadCondition && a.roadCondition}
                        </div>
                      )}

                      {a.description && (
                        <div
                          style={{
                            fontSize: 13, color: "#475569",
                            marginTop: 4, cursor: "pointer",
                            display: isExpanded ? "block" : "-webkit-box",
                            WebkitLineClamp: isExpanded ? undefined : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        >
                          {a.description}
                          {!isExpanded && a.description.length > 100 && (
                            <span style={{ color: "#3B82F6", fontSize: 12 }}> ...more</span>
                          )}
                        </div>
                      )}

                      <div className="editor-actions" style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {a.verificationStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleVerify(a.id)}
                              disabled={actionId === a.id}
                              style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: "#22C55E", color: "#fff",
                                fontSize: 13, fontWeight: 600, cursor: "pointer",
                                opacity: actionId === a.id ? 0.7 : 1,
                              }}
                            >
                              {actionId === a.id ? "..." : "✓ Verify"}
                            </button>
                            <button
                              onClick={() => handleReject(a.id)}
                              disabled={actionId === a.id}
                              style={{
                                padding: "8px 20px", borderRadius: 8,
                                border: "1px solid #FECACA",
                                background: "#FEF2F2", color: "#DC2626",
                                fontSize: 13, fontWeight: 600, cursor: "pointer",
                                opacity: actionId === a.id ? 0.7 : 1,
                              }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {a.verificationStatus !== "pending" && (
                          <button
                            onClick={() => {
                              if (confirm(`Re-open accident #${a.id} for review?`)) {
                                handleRejectAndReopen(a.id);
                              }
                            }}
                            disabled={actionId === a.id}
                            style={{
                              padding: "8px 20px", borderRadius: 8,
                              border: "1px solid #CBD5E1",
                              background: "#F8FAFC", color: "#475569",
                              fontSize: 13, fontWeight: 600, cursor: "pointer",
                              opacity: actionId === a.id ? 0.7 : 1,
                            }}
                          >
                            Re-open
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={actionId === a.id}
                          style={{
                            padding: "8px 20px", borderRadius: 8,
                            border: "1px solid #FECACA",
                            background: "transparent", color: "#DC2626",
                            fontSize: 13, fontWeight: 500, cursor: "pointer",
                            marginLeft: "auto",
                            opacity: actionId === a.id ? 0.7 : 1,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style jsx>{`
        @media (max-width: 640px) {
          .editor-header { flex-direction: column; align-items: stretch !important; }
          .editor-filters { justify-content: center; flex-wrap: wrap; }
          .editor-filters button { flex: 1; min-width: 0; font-size: 12px !important; padding: 8px 12px !important; }
          .editor-card-inner { flex-direction: column !important; }
          .editor-card-photo { width: 100% !important; }
          .editor-card-photo img { width: 100% !important; height: 160px !important; }
          .editor-meta { gap: 6px !important; }
          .editor-actions button { flex: 1; min-width: 80px; text-align: center; }
        }
      `}</style>
    </div>
  );

  async function handleRejectAndReopen(id: number) {
    setActionId(id);
    try {
      const res = await fetch(`/api/accidents/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: "Re-opened for review" }),
      });
      if (!res.ok) throw new Error("Failed to re-open");
      setAccidents((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed to re-open");
    } finally {
      setActionId(null);
    }
  }
}