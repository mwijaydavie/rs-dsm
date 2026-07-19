// Pure functions for computing summary stats from a list of accidents.
// No I/O. Side-effect free. Used by both the PDF and Excel exporters.

import {
  ExportAccident,
  ExportStats,
  SEVERITY_ORDER,
} from "./types";

export function summarize(incidents: ExportAccident[]): ExportStats {
  const total = incidents.length;
  const fatalities = incidents.reduce((s, a) => s + (a.fatalities || 0), 0);
  const casualties = incidents.reduce((s, a) => s + (a.casualties || 0), 0);

  // Severity breakdown — preserve canonical order: fatal → critical → serious → minor.
  const sevCounts = new Map<string, number>();
  for (const a of incidents) {
    const s = (a.severity || "unknown").toLowerCase();
    sevCounts.set(s, (sevCounts.get(s) ?? 0) + 1);
  }
  const severityOrder = [...SEVERITY_ORDER, "unknown"];
  const seen = new Set<string>();
  const severityBreakdown: { severity: string; count: number; pct: number }[] = [];
  for (const s of severityOrder) {
    if (seen.has(s)) continue;
    seen.add(s);
    const c = sevCounts.get(s) ?? 0;
    if (c > 0) {
      severityBreakdown.push({
        severity: s,
        count: c,
        pct: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
      });
    }
  }
  // Any leftover severities not in the canonical order
  for (const [s, c] of Array.from(sevCounts)) {
    if (!seen.has(s)) {
      severityBreakdown.push({
        severity: s,
        count: c,
        pct: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
      });
    }
  }

  // Top junctions
  const junctionMap = new Map<
    string,
    { district: string; incidents: number; fatalities: number }
  >();
  for (const a of incidents) {
    const key = a.junctionName || "(unspecified)";
    if (!junctionMap.has(key)) {
      junctionMap.set(key, {
        district: a.district || "",
        incidents: 0,
        fatalities: 0,
      });
    }
    const row = junctionMap.get(key)!;
    row.incidents += 1;
    row.fatalities += a.fatalities || 0;
  }
  const topJunctions = Array.from(Array.from(junctionMap.entries()))
    .map(([junction, v]) => ({ junction, ...v }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 10);

  // Top vehicles — vehicleTypes is an array per incident
  const vehicleMap = new Map<string, number>();
  for (const a of incidents) {
    for (const v of a.vehicleTypes ?? []) {
      if (!v) continue;
      vehicleMap.set(v, (vehicleMap.get(v) ?? 0) + 1);
    }
  }
  const topVehicles = Array.from(Array.from(vehicleMap.entries()))
    .map(([vehicle, count]) => ({
      vehicle,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total,
    byFatalities: fatalities,
    byCasualties: casualties,
    severityBreakdown,
    topJunctions,
    topVehicles,
  };
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      timeZone: "Africa/Dar_es_Salaam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      timeZone: "Africa/Dar_es_Salaam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function filterSummary(filters: {
  from?: string;
  to?: string;
  district?: string;
  severity?: string[];
  vehicle?: string[];
  status?: string;
}): string {
  const parts: string[] = [];
  if (filters.from || filters.to) {
    parts.push(`${filters.from || "earliest"} → ${filters.to || "latest"}`);
  }
  if (filters.district) parts.push(`District: ${filters.district}`);
  if (filters.severity?.length) parts.push(`Severity: ${filters.severity.join(", ")}`);
  if (filters.vehicle?.length) parts.push(`Vehicle: ${filters.vehicle.join(", ")}`);
  if (filters.status && filters.status !== "all")
    parts.push(`Status: ${filters.status}`);
  return parts.length ? parts.join(" · ") : "All incidents (no filter)";
}
