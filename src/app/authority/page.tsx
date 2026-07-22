"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PremiumTopNav from "@/components/PremiumTopNav";
import { createClient } from "@/lib/supabase-browser";

interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  profile: {
    role: string;
    phone: string;
    supabaseUid: string | null;
  } | null;
}

interface Stats {
  total: number;
  fatal: number;
  serious: number;
  minor: number;
  critical: number;
  verified: number;
  pending: number;
  rejected: number;
  totalFatalities: number;
  totalCasualties: number;
  junctionCount: number;
  severity: Record<string, number>;
  vehicles: Record<string, number>;
  monthly: { month: string; count: number }[];
}

export default function AuthorityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "", password: "", firstName: "", lastName: "", role: "POLICE",
    phone: "", badgeNumber: "", station: "", employeeId: "",
  });
  const [creating, setCreating] = useState(false);

  // Load stats
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 403) {
          setError("You don't have permission to manage users.");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
  }, [activeTab, loadUsers]);

  const handleRoleChange = async (userId: number, role: string) => {
    setActionId(userId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "update_role", role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
      setSuccess(`User role updated to ${role}`);
      loadUsers();
    } catch (e: any) {
      setError(e?.message || "Failed to update role");
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (userId: number, currentValue: boolean) => {
    setActionId(userId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "update_flags",
          isActive: !currentValue,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      setSuccess(`User ${!currentValue ? "activated" : "deactivated"}`);
      loadUsers();
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setActionId(null);
    }
  };

  const handleCreateUser = async () => {
    setError("");
    setSuccess("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...createForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      setSuccess(`User ${createForm.email} created successfully`);
      setShowCreateForm(false);
      setCreateForm({ email: "", password: "", firstName: "", lastName: "", role: "POLICE", phone: "", badgeNumber: "", station: "", employeeId: "" });
      loadUsers();
    } catch (e: any) {
      setError(e?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const sevColors: Record<string, string> = {
    fatal: "#DC2626", critical: "#FBBF24", serious: "#3B82F6", minor: "#22C55E",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <PremiumTopNav variant="authority" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F172A" }}>
            Authority Console
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
            Full system administration — manage users, roles, and reports
          </p>
        </div>

        {/* Tab bar */}
        <div className="rsd-auth-tabs" style={{
          display: "flex", gap: 4, marginBottom: 24,
          background: "#F1F5F9", borderRadius: 12, padding: 4,
        }}>
          {[
            { key: "overview", label: "Overview", icon: "" },
            { key: "users", label: "Users", icon: "" },
            { key: "reports", label: "Reports", icon: "" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                padding: "10px 20px",
                border: "none",
                borderRadius: 10,
                background: activeTab === tab.key ? "#fff" : "transparent",
                color: activeTab === tab.key ? "#0F172A" : "#64748B",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: activeTab === tab.key ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error/Success banners */}
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
        {success && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 16,
            background: "#DCFCE7", color: "#15803D", fontSize: 13, fontWeight: 500,
            border: "1px solid #BBF7D0",
          }}>
            {success}
            <button onClick={() => setSuccess("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#15803D" }}>✕</button>
          </div>
        )}

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <>
            {stats && (
              <>
                {/* KPI Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 16, marginBottom: 32,
                }}>
                  {[
                    { label: "Total Reports", value: stats.total, color: "#3B82F6" },
                    { label: "Verified", value: stats.verified, color: "#22C55E" },
                    { label: "Pending Review", value: stats.pending, color: "#FBBF24" },
                    { label: "Rejected", value: stats.rejected || 0, color: "#DC2626" },
                    { label: "Fatal", value: stats.fatal, color: "#DC2626" },
                    { label: "Total Fatalities", value: stats.totalFatalities, color: "#DC2626" },
                    { label: "Total Casualties", value: stats.totalCasualties, color: "#F87171" },
                    { label: "Tracked Junctions", value: stats.junctionCount, color: "#A855F7" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{
                      background: "#fff", padding: 20, borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      borderTop: `3px solid ${kpi.color}`,
                    }}>
                      <div style={{
                        fontFamily: '"Hubot Sans","Nunito","Quicksand",system-ui,sans-serif',
                        fontSize: 28, fontWeight: 800, color: kpi.color,
                      }}>
                        {kpi.value}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginTop: 4 }}>
                        {kpi.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Severity + Vehicle charts */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 16, marginBottom: 32,
                }}>
                  <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Severity Distribution</h3>
                    {Object.entries(stats.severity).map(([sev, count]) => (
                      <div key={sev} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 2 }}>
                          <span style={{ textTransform: "capitalize" }}>{sev}</span>
                          <span style={{ fontWeight: 700 }}>{count}</span>
                        </div>
                        <div style={{ height: 10, background: "#E2E8F0", borderRadius: 999 }}>
                          <div style={{
                            width: `${(count / stats.total) * 100}%`, height: "100%",
                            background: sevColors[sev] || "#3B82F6", borderRadius: 999,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Vehicle Types</h3>
                    {Object.entries(stats.vehicles).map(([v, count]) => (
                      <div key={v} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 2 }}>
                          <span style={{ textTransform: "capitalize" }}>{v}</span>
                          <span style={{ fontWeight: 700 }}>{count}</span>
                        </div>
                        <div style={{ height: 10, background: "#E2E8F0", borderRadius: 999 }}>
                          <div style={{
                            width: `${(count / stats.total) * 100}%`, height: "100%",
                            background: "#A855F7", borderRadius: 999,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {stats.monthly.length > 0 && (
                    <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Monthly Reports</h3>
                      {stats.monthly.slice(-6).map((m) => (
                        <div key={m.month} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 2 }}>
                            <span>{m.month}</span>
                            <span style={{ fontWeight: 700 }}>{m.count}</span>
                          </div>
                          <div style={{ height: 8, background: "#E2E8F0", borderRadius: 999 }}>
                            <div style={{
                              width: `${Math.min(100, (m.count / Math.max(...stats.monthly.map((x) => x.count))) * 100)}%`,
                              height: "100%", background: "#3B82F6", borderRadius: 999,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0",
                  padding: 24, marginBottom: 32,
                }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Quick Actions</h3>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActiveTab("users")}
                      style={{
                        padding: "12px 24px", borderRadius: 10,
                        background: "#3B82F6", color: "#fff", border: "none",
                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Manage Users
                    </button>
                    <button
                      onClick={() => setActiveTab("reports")}
                      style={{
                        padding: "12px 24px", borderRadius: 10,
                        background: "#FBBF24", color: "#92400E", border: "none",
                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Review Reports
                    </button>
                    <a
                      href="/editor"
                      style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "12px 24px", borderRadius: 10,
                        background: "#F1F5F9", color: "#475569",
                        textDecoration: "none", fontSize: 14, fontWeight: 600,
                      }}
                    >
                      Open Editor Queue →
                    </a>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #E2E8F0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  User Management
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748B" }}>
                  {users.length} user{users.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: "#22C55E", color: "#fff",
                    border: "none", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Create User
                </button>
                <button
                  onClick={loadUsers}
                  disabled={userLoading}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: "#F1F5F9", color: "#475569",
                    border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {userLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {userLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No users found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>User</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Email</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Role</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569" }}>Active</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const currentRole = u.profile?.role || "ADMIN";
                      const roleColor = currentRole === "ADMIN" ? "#DC2626" : currentRole === "POLICE" ? "#3B82F6" : "#FBBF24";
                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#0F172A" }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>{u.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{u.role}</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <select
                              value={currentRole}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={actionId === u.id}
                              style={{
                                padding: "6px 10px", borderRadius: 8,
                                border: "1px solid #E2E8F0", fontSize: 12,
                                background: "#fff", cursor: "pointer",
                                fontWeight: 700,
                                color: roleColor,
                              }}
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="POLICE">Police</option>
                              <option value="TANROADS">TANROADS</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              disabled={actionId === u.id}
                              style={{
                                padding: "4px 12px", borderRadius: 999,
                                border: "none", fontSize: 11, fontWeight: 700,
                                cursor: "pointer",
                                background: u.isActive ? "#DCFCE7" : "#FEE2E2",
                                color: u.isActive ? "#166534" : "#DC2626",
                              }}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#94A3B8", fontSize: 11 }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== CREATE USER FORM ===== */}
        {showCreateForm && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: 32,
              maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(15,23,42,0.2)",
              maxHeight: "90vh", overflowY: "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create User</h3>
                <button onClick={() => setShowCreateForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                <input placeholder="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input placeholder="First Name" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                  <input placeholder="Last Name" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                </div>
                <input placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: "#fff" }}>
                  <option value="POLICE">Police</option>
                  <option value="TANROADS">TANROADS</option>
                </select>
                {createForm.role === "POLICE" && (
                  <>
                    <input placeholder="Badge Number" value={createForm.badgeNumber} onChange={(e) => setCreateForm({ ...createForm, badgeNumber: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                    <input placeholder="Station" value={createForm.station} onChange={(e) => setCreateForm({ ...createForm, station: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                  </>
                )}
                {createForm.role === "TANROADS" && (
                  <input placeholder="Employee ID" value={createForm.employeeId} onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }} />
                )}
                <button
                  onClick={handleCreateUser}
                  disabled={creating || !createForm.email || !createForm.password}
                  style={{
                    padding: "12px", borderRadius: 10, border: "none",
                    background: "#3B82F6", color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", opacity: creating || !createForm.email || !createForm.password ? 0.6 : 1,
                    marginTop: 8,
                  }}
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== REPORTS TAB ===== */}
        {activeTab === "reports" && (
          <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0",
            padding: 24, textAlign: "center",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
              Report Management
            </h3>
            <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 20px" }}>
              Use the full-featured editor queue to verify, reject, and manage accident reports.
            </p>
            <a
              href="/editor"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                borderRadius: 999,
                background: "#3B82F6",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Open Editor Queue →
            </a>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 640px) {
          .rsd-auth-tabs { flex-direction: column !important; }
          .rsd-auth-tabs button { font-size: 13px !important; padding: 10px 16px !important; }
          main { padding: 16px 12px !important; }
          .rsd-auth-tabs + div table { font-size: 12px !important; }
          .rsd-auth-tabs + div th, .rsd-auth-tabs + div td { padding: 8px 10px !important; }
        }
      `}</style>
    </div>
  );
}