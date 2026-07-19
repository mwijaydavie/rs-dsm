"use client";

import { useState } from "react";
import { CustomExportModal, CustomExportFilters } from "./CustomExportModal";

interface ExportBarProps {
  accidentCount: number;
  selectedHour: string;
  onOpenCustom?: (kind: "pdf" | "xlsx") => void;
}

type LoadingKind = null | "pdf-quick" | "xlsx-quick" | "pdf-custom" | "xlsx-custom";

export function ExportBar({
  accidentCount,
  selectedHour,
}: ExportBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  // "pdf-quick" | "xlsx-quick" — top-bar buttons (full dataset, default filters)
  // "pdf-custom" | "xlsx-custom" — modal-triggered custom filtered exports
  const [loading, setLoading] = useState<"pdf-quick" | "xlsx-quick" | "pdf-custom" | "xlsx-custom" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const disabled = accidentCount === 0 || loading !== null;

  const handleQuickExport = async (format: "pdf" | "xlsx") => {
    setLoading(format === "pdf" ? "pdf-quick" : "xlsx-quick");
    setNotice(null);
    try {
      const params = new URLSearchParams();
      // Export ALL incidents visible in the dashboard — don't filter by
      // verification status since the dashboard shows all statuses.
      // The old default of "status=verified" caused "No incidents match"
      // when incidents in view have mixed statuses.
      const url = `/api/accidents/export?${params.toString()}`;
      await runExport(url, format, (filename) => {
        setNotice(`Downloaded ${filename}`);
      });
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === "empty") {
        setNotice("No incidents match the current filter.");
      } else {
        setNotice(msg);
      }
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleCustomExport = async (
    filters: CustomExportFilters,
    format: "pdf" | "xlsx"
  ) => {
    setLoading(format === "pdf" ? "pdf-custom" : "xlsx-custom");
    setNotice(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.district) params.set("district", filters.district);
      if (filters.severity.length) params.set("severity", filters.severity.join(","));
      if (filters.vehicle.length) params.set("vehicle", filters.vehicle.join(","));
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      const url = `/api/accidents/export?${params.toString()}`;
      await runExport(url, format, (filename) => {
        setNotice(`Downloaded ${filename}`);
        setModalOpen(false);
      });
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === "empty") {
        setNotice("No incidents match those filters. Try a bigger date range.");
      } else {
        setNotice(msg.startsWith("Export") || msg.startsWith("Couldn't") ? msg : `Export failed: ${msg}`);
      }
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="rsd-export-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        marginBottom: 16,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: disabled ? "#94A3B8" : "#22C55E",
          }}
        />
        <strong
          style={{
            fontSize: 12,
            color: "#0F172A",
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          Export
        </strong>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          {accidentCount} incident{accidentCount === 1 ? "" : "s"} in view
        </span>
      </div>

      <div className="rsd-export-spacer" style={{ flex: 1 }} />

      {notice && (
        <span
          style={{
            fontSize: 12,
            color: notice.startsWith("Couldn't") ? "#B91C1C" : "#0F172A",
            background: notice.startsWith("Couldn't") ? "#FEF2F2" : "#F1F5F9",
            padding: "4px 10px",
            borderRadius: 6,
          }}
        >
          {notice}
        </span>
      )}

      <button
        type="button"
        onClick={() => handleQuickExport("pdf")}
        disabled={disabled}
        title={
          accidentCount === 0
            ? "No incidents match the current filter"
            : "Download the current view as PDF"
        }
        style={btnStyle("#0F172A", disabled)}
        className="rsd-export-btn-mobile"
      >
        <span className="rsd-export-icon" style={{ fontSize: 14, fontWeight: 700 }}>PDF</span>
        <span className="rsd-export-label">{loading === "pdf-quick" ? "Gen…" : ""}</span>
      </button>

      <button
        type="button"
        onClick={() => handleQuickExport("xlsx")}
        disabled={disabled}
        title={
          accidentCount === 0
            ? "No incidents match the current filter"
            : "Download the current view as Excel"
        }
        style={btnStyle("#1E3A5F", disabled, true)}
        className="rsd-export-btn-mobile"
      >
        <span className="rsd-export-icon" style={{ fontSize: 14, fontWeight: 700 }}>XLSX</span>
        <span className="rsd-export-label">{loading === "xlsx-quick" ? "Build…" : ""}</span>
      </button>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={loading !== null}
        style={btnStyle("#2563EB", false, true, true)}
        className="rsd-export-btn-mobile"
      >
        <span className="rsd-export-icon" style={{ fontSize: 14, fontWeight: 700 }}>Custom</span>
        <span className="rsd-export-label"></span>
      </button>

      {modalOpen && (
        <CustomExportModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleCustomExport}
          loading={loading === "pdf-custom" || loading === "xlsx-custom" ? loading : null}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .rsd-export-bar { flex-wrap: wrap; gap: 6px !important; padding: 8px 10px !important; }
          .rsd-export-bar button { flex: 1; min-width: 0; text-align: center; padding: 8px 6px !important; font-size: 11px !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 2px !important; }
          .rsd-export-icon { font-size: 11px !important; }
          .rsd-export-label { font-size: 9px !important; white-space: nowrap; }
          .rsd-export-spacer { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function btnStyle(
  bg: string,
  disabled: boolean,
  outline = false,
  primary = false
): React.CSSProperties {
  if (outline) {
    return {
      fontSize: 13,
      fontWeight: 600,
      padding: "8px 14px",
      borderRadius: 8,
      border: primary ? "1px solid #2563EB" : "1px solid #1E3A5F",
      background: "transparent",
      color: primary ? "#2563EB" : "#1E3A5F",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background 120ms, color 120ms",
    };
  }
  return {
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid transparent",
    background: bg,
    color: "#FFFFFF",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "transform 120ms, box-shadow 120ms",
    boxShadow: disabled ? "none" : "0 1px 2px rgba(15,23,42,0.15)",
  };
}

// Run the export pipeline: fetch → build → download.
async function runExport(
  url: string,
  format: "pdf" | "xlsx",
  onDownloaded: (filename: string) => void
) {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `Export API returned ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) detail = errBody.error;
      if (errBody?.detail) detail += `: ${errBody.detail}`;
    } catch {}
    throw new Error(detail);
  }
  const body = await res.json();

  // Check if the API returned an error object instead of a valid ExportResponse
  if (!body || typeof body !== "object" || body.error) {
    throw new Error(body?.error || body?.detail || "Export API returned an unexpected response");
  }

  if (body.count === 0) {
    onDownloaded(""); // no-op; parent will show "no incidents"
    throw new Error("empty");
  }

  const today = new Date().toISOString().slice(0, 10);
  const base = `road-safety-dar-incidents-${today}`;

  if (format === "pdf") {
    const { buildPdf, downloadPdf } = await import("@/lib/export/pdf");
    const doc = buildPdf(body);
    const filename = `${base}.pdf`;
    downloadPdf(doc, filename);
    onDownloaded(filename);
  } else {
    const { buildWorkbook, downloadWorkbook } = await import("@/lib/export/excel");
    const wb = buildWorkbook(body);
    const filename = `${base}.xlsx`;
    downloadWorkbook(wb, filename);
    onDownloaded(filename);
  }
}
