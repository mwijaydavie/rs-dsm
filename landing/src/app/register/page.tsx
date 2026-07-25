"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";
import { createClient } from "@/lib/supabase-browser";

type Role = "community" | "police" | "tanroads" | "researcher";

interface RoleConfig {
  value: Role;
  label: string;
  icon: string;
  description: string;
}

const ROLES: RoleConfig[] = [
  { value: "community", label: "Community Member", icon: "👤", description: "Report accidents, view public dashboard, and help make roads safer" },
  { value: "police", label: "Traffic Police", icon: "👮", description: "Submit official accident reports and verify community submissions" },
  { value: "tanroads", label: "TANROADS Official", icon: "🏗️", description: "Access infrastructure data, analytics, and intervention reports" },
  { value: "researcher", label: "Researcher / Transport Safety", icon: "📊", description: "Access high-level data exports and analytics dashboards" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<Role>("community");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [badgeNumber, setBadgeNumber] = useState("");
  const [station, setStation] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [institution, setInstitution] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }

    if (selectedRole === "police") {
      if (!badgeNumber.trim()) { setError("Police Badge/ID Number is required."); return; }
      if (!station.trim()) { setError("Police Station/Region is required."); return; }
    }
    if (selectedRole === "tanroads" && !employeeId.trim()) {
      setError("TANROADS Employee ID is required."); return;
    }
    if (selectedRole === "researcher" && !institution.trim()) {
      setError("Institution name is required."); return;
    }

    setLoading(true);

    try {
      const body: Record<string, any> = {
        email, password, firstName, lastName, phone,
        role: selectedRole,
      };
      if (selectedRole === "police") { body.badgeNumber = badgeNumber.trim(); body.station = station.trim(); }
      if (selectedRole === "tanroads") { body.employeeId = employeeId.trim(); }
      if (selectedRole === "researcher") { body.institution = institution.trim(); }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      if (data.session?.accessToken && data.session?.refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.accessToken,
            refresh_token: data.session.refreshToken,
          });
        } catch {}
      }

      const userData = {
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role || "community",
        isStaff: !!data.user.isStaff,
        isSuperuser: !!data.user.isSuperuser,
      };
      localStorage.setItem("rsd_user", JSON.stringify(userData));
      window.dispatchEvent(new Event("rsd:user-changed"));

      setInfo("Account created! Redirecting…");
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 600);
    } catch (err: any) {
      setError(err?.message || "Network error.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "11px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
    fontSize: 15, minHeight: 46, outline: "none", width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 };
  const roleColor = (r: Role) => {
    const colors: Record<Role, string> = { community: "#22C55E", police: "#3B82F6", tanroads: "#FBBF24", researcher: "#A855F7" };
    return colors[r];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <PremiumTopNav variant="login" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 12px 16px", flex: 1 }}>
        <div style={{
          background: "#fff", padding: "clamp(20px, 4vw, 40px)", borderRadius: 20,
          maxWidth: 520, width: "100%",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          border: "1px solid rgba(15, 23, 42, 0.04)",
        }}>
          {step === "role" ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <span style={{ fontSize: 48 }}>🚦</span>
                <h2 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Create Your Account</h2>
                <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>Select your role to get started</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {ROLES.map((r) => {
                  const active = selectedRole === r.value;
                  const accent = roleColor(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRole(r.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px", borderRadius: 14,
                        border: `2px solid ${active ? accent : "#E2E8F0"}`,
                        background: active ? `${accent}0A` : "#fff",
                        cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                        width: "100%",
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{r.description}</div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `2px solid ${active ? accent : "#CBD5E1"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setStep("form")} style={{
                width: "100%", background: roleColor(selectedRole), color: "#fff",
                border: "none", padding: "14px 16px", borderRadius: 999,
                fontSize: 16, fontWeight: 700, cursor: "pointer", minHeight: 50,
              }}>
                Continue as {ROLES.find((r) => r.value === selectedRole)?.label}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 16 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
              </p>
            </>
          ) : (
            <>
              {/* Step indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <button type="button" onClick={() => setStep("role")} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0, color: "#3B82F6",
                }}>←</button>
                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#22C55E" }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#E2E8F0" }} />
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{ROLES.find((r) => r.value === selectedRole)?.icon}</span>
                <h2 style={{ margin: "4px 0 4px", fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                  {ROLES.find((r) => r.value === selectedRole)?.label}
                </h2>
              </div>

              {error && (
                <div role="alert" style={{
                  background: "#FEE2E2", color: "#DC2626", padding: "10px 14px",
                  borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500,
                  border: "1px solid #FECACA",
                }}>{error}</div>
              )}

              {info && (
                <div role="status" style={{
                  background: "#DCFCE7", color: "#15803D", padding: "10px 14px",
                  borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500,
                  border: "1px solid #BBF7D0",
                }}>{info}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Personal Info */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={labelStyle}>First name *</span>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Your first name" style={inputStyle} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={labelStyle}>Last name</span>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" style={inputStyle} />
                  </label>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={labelStyle}>Email *</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
                  </label>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={labelStyle}>Phone (optional)</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" style={inputStyle} />
                  </label>
                </div>

                {/* Role-specific fields */}
                {selectedRole === "police" && (
                  <div style={{ marginBottom: 14, padding: 16, background: "#EFF6FF", borderRadius: 14, border: "1px solid #BFDBFE" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      👮 Police Verification
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        <span style={{ ...labelStyle, color: "#1E40AF" }}>Badge/ID Number *</span>
                        <input type="text" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required placeholder="e.g. GPN 12345" style={inputStyle} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                        <span style={{ ...labelStyle, color: "#1E40AF" }}>Station/Region *</span>
                        <input type="text" value={station} onChange={(e) => setStation(e.target.value)} required placeholder="e.g. Oysterbay Police" style={inputStyle} />
                      </label>
                    </div>
                  </div>
                )}

                {selectedRole === "tanroads" && (
                  <div style={{ marginBottom: 14, padding: 16, background: "#FFFBEB", borderRadius: 14, border: "1px solid #FDE68A" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      🏗️ TANROADS Verification
                    </p>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ ...labelStyle, color: "#B45309" }}>Employee ID *</span>
                      <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required placeholder="e.g. TR/2024/00123" style={inputStyle} />
                    </label>
                  </div>
                )}

                {selectedRole === "researcher" && (
                  <div style={{ marginBottom: 14, padding: 16, background: "#FAF5FF", borderRadius: 14, border: "1px solid #E9D5FF" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      📊 Research Institution
                    </p>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ ...labelStyle, color: "#6D28D9" }}>Institution *</span>
                      <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} required placeholder="e.g. University of Dar es Salaam" style={inputStyle} />
                    </label>
                  </div>
                )}

                {/* Password */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={labelStyle}>Password *</span>
                    <div style={{ position: "relative" }}>
                      <input type={showPassword ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" style={inputStyle} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94A3B8", padding: 4 }}>
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={labelStyle}>Confirm *</span>
                    <input type={showPassword ? "text" : "password"} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat password" style={inputStyle} />
                  </label>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", background: roleColor(selectedRole), color: "#fff",
                  border: "none", padding: "14px 16px", borderRadius: 999,
                  fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1, minHeight: 50, marginTop: 8,
                }}>
                  {loading ? "Creating Account…" : "Create Account"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 14 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
