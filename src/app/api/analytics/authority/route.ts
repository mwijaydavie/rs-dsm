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

function buildQuery(sb: ReturnType<typeof getSupabaseAdmin>, p: URLSearchParams) {
  let q = sb.from("Accident").select(
    "id, severity, vehicleTypes, occurredAt, fatalities, casualties, verified, verificationStatus, weather, roadCondition, district, ward, junctionName, lat, lng"
  );
  if (p.get("from")) q = q.gte("occurredAt", p.get("from")!);
  if (p.get("to")) q = q.lte("occurredAt", p.get("to")!);
  if (p.get("district")) q = q.eq("district", p.get("district")!);
  if (p.get("ward")) q = q.eq("ward", p.get("ward")!);
  if (p.get("severity")) q = q.eq("severity", p.get("severity")!);
  if (p.get("weather")) q = q.eq("weather", p.get("weather")!);
  if (p.get("roadType")) q = q.eq("roadCondition", p.get("roadType")!);
  return q.limit(10000);
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  const sb = getSupabaseAdmin();
  const p = request.nextUrl.searchParams;

  const { data: rows, error } = await buildQuery(sb, p);
  if (error) return NextResponse.json({ error: error.message }, { status: 503 });

  const a = (rows ?? []) as AccidentRow[];
  const total = a.length;

  const severity: Record<string, number> = {};
  const vehicles: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const annual: Record<string, number> = {};
  const hourly: number[] = Array(24).fill(0);
  const byDistrict: Record<string, number> = {};
  const byWard: Record<string, number> = {};
  const byWeather: Record<string, number> = {};
  const byRoad: Record<string, number> = {};
  const byMonthNum: Record<string, number> = {};
  const hotspots: Record<string, { lat: number; lng: number; count: number; label: string; severity: string[] }> = {};
  const weekly: Record<string, number> = {};
  const daily: Record<string, number> = {};

  let fatal = 0; let deaths = 0; let injured = 0; let verified = 0; let pending = 0;
  let critical = 0; let serious = 0; let minor = 0;

  for (const r of a) {
    severity[r.severity] = (severity[r.severity] || 0) + 1;
    if (r.severity === "fatal") fatal++;
    if (r.severity === "critical") critical++;
    if (r.severity === "serious") serious++;
    if (r.severity === "minor") minor++;
    deaths += r.fatalities ?? 0;
    injured += r.casualties ?? 0;
    if (r.verified) verified++;
    if (r.verificationStatus === "pending") pending++;

    try {
      for (const v of JSON.parse(r.vehicleTypes || "[]")) vehicles[v] = (vehicles[v] || 0) + 1;
    } catch {}

    const d = new Date(r.occurredAt);
    if (!isNaN(d.getTime())) {
      const mk = d.toISOString().slice(0, 7);
      monthly[mk] = (monthly[mk] || 0) + 1;
      annual[d.getFullYear().toString()] = (annual[d.getFullYear().toString()] || 0) + 1;
      hourly[d.getUTCHours()]++;
      const dk = d.toISOString().slice(0, 10);
      daily[dk] = (daily[dk] || 0) + 1;
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      weekly[ws.toISOString().slice(0, 10)] = (weekly[ws.toISOString().slice(0, 10)] || 0) + 1;
      byMonthNum[d.getMonth().toString()] = (byMonthNum[d.getMonth().toString()] || 0) + 1;
    }

    if (r.district) byDistrict[r.district] = (byDistrict[r.district] || 0) + 1;
    if (r.ward) byWard[r.ward] = (byWard[r.ward] || 0) + 1;
    if (r.weather) byWeather[r.weather] = (byWeather[r.weather] || 0) + 1;
    if (r.roadCondition) byRoad[r.roadCondition] = (byRoad[r.roadCondition] || 0) + 1;

    if (r.junctionName && r.lat && r.lng) {
      if (!hotspots[r.junctionName]) hotspots[r.junctionName] = { lat: r.lat, lng: r.lng, count: 0, label: r.junctionName, severity: [] };
      hotspots[r.junctionName].count++;
      hotspots[r.junctionName].severity.push(r.severity);
    }
  }

  const cy = new Date().getFullYear();

  const prediction = (() => {
    const m = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: byMonthNum[i.toString()] || 0 }));
    const avg = m.reduce((s, x) => s + x.count, 0) / 12;
    const nextMonth = (new Date().getMonth() + 1) % 12;
    return { currentYear: monthly, predictedNextMonth: Math.round(avg * 1.1), monthlyAvg: Math.round(avg), trend: avg > 0 ? (monthly[`${cy}-${String(new Date().getMonth() + 1).padStart(2, "0")}`] || 0) > avg ? "increasing" : "decreasing" : "stable" };
  })();

  // User stats
  const { count: userCount } = await sb.from("User").select("id", { count: "exact", head: true });
  const { count: policeCount } = await sb.from("User").select("id", { count: "exact", head: true }).eq("role", "POLICE");

  return NextResponse.json({
    summary: {
      total, fatal, critical, serious, minor, deaths, injured, verified, pending,
      activeUsers: userCount ?? 0, policeStations: policeCount ?? 0,
    },
    severeHotspots: Object.values(hotspots).sort((a, b) => b.count - a.count).slice(0, 10),
    monthly: Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([m, c]) => ({ month: m, count: c })),
    annual: Object.entries(annual).sort(([a], [b]) => a.localeCompare(b)).map(([y, c]) => ({ year: y, count: c })),
    weekly: Object.entries(weekly).sort(([a], [b]) => a.localeCompare(b)).map(([w, c]) => ({ week: w, count: c })),
    daily: Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([d, c]) => ({ date: d, count: c })),
    hourly: hourly.map((c, h) => ({ hour: h, count: c })),
    severity: Object.entries(severity).map(([k, v]) => ({ name: k, value: v })),
    vehicles: Object.entries(vehicles).sort(([, a], [, b]) => b - a).map(([k, v]) => ({ name: k, count: v })),
    byDistrict: Object.entries(byDistrict).sort(([, a], [, b]) => b - a).map(([n, c]) => ({ name: n, count: c })),
    byWard: Object.entries(byWard).sort(([, a], [, b]) => b - a).map(([n, c]) => ({ name: n, count: c })),
    byWeather: Object.entries(byWeather).sort(([, a], [, b]) => b - a).map(([n, c]) => ({ name: n, count: c })),
    byRoadCondition: Object.entries(byRoad).sort(([, a], [, b]) => b - a).map(([n, c]) => ({ name: n, count: c })),
    prediction,
    _meta: { latencyMs: Date.now() - start },
  });
}
