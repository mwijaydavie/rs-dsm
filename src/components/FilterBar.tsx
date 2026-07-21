"use client";

import { useState } from "react";

export interface FilterState {
  from: string; to: string; year: string; month: string;
  district: string; ward: string; severity: string;
  weather: string; roadType: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const DISTRICTS = ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni", "Kisarawe"];
const SEVERITIES = ["fatal", "critical", "serious", "minor"];
const WEATHERS = ["Clear", "Rainy", "Cloudy", "Foggy", "Windy"];
const ROAD_TYPES = ["Tarmac", "Gravel", "Earth", "Highway", "Urban"];

const selectStyle: React.CSSProperties = {
  padding: "6px 10px", border: "1px solid #E2E8F0", borderRadius: 8,
  fontSize: 12, minHeight: 34, background: "#fff", minWidth: 110,
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
  const clear = () => onChange({ from: "", to: "", year: "", month: "", district: "", ward: "", severity: "", weather: "", roadType: "" });

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", marginBottom: 24, alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Filters {activeCount > 0 && <span style={{ color: "#3B82F6" }}>({activeCount})</span>}
      </span>

      <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} style={selectStyle} title="From" />
      <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} style={selectStyle} title="To" />

      <select value={filters.district} onChange={(e) => set("district", e.target.value)} style={selectStyle}>
        <option value="">All Districts</option>
        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <select value={filters.severity} onChange={(e) => set("severity", e.target.value)} style={selectStyle}>
        <option value="">All Severity</option>
        {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>

      <select value={filters.weather} onChange={(e) => set("weather", e.target.value)} style={selectStyle}>
        <option value="">All Weather</option>
        {WEATHERS.map((w) => <option key={w} value={w}>{w}</option>)}
      </select>

      <select value={filters.roadType} onChange={(e) => set("roadType", e.target.value)} style={selectStyle}>
        <option value="">All Road Types</option>
        {ROAD_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      {activeCount > 0 && (
        <button onClick={clear} style={{ fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
          Clear All
        </button>
      )}
    </div>
  );
}
