"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";
import { useLang } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

export default function ReportPage() {
  const { lang, setLang } = useLang();
  const _ = (key: string, fb?: string) => t(key, lang, fb);

  const [form, setForm] = useState({
    phone: "",
    firstName: "",
    lastName: "",
    severity: "minor",
    vehicleType: "car",
    casualties: 0,
    fatalities: 0,
    injuries: 0,
    description: "",
    weather: "",
    roadCondition: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "denied">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (lang === "en") setLang("sw");
  }, []);

  const handlePhotoSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { alert("JPEG, PNG, WebP, au GIF pekee ndizo zinazoruhusiwa."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Picha lazima iwe chini ya 5 MB."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      }, 100);
    } catch {
      alert("Haikuweza kufikia kamera. Tafadhali pakia picha badala yake.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        stopCamera();
      }
    }, "image/jpeg", 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", photoFile);
      fd.append("upload_preset", "darroeadsafety");
      const res = await fetch("https://api.cloudinary.com/v1_1/roougsg4/image/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) { setPhotoUrl(data.secure_url); setPhotoPreview(data.secure_url); }
      else { alert("Upakiaji umeshindwa - jaribu tena"); }
    } catch { alert("Hitilafu ya upakiaji - angalia muunganisho wako"); }
    setUploading(false);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoUrl("");
    stopCamera();
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const getGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setErrorMsg("Huduma ya mahali haitumiki kwenye kivinjari chako.");
      return;
    }
    setGpsStatus("getting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("got");
        setErrorMsg("");
      },
      (err) => {
        setGpsStatus("denied");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Ruhusa ya mahali imekataliwa. Tafadhali wezesha GPS kwenye mipangilio ya kivinjari chako.");
        } else {
          setErrorMsg("Haikuweza kupata mahali. Tafadhali wezesha GPS kwenye kifaa chako.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    getGpsLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const phone = (form.phone || "").trim();
    if (!phone) { setErrorMsg(_("report.validation.phoneRequired")); setLoading(false); return; }
    if (!photoUrl && !photoFile) { setErrorMsg(_("report.validation.photoRequired")); setLoading(false); return; }
    if (gpsStatus !== "got" || !gpsCoords) { setErrorMsg(_("report.gpsRequired")); setLoading(false); return; }
    const baseDescription = (form.description || "").trim();
    if (!baseDescription) { setErrorMsg(_("report.validation.descRequired")); setLoading(false); return; }
    if (!photoUrl && photoFile) {
      setErrorMsg("Tafadhali pakia picha kwanza.");
      setLoading(false);
      return;
    }

    const contactInfo = [phone, form.firstName, form.lastName].filter(Boolean).join(", ");
    const payload = {
      ...form,
      contact: contactInfo,
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      photoUrl,
      description: baseDescription,
      occurredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/accidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setSubmitted(true);
      else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.detail || data?.error || _("report.validation.error"));
      }
    } catch { setErrorMsg(_("report.validation.error")); }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", padding: "clamp(24px, 6vw, 48px)", borderRadius: 28, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: "#22C55E" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px, 5vw, 24px)" }}>{_("report.thankYou")}</h2>
          <p style={{ color: "#475569", marginBottom: 24, fontSize: 14 }}>{_("report.submittedMessage")}</p>
          <Link href="/" style={{ background: "#3B82F6", color: "#fff", padding: "12px 32px", borderRadius: 45, textDecoration: "none", fontWeight: 600, display: "inline-block" }}>
            {_("report.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10,
    fontSize: 16, minHeight: 48, outline: "none", width: "100%", boxSizing: "border-box",
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#334155" };
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <PremiumTopNav variant="report" />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 12px" }}>
        <div style={{ background: "#fff", padding: "clamp(20px, 4vw, 40px)", borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <img src="/accident-icon.png" alt="Ripoti" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "clamp(20px, 5vw, 28px)" }}>{_("report.formTitle")}</h2>
              <p style={{ color: "#475569", margin: "2px 0 0", fontSize: 14 }}>
                {lang === "sw" ? "Jaza fomu hii kwa usahihi. Sehemu zote zenye * zinahitajika." : "Fill this form accurately. All * fields are required."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Reporter Information */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>{_("report.reporterInfo")}</h4>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                <span style={labelStyle}>{_("report.phoneNumber")} *</span>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required placeholder="+255 712 345 678" style={inputStyle} />
              </label>
              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.firstName")}</span>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Jina la kwanza" style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.lastName")}</span>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Jina la mwisho" style={inputStyle} />
                </label>
              </div>
            </div>

            {/* GPS Location */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>{_("report.gps")}</h4>
              <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                {gpsStatus === "idle" && (
                  <button type="button" onClick={getGpsLocation} style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    {_("report.getLocation")}
                  </button>
                )}
                {gpsStatus === "getting" && (
                  <div style={{ color: "#3B82F6", fontSize: 14, fontWeight: 600 }}>{lang === "sw" ? "Inatafuta mahali..." : "Getting GPS location..."}</div>
                )}
                {gpsStatus === "got" && gpsCoords && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22C55E", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {_("report.locationCaptured")}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", display: "flex", gap: 16 }}>
                      <span>{_("report.latitude")}: {gpsCoords.lat.toFixed(6)}</span>
                      <span>{_("report.longitude")}: {gpsCoords.lng.toFixed(6)}</span>
                    </div>
                  </div>
                )}
                {gpsStatus === "denied" && (
                  <div>
                    <div style={{ color: "#DC2626", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{_("report.locationDenied")}</div>
                    <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                      {lang === "sw" ? "Tafadhali wezesha huduma za mahali kwenye mipangilio ya kivinjari chako na upakie upya ukurasa." : "Please enable location services in your browser settings and refresh the page."}
                    </p>
                    <button type="button" onClick={getGpsLocation} style={{ marginTop: 8, background: "#DC2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 40 }}>
                      {_("report.tryAgain")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accident Photos */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>{_("report.photos")} *</h4>
              {cameraActive ? (
                <div style={{ marginBottom: 12 }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: 300, borderRadius: 12, background: "#000" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={capturePhoto} style={{ background: "#22C55E", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                      {_("report.capturePhoto")}
                    </button>
                    <button type="button" onClick={stopCamera} style={{ background: "none", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                      {_("report.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={startCamera} style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    {_("report.capturePhoto")}
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "1px solid #E2E8F0", padding: "10px 20px", borderRadius: 10, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                    {_("report.uploadPhoto")}
                  </button>
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoSelect(f); }}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: "2px dashed #CBD5E1", borderRadius: 16, padding: "clamp(16px, 4vw, 32px)", textAlign: "center", cursor: "pointer", background: photoPreview ? "#F0FDF4" : "#F8FAFC" }}
              >
                {photoPreview ? (
                  <div>
                    <img src={photoPreview} alt="Onyesho" style={{ maxHeight: 180, borderRadius: 12, marginBottom: 12, maxWidth: "100%", objectFit: "cover" }} />
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {!photoUrl && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); uploadPhoto(); }} disabled={uploading}
                          style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", minHeight: 44 }}>
                          {uploading ? _("report.uploading") : _("report.uploadPhoto")}
                        </button>
                      )}
                      {photoUrl && <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 600, padding: "8px 0" }}>{_("report.photoUploaded")}</span>}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                        style={{ background: "none", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                        {_("report.removePhoto")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
                      {lang === "sw" ? "Bonyeza kuvinjari, buruta na uache picha, au tumia kitufe cha kamera hapo juu" : "Tap to browse, drag & drop a photo, or use the camera button above"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>JPEG, PNG, WebP, GIF - max 5 MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Details */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>{_("report.incidentDetails")}</h4>
              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.severity")}</span>
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} required style={inputStyle}>
                    <option value="minor">{lang === "sw" ? "Ndogo (hakuna majeraha)" : "Minor (no casualties)"}</option>
                    <option value="serious">{lang === "sw" ? "Mbaya (majeraha)" : "Serious (injury)"}</option>
                    <option value="fatal">{lang === "sw" ? "Ya Kifo (1+ vifo)" : "Fatal (1+ deaths)"}</option>
                    <option value="critical">{lang === "sw" ? "Mbaya Sana (vifo vingi)" : "Critical (multiple)"}</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{lang === "sw" ? "Aina ya Gari" : "Vehicle Type"}</span>
                  <select value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))} required style={inputStyle}>
                    <option value="motorcycle">{lang === "sw" ? "Pikipiki / Bodaboda" : "Motorcycle / Bodaboda"}</option>
                    <option value="car">{lang === "sw" ? "Gari" : "Car"}</option>
                    <option value="bus">{lang === "sw" ? "Basi / Daladala" : "Bus / Daladala"}</option>
                    <option value="truck">{lang === "sw" ? "Lori" : "Truck / Lorry"}</option>
                    <option value="bicycle">{lang === "sw" ? "Baiskeli" : "Bicycle"}</option>
                    <option value="pedestrian">{lang === "sw" ? "Mtembea kwa miguu" : "Pedestrian"}</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.injuries")}</span>
                  <input type="number" min="0" value={form.casualties} onChange={(e) => setForm((f) => ({ ...f, casualties: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.deaths")}</span>
                  <input type="number" min="0" value={form.fatalities} onChange={(e) => setForm((f) => ({ ...f, fatalities: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                </label>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>{_("report.description")}</h4>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={lang === "sw" ? "Eleza kilichotokea..." : "What happened? (English or Swahili)"} rows={3}
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 16, minHeight: 80, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />

              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.weather")}</span>
                  <input value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} placeholder={lang === "sw" ? "wazi / mvua / unyevu" : "clear / rainy / drizzle"} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{_("report.roadCondition")}</span>
                  <input value={form.roadCondition} onChange={(e) => setForm((f) => ({ ...f, roadCondition: e.target.value }))} placeholder={lang === "sw" ? "nzuri / mvua / mashimo" : "good / wet / potholed"} style={inputStyle} />
                </label>
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 12, border: "1px solid #FECACA" }}>
                {errorMsg}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)", color: "#fff", border: "none",
                padding: "14px 16px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                minHeight: 50, boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
              }}>
              {loading ? _("report.submitting") : _("report.submitReport")}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 640px) {
          .rsd-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
