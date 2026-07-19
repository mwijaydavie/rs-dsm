// GET /api/stats
// Aggregates accident stats using the Supabase REST API (HTTPS, IPv4-friendly).
// Falls back to safe empty numbers if Supabase is unreachable instead of 500-ing.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccidentRow = {
  id: number;
  severity: string;
  vehicleTypes: string;
  occurredAt: string;
  fatalities: number;
  casualties: number;
  verified: boolean;
  verificationStatus: string;
};

export async function GET() {
  const start = Date.now();
  const sb = getSupabaseAdmin();

  // 1. Fetch all accidents (200 rows is small enough to pull at once).
  // Use head:false + explicit columns to keep payload small.
  const { data: rows, error } = await sb
    .from("Accident")
    .select(
      "id, severity, vehicleTypes, occurredAt, fatalities, casualties, verified, verificationStatus"
    )
    .limit(1000);

  if (error) {
    console.error("[api/stats] supabase error:", error.message);
    return NextResponse.json(
      {
        error: "Upstream database error",
        detail: error.message,
        total: 0,
        pending: 0,
        fatal: 0,
        serious: 0,
        minor: 0,
        critical: 0,
        verified: 0,
        totalFatalities: 0,
        totalCasualties: 0,
        junctionCount: 0,
        severity: {},
        vehicles: {},
        monthly: [],
        hourly: [],
        _meta: { source: "supabase-failed", latencyMs: Date.now() - start },
      },
      { status: 503 }
    );
  }

  const accidents = (rows ?? []) as AccidentRow[];

  // 2. Aggregate in JS (no GROUP BY needed in PostgREST for this size)
  const total = accidents.length;
  const severity: Record<string, number> = {};
  const vehicles: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const hourly: number[] = Array(24).fill(0);
  let fatalities = 0;
  let casualties = 0;
  let verified = 0;
  let pending = 0;

  for (const a of accidents) {
    severity[a.severity] = (severity[a.severity] || 0) + 1;
    fatalities += a.fatalities ?? 0;
    casualties += a.casualties ?? 0;
    if (a.verified) verified++;
    if (a.verificationStatus === "pending") pending++;

    try {
      const vtypes: string[] = JSON.parse(a.vehicleTypes || "[]");
      for (const v of vtypes) {
        vehicles[v] = (vehicles[v] || 0) + 1;
      }
    } catch {
      /* ignore malformed JSON */
    }

    const d = new Date(a.occurredAt);
    if (!isNaN(d.getTime())) {
      const key = d.toISOString().slice(0, 7);
      monthly[key] = (monthly[key] || 0) + 1;
      hourly[d.getUTCHours()]++;
    }
  }

  // 3. Junction count — single small query
  const { count: junctionCount } = await sb
    .from("Junction")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    total,
    pending,
    fatal: severity.fatal || 0,
    serious: severity.serious || 0,
    minor: severity.minor || 0,
    critical: severity.critical || 0,
    verified,
    totalFatalities: fatalities,
    totalCasualties: casualties,
    junctionCount: junctionCount ?? 0,
    severity,
    vehicles,
    monthly: Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    hourly: hourly.map((count, hour) => ({ hour, count })),
    _meta: {
      source: "supabase",
      latencyMs: Date.now() - start,
    },
  });
}
