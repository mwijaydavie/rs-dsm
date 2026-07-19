"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PremiumTopNav from "@/components/PremiumTopNav";

export default function ReportPage() {
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
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "got" | "denied">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handlePhotoSelect = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { alert("Only JPEG, PNG, WebP, or GIF photos allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5 MB."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Could not access camera. Please upload a photo instead.");
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
      else { alert("Upload failed - try again"); }
    } catch { alert("Upload error - check your connection"); }
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
      setErrorMsg("Geolocation is not supported by your browser.");
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
          setErrorMsg("Location access denied. Please enable GPS in your browser settings and refresh.");
        } else {
          setErrorMsg("Could not get location. Please enable GPS on your device.");
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
    if (!phone) { setErrorMsg("Phone number is required."); setLoading(false); return; }

    if (!photoUrl && !photoFile) { setErrorMsg("Photo evidence is required. Please capture or upload a photo."); setLoading(false); return; }

    if (gpsStatus !== "got" || !gpsCoords) { setErrorMsg("GPS location is required. Please enable location services."); setLoading(false); return; }

    const baseDescription = (form.description || "").trim();
    if (!baseDescription) { setErrorMsg("Please describe what happened."); setLoading(false); return; }

    if (!photoUrl && photoFile) {
      setErrorMsg("Please upload the photo first.");
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
        setErrorMsg(data?.detail || data?.error || "Failed to submit report");
      }
    } catch { setErrorMsg("Network error - please check your connection and try again."); }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", padding: "clamp(24px, 6vw, 48px)", borderRadius: 28, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", maxWidth: 400, width: "100%" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>Thank You</div>
          <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px, 5vw, 24px)" }}>Report Submitted</h2>
          <p style={{ color: "#475569", marginBottom: 24, fontSize: 14 }}>Thank you for helping make Dar es Salaam safer. A traffic officer will review your report.</p>
          <Link href="/" style={{ background: "#3B82F6", color: "#fff", padding: "12px 32px", borderRadius: 45, textDecoration: "none", fontWeight: 600, display: "inline-block" }}>
            Back to Home
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
            <img src="/accident-icon.png" alt="Report" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "clamp(20px, 5vw, 28px)" }}>Report an Accident</h2>
              <p style={{ color: "#475569", margin: "2px 0 0", fontSize: 14 }}>Swahili or English - either is fine.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Reporter Information - Phone Number FIRST */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>Reporter Information</h4>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                <span style={labelStyle}>Phone Number *</span>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required placeholder="+255 712 345 678"
                  style={inputStyle}
                />
              </label>
              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>First Name</span>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Your first name" style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Last Name</span>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Your last name" style={inputStyle} />
                </label>
              </div>
            </div>

            {/* GPS Location */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>Location</h4>
              <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                {gpsStatus === "idle" && (
                  <button type="button" onClick={getGpsLocation} style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    Get My Location
                  </button>
                )}
                {gpsStatus === "getting" && (
                  <div style={{ color: "#3B82F6", fontSize: 14, fontWeight: 600 }}>Getting GPS location...</div>
                )}
                {gpsStatus === "got" && gpsCoords && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22C55E", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      Location captured
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Lat: {gpsCoords.lat.toFixed(6)}, Lng: {gpsCoords.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                {gpsStatus === "denied" && (
                  <div>
                    <div style={{ color: "#DC2626", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Location access required</div>
                    <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                      Please enable location services in your browser settings and refresh the page.
                    </p>
                    <button type="button" onClick={getGpsLocation} style={{ marginTop: 8, background: "#DC2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 40 }}>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Evidence - REQUIRED */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>Photo Evidence *</h4>
              {cameraActive ? (
                <div style={{ marginBottom: 12 }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: 300, borderRadius: 12, background: "#000" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={capturePhoto} style={{ background: "#22C55E", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                      Capture Photo
                    </button>
                    <button type="button" onClick={stopCamera} style={{ background: "none", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={startCamera} style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    Capture Photo
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "1px solid #E2E8F0", padding: "10px 20px", borderRadius: 10, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                    Upload Photo
                  </button>
                </div>
              )}
              <input
                type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoSelect(f); }}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: "2px dashed #CBD5E1", borderRadius: 16, padding: "clamp(16px, 4vw, 32px)", textAlign: "center", cursor: "pointer", background: photoPreview ? "#F0FDF4" : "#F8FAFC" }}
              >
                {photoPreview ? (
                  <div>
                    <img src={photoPreview} alt="Preview" style={{ maxHeight: 180, borderRadius: 12, marginBottom: 12, maxWidth: "100%", objectFit: "cover" }} />
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {!photoUrl && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); uploadPhoto(); }} disabled={uploading}
                          style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", minHeight: 44 }}>
                          {uploading ? "Uploading..." : "Upload Photo"}
                        </button>
                      )}
                      {photoUrl && <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 600, padding: "8px 0" }}>Photo uploaded</span>}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                        style={{ background: "none", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", minHeight: 44 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>Tap to browse, drag & drop a photo, or use the camera button above</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>JPEG, PNG, WebP, GIF - max 5 MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Details */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>Incident Details</h4>
              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Severity</span>
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} required style={inputStyle}>
                    <option value="minor">Minor (no casualties)</option>
                    <option value="serious">Serious (injury)</option>
                    <option value="fatal">Fatal (1+ deaths)</option>
                    <option value="critical">Critical (multiple)</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Vehicle Type</span>
                  <select value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))} required style={inputStyle}>
                    <option value="motorcycle">Motorcycle / Bodaboda</option>
                    <option value="car">Car</option>
                    <option value="bus">Bus / Daladala</option>
                    <option value="truck">Truck / Lorry</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="pedestrian">Pedestrian</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Casualties</span>
                  <input type="number" min="0" value={form.casualties} onChange={(e) => setForm((f) => ({ ...f, casualties: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Fatalities</span>
                  <input type="number" min="0" value={form.fatalities} onChange={(e) => setForm((f) => ({ ...f, fatalities: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                </label>
              </div>
            </div>

            {/* Description - No emojis */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={sectionTitle}>Description</h4>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What happened? (English or Swahili)" rows={3}
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 16, minHeight: 80, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />

              <div className="rsd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Weather</span>
                  <input value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} placeholder="clear / rainy / drizzle" style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Road Condition</span>
                  <input value={form.roadCondition} onChange={(e) => setForm((f) => ({ ...f, roadCondition: e.target.value }))} placeholder="good / wet / potholed" style={inputStyle} />
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
                width: "100%", background: "#3B82F6", color: "#fff", border: "none",
                padding: "14px 16px", borderRadius: 999, fontSize: 16, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                minHeight: 50,
              }}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 640px) {
          .rsd-grid-2 { grid-template-columns: 1fr !important; }
          .rsd-full-mobile { grid-column: span 1 !important; }
        }
      `}</style>
    </div>
  );
}
