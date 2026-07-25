// Shared types for the export module. Keep narrow and well-typed (no `any`).

export type Severity = "minor" | "serious" | "critical" | "fatal";

export type ExportVehicle =
  | "motorcycle"
  | "car"
  | "bus"
  | "truck"
  | "bicycle"
  | "pedestrian";

export type ExportStatus = "pending" | "verified" | "rejected" | "all";

/** A row from the `/api/accidents/export` endpoint. Subset + flattened. */
export interface ExportAccident {
  id: number;
  lat: number;
  lng: number;
  district: string;
  ward: string;
  junctionName: string;
  occurredAt: string; // ISO
  reportedAt: string; // ISO
  severity: Severity | string;
  vehicleTypes: string[]; // parsed from JSON
  reporterType: string;
  casualties: number;
  fatalities: number;
  injuries: number;
  description: string;
  weather: string;
  roadCondition: string;
  verificationStatus: string;
  verified: boolean;
  upvoteCount: number;
  photoUrl: string;
  contact: string;
}

/** Filters accepted by the export API. */
export interface ExportFilters {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  district?: string;
  severity?: Severity[]; // empty/undefined = all
  vehicle?: ExportVehicle[]; // empty/undefined = all
  status?: ExportStatus; // "all" = all
}

export interface ExportResponse {
  filters: ExportFilters;
  count: number;
  total: number; // before truncation
  truncated: boolean;
  generatedAt: string; // ISO
  incidents: ExportAccident[];
}

export interface ExportStats {
  total: number;
  byFatalities: number;
  byCasualties: number;
  severityBreakdown: { severity: string; count: number; pct: number }[];
  topJunctions: {
    junction: string;
    district: string;
    incidents: number;
    fatalities: number;
  }[];
  topVehicles: { vehicle: string; count: number; pct: number }[];
}

export const SEVERITY_ORDER: Severity[] = ["fatal", "critical", "serious", "minor"];

export const SEVERITY_COLOR: Record<string, [number, number, number]> = {
  fatal: [248, 113, 113], // #F87171
  critical: [251, 191, 36], // #FBBF24
  serious: [59, 130, 246], // #3B82F6
  minor: [34, 197, 94], // #22C55E
};

export const NAVY: [number, number, number] = [15, 23, 42]; // #0F172A
export const NAVY_ACCENT: [number, number, number] = [30, 58, 95]; // #1E3A5F
export const BLUE: [number, number, number] = [37, 99, 235]; // #2563EB
export const SLATE_500: [number, number, number] = [100, 116, 139]; // #64748B
export const SLATE_200: [number, number, number] = [226, 232, 240]; // #E2E8F0
export const WHITE: [number, number, number] = [255, 255, 255];
