// GET /api/accidents/export
// Returns a filtered slice of accidents for client-side PDF/Excel export.
// Migrated from Prisma to Supabase PostgREST (SupabaseMigrationRound2).
// Caps at 5,000 records; sets `truncated: true` if more would have matched.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { ExportResponse } from "@/lib/export/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CAP = 5000;
const VALID_SEVERITY = new Set(["minor", "serious", "critical", "fatal"]);
const VALID_VEHICLE = new Set([
  "motorcycle",
  "car",
  "bus",
  "truck",
  "bicycle",
  "pedestrian",
]);
const VALID_STATUS = new Set(["pending", "verified", "rejected", "all"]);

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseList(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const district = searchParams.get("district") || undefined;
  const severities = parseList(searchParams.get("severity")).filter((s) =>
    VALID_SEVERITY.has(s)
  );
  const vehicles = parseList(searchParams.get("vehicle")).filter((v) =>
    VALID_VEHICLE.has(v)
  );
  const statusRaw = (searchParams.get("status") || "all").toLowerCase();
  const status = VALID_STATUS.has(statusRaw) ? statusRaw : "all";

  const fromDate = parseDate(fromStr);
  const toDate = parseDate(toStr);
  if ((fromStr && !fromDate) || (toStr && !toDate)) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const sb = getSupabaseAdmin();

  // Build the Supabase query. We over-fetch by CAP and apply post-filters
  // for vehicleTypes (JSON string) and the per-vehicle client filter.
  try {
    let q = sb
      .from("Accident")
      .select(
        "id, lat, lng, district, ward, junctionName, occurredAt, reportedAt, severity, vehicleTypes, reporterType, casualties, fatalities, injuries, description, weather, roadCondition, contact, photoUrl, verificationStatus, verified, upvoteCount"
      )
      .order("occurredAt", { ascending: false })
      .limit(CAP);

    if (fromDate) q = q.gte("occurredAt", fromDate.toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      q = q.lte("occurredAt", end.toISOString());
    }
    if (district) q = q.eq("district", district);
    if (severities.length) q = q.in("severity", severities);
    if (status !== "all") q = q.eq("verificationStatus", status);

    // For "total" we do a count with the same filters
    let countQuery = sb
      .from("Accident")
      .select("id", { count: "exact", head: true });
    if (fromDate) countQuery = countQuery.gte("occurredAt", fromDate.toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      countQuery = countQuery.lte("occurredAt", end.toISOString());
    }
    if (district) countQuery = countQuery.eq("district", district);
    if (severities.length) countQuery = countQuery.in("severity", severities);
    if (status !== "all") countQuery = countQuery.eq("verificationStatus", status);

    const [{ data: rows, error: rowsErr }, { count: total, error: countErr }] =
      await Promise.all([q, countQuery]);

    if (rowsErr) {
      console.error("[export] supabase rows error:", rowsErr.message);
      return NextResponse.json(
        { error: "Export query failed", detail: rowsErr.message },
        { status: 500 }
      );
    }
    if (countErr) {
      console.error("[export] supabase count error:", countErr.message);
    }

    // Map + parse vehicleTypes
    let incidents = (rows ?? []).map((a: any) => ({
      id: a.id,
      lat: a.lat,
      lng: a.lng,
      district: a.district,
      ward: a.ward,
      junctionName: a.junctionName,
      occurredAt:
        typeof a.occurredAt === "string"
          ? a.occurredAt
          : new Date(a.occurredAt).toISOString(),
      reportedAt:
        typeof a.reportedAt === "string"
          ? a.reportedAt
          : new Date(a.reportedAt).toISOString(),
      severity: a.severity,
      vehicleTypes: safeParseArray(a.vehicleTypes),
      reporterType: a.reporterType,
      casualties: a.casualties,
      fatalities: a.fatalities,
      injuries: a.injuries,
      description: a.description,
      weather: a.weather,
      roadCondition: a.roadCondition,
      contact: a.contact,
      photoUrl: a.photoUrl,
      verificationStatus: a.verificationStatus,
      verified: a.verified,
      upvoteCount: a.upvoteCount,
    }));

    // vehicleTypes is a JSON string — filter client-side after fetch
    if (vehicles.length) {
      incidents = incidents.filter((a) =>
        a.vehicleTypes.some((v: string) => vehicles.includes(v))
      );
    }

    const truncated = (total ?? 0) > incidents.length;

    const body: ExportResponse = {
      filters: {
        from: fromStr || undefined,
        to: toStr || undefined,
        district,
        severity: severities as ExportResponse["filters"]["severity"],
        vehicle: vehicles as ExportResponse["filters"]["vehicle"],
        status: status as ExportResponse["filters"]["status"],
      },
      count: incidents.length,
      total: total ?? incidents.length,
      truncated,
      generatedAt: new Date().toISOString(),
      incidents,
    };

    return NextResponse.json(body);
  } catch (err: any) {
    console.error("[export] failed:", err);
    return NextResponse.json(
      { error: "Export query failed", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}
