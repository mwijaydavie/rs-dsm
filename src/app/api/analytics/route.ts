import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccidentRow = {
  id: number; severity: string; vehicleTypes: string; occurredAt: string;
  fatalities: number; casualties: number; verified: boolean;
  verificationStatus: string; weather: string; roadCondition: string;
  district: string; ward: string; junctionName: string; lat: number; lng: number;
};

function buildQuery(sb: ReturnType<typeof getSupabaseAdmin>, params: URLSearchParams) {
  let query = sb.from("Accident").select(
    "id, severity, vehicleTypes, occurredAt, fatalities, casualties, verified, verificationStatus, weather, roadCondition, district, ward, junctionName, lat, lng"
  );

  const from = params.get("from");
  const to = params.get("to");
  const district = params.get("district");
  const ward = params.get("ward");
  const severity = params.get("severity");
  const weather = params.get("weather");
  const roadType = params.get("roadType");

  if (from) query = query.gte("occurredAt", from);
  if (to) query = query.lte("occurredAt", to);
  if (district) query = query.eq("district", district);
  if (ward) query = query.eq("ward", ward);
  if (severity) query = query.eq("severity", severity);
  if (weather) query = query.eq("weather", weather);
  if (roadType) query = query.eq("roadCondition", roadType);

  return query.limit(5000);
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  const sb = getSupabaseAdmin();
  const params = request.nextUrl.searchParams;

  const { data: rows, error } = await buildQuery(sb, params);

  if (error) {
    return NextResponse.json({ error: error.message, detail: error.hint }, { status: 503 });
  }

  const accidents = (rows ?? []) as AccidentRow[];
  const total = accidents.length;

  const severity: Record<string, number> = {};
  const vehicles: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const annual: Record<string, number> = {};
  const hourly: number[] = Array(24).fill(0);
  const byDistrict: Record<string, number> = {};
  const byWard: Record<string, number> = {};
  const byWeather: Record<string, number> = {};
  const byRoadCondition: Record<string, number> = {};
  const hotspots: Record<string, { lat: number; lng: number; count: number; label: string }> = {};
  const weekly: Record<string, number> = {};
  const daily: Record<string, number> = {};

  let fatalities = 0, casualties = 0, verified = 0, pending = 0;

  for (const a of accidents) {
    severity[a.severity] = (severity[a.severity] || 0) + 1;
    fatalities += a.fatalities ?? 0;
    casualties += a.casualties ?? 0;
    if (a.verified) verified++;
    if (a.verificationStatus === "pending") pending++;

    try {
      const vtypes: string[] = JSON.parse(a.vehicleTypes || "[]");
      for (const v of vtypes) vehicles[v] = (vehicles[v] || 0) + 1;
    } catch {}

    const d = new Date(a.occurredAt);
    if (!isNaN(d.getTime())) {
      const mKey = d.toISOString().slice(0, 7);
      monthly[mKey] = (monthly[mKey] || 0) + 1;
      const yKey = d.getFullYear().toString();
      annual[yKey] = (annual[yKey] || 0) + 1;
      hourly[d.getUTCHours()]++;
      const dayKey = d.toISOString().slice(0, 10);
      daily[dayKey] = (daily[dayKey] || 0) + 1;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const wKey = weekStart.toISOString().slice(0, 10);
      weekly[wKey] = (weekly[wKey] || 0) + 1;
    }

    if (a.district) byDistrict[a.district] = (byDistrict[a.district] || 0) + 1;
    if (a.ward) byWard[a.ward] = (byWard[a.ward] || 0) + 1;
    if (a.weather) byWeather[a.weather] = (byWeather[a.weather] || 0) + 1;
    if (a.roadCondition) byRoadCondition[a.roadCondition] = (byRoadCondition[a.roadCondition] || 0) + 1;

    if (a.junctionName && a.lat && a.lng) {
      const key = a.junctionName;
      if (!hotspots[key]) hotspots[key] = { lat: a.lat, lng: a.lng, count: 0, label: key };
      hotspots[key].count++;
    }
  }

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return { month: key, count: monthly[key] || 0 };
  });

  const last5Years = Array.from({ length: 5 }, (_, i) => {
    const y = (currentYear - 4 + i).toString();
    return { year: y, count: annual[y] || 0 };
  });

  return NextResponse.json({
    total, fatalities, casualties, verified, pending,
    severity,
    vehicles,
    monthly: months,
    annual: last5Years,
    hourly: hourly.map((count, hour) => ({ hour, count })),
    weekly: Object.entries(weekly).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count })),
    daily: Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
    byDistrict: Object.entries(byDistrict).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count })),
    byWard: Object.entries(byWard).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count })),
    byWeather: Object.entries(byWeather).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count })),
    byRoadCondition: Object.entries(byRoadCondition).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count })),
    hotspots: Object.values(hotspots).sort((a, b) => b.count - a.count).slice(0, 10),
    heatmapData: accidents.filter(a => a.lat && a.lng).map(a => [a.lat, a.lng, 1]),
    _meta: { source: "supabase", latencyMs: Date.now() - start, count: total },
  });
}
