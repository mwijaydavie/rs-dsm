"use client";

import { useEffect, useState } from "react";

export type ExportStatus = "all" | "pending" | "verified" | "rejected";

export interface CustomExportFilters {
  from: string;
  to: string;
  district: string;
  severity: string[];
  vehicle: string[];
  status: ExportStatus;
}

interface CustomExportModalProps {
  onClose: () => void;
  onSubmit: (filters: CustomExportFilters, format: "pdf" | "xlsx") => void;
  loading: null | "pdf-custom" | "xlsx-custom";
}

const DISTRICTS = ["Ilala", "Kinondoni", "Ubungo", "Temeke", "Kigamboni"];
const SEVERITIES: { value: string; label: string; color: string }[] = [
  { value: "fatal", label: "Fatal", color: "#F87171" },
  { value: "critical", label: "Critical", color: "#FBBF24" },
  { value: "serious", label: "Serious", color: "#3B82F6" },
  { value: "minor", label: "Minor", color: "#22C55E" },
];
const VEHICLES = [
  "motorcycle",
  "car",
  "bus",
  "truck",
  "bicycle",
  "pedestrian",
];
const STATUSES: { value: ExportStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);
const yearAgoIso = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

export function CustomExportModal({
  onClose,
  onSubmit,
  loading,
}: CustomExportModalProps) {
  const [filters, setFilters] = useState<CustomExportFilters>({
    from: yearAgoIso(),
    to: todayIso(),
    district: "",
    severity: [],
    vehicle: [],
    status: "all",
  });
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  // Live count whenever the filter changes
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setCounting(true);
      try {
        const params = new URLSearchParams();
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.district) params.set("district", filters.district);
        if (filters.severity.length)
          params.set("severity", filters.severity.join(","));
        if (filters.vehicle.length)
          params.set("vehicle", filters.vehicle.join(","));
        if (filters.status && filters.status !== "all")
          params.set("status", filters.status);
        const res = await fetch(
          `/api/accidents/export?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("count failed");
        const body = await res.json();
        // Guard against API returning an error object instead of ExportResponse
        if (!body || typeof body !== "object" || body.error) {
          throw new Error(body?.error || "API returned an error");
        }
        setCount(body.count ?? 0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setCount(null);
        }
      } finally {
        setCounting(false);
      }
    };
    // Debounce 250ms
    const t = setTimeout(run, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [filters]);

  const toggleSeverity = (v: string) => {
    setFilters((f) => ({
      ...f,
      severity: f.severity.includes(v)
        ? f.severity.filter((x) => x !== v)
        : [...f.severity, v],
    }));
  };
  const toggleVehicle = (v: string) => {
    setFilters((f) => ({
      ...f,
      vehicle: f.vehicle.includes(v)
        ? f.vehicle.filter((x) => x !== v)
        : [...f.vehicle, v],
    }));
  };

  const submitDisabled = count === 0 || loading !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          width: "min(640px, 92vw)",
          maxHeight: "92vh",
          overflow: "auto",
          boxShadow: "0 24px 60px rgba(15,23,42,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 12px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>
              Custom export
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#64748B",
              }}
            >
              Pick the filters. We will build the file and download it for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              color: "#64748B",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 22px", display: "grid", gap: 16 }}>
          <FieldRow>
            <Field label="From">
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
                style={inputStyle}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
                style={inputStyle}
              />
            </Field>
            <Field label="District">
              <select
                value={filters.district}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, district: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="">All districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <Field label="Severity">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SEVERITIES.map((s) => {
                const active = filters.severity.includes(s.value);
                return (
                  <Chip
                    key={s.value}
                    active={active}
                    color={s.color}
                    onClick={() => toggleSeverity(s.value)}
                  >
                    {s.label}
                  </Chip>
                );
              })}
            </div>
          </Field>

          <Field label="Vehicle">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {VEHICLES.map((v) => {
                const active = filters.vehicle.includes(v);
                return (
                  <Chip
                    key={v}
                    active={active}
                    onClick={() => toggleVehicle(v)}
                    textTransform="capitalize"
                  >
                    {v}
                  </Chip>
                );
              })}
            </div>
          </Field>

          <Field label="Verification status">
            <div style={{ display: "flex", gap: 6 }}>
              {STATUSES.map((s) => {
                const active = filters.status === s.value;
                return (
                  <Chip
                    key={s.value}
                    active={active}
                    onClick={() =>
                      setFilters((f) => ({ ...f, status: s.value }))
                    }
                  >
                    {s.label}
                  </Chip>
                );
              })}
            </div>
          </Field>

          <div
            style={{
              padding: "10px 12px",
              background: count === 0 ? "#FEF2F2" : "#F1F5F9",
              borderRadius: 8,
              fontSize: 13,
              color: count === 0 ? "#B91C1C" : "#0F172A",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {counting ? (
              <span>Counting matches…</span>
            ) : count === null ? (
              <span>Adjust the filters to see a count.</span>
            ) : count === 0 ? (
              <span>
                No incidents match the current filter. Adjust the dates or pick a
                wider district.
              </span>
            ) : (
              <span>
                <strong>{count.toLocaleString()}</strong> incident
                {count === 1 ? "" : "s"} will be exported.
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 22px 18px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #1E3A5F",
              background: "transparent",
              color: "#1E3A5F",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(filters, "xlsx")}
            disabled={submitDisabled}
            style={ctaStyle("#1E3A5F", submitDisabled)}
          >
            {loading === "xlsx-custom" ? "Building workbook…" : "Export Excel"}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(filters, "pdf")}
            disabled={submitDisabled}
            style={ctaStyle("#0F172A", submitDisabled)}
          >
            {loading === "pdf-custom" ? "Generating PDF…" : "Export PDF"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .rsd-field-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "8px 10px",
  border: "1px solid #CBD5E1",
  borderRadius: 6,
  background: "#FFFFFF",
  color: "#0F172A",
  fontFamily: "inherit",
};

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rsd-field-row"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "#64748B",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
  textTransform,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
  textTransform?: "capitalize";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 999,
        border: active
          ? `1px solid ${color ?? "#2563EB"}`
          : "1px solid #CBD5E1",
        background: active ? (color ?? "#2563EB") : "#FFFFFF",
        color: active ? "#FFFFFF" : "#0F172A",
        cursor: "pointer",
        textTransform: textTransform,
        transition: "background 120ms, color 120ms",
      }}
    >
      {children}
    </button>
  );
}

function ctaStyle(bg: string, disabled: boolean): React.CSSProperties {
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
  };
}
