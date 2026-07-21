"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

const COLORS = { blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", teal: "#14B8A6" };
const SEV_COLORS: Record<string, string> = { fatal: COLORS.red, critical: COLORS.orange, serious: COLORS.blue, minor: COLORS.green };
const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.red, COLORS.purple, COLORS.teal, "#F97316", "#06B6D4"];

interface Filters { from?: string; to?: string; district?: string; severity?: string; weather?: string; roadType?: string; }

interface AnalyticsData {
  total: number; fatalities: number; casualties: number; verified: number; pending: number;
  severity: Record<string, number>;
  monthly: { month: string; count: number }[];
  annual: { year: string; count: number }[];
  hourly: { hour: number; count: number }[];
  byDistrict: { name: string; count: number }[];
  byWeather: { name: string; count: number }[];
  byRoadCondition: { name: string; count: number }[];
  hotspots: { label: string; count: number; lat: number; lng: number }[];
  vehicles: Record<string, number>;
}

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div style={{ background: "#fff", padding: "20px 16px", borderRadius: 16, border: `1px solid #E2E8F0`, borderTop: `3px solid ${color}`, textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: 20, ...style }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{title}</h3>
      {children}
    </div>
  );
}

export function AnalyticsDashboard({ filters }: { filters?: Filters }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      if (filters?.district) params.set("district", filters.district);
      if (filters?.severity) params.set("severity", filters.severity);
      if (filters?.weather) params.set("weather", filters.weather);
      if (filters?.roadType) params.set("roadType", filters.roadType);
      const qs = params.toString();
      const res = await fetch(`/api/analytics${qs ? `?${qs}` : ""}`);
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, padding: 24 }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 100, borderRadius: 16, background: "#E2E8F0", animation: "pulse 1.5s ease-in-out infinite" }} />)}
    </div>;
  }

  if (!data) return <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No analytics data available</div>;

  const monthlyChart = data.monthly.map(m => ({ ...m, label: new Date(m.month + "-01").toLocaleString("default", { month: "short" }) }));
  const severityPie = Object.entries(data.severity).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
  const totalVehicles = Object.entries(data.vehicles).sort(([, a], [, b]) => b - a).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <KpiCard label="Total Accidents" value={data.total} color={COLORS.blue} icon="∑" />
        <KpiCard label="Fatal Accidents" value={data.fatalities} color={COLORS.red} icon="!" />
        <KpiCard label="Serious Injuries" value={data.casualties} color={COLORS.orange} icon="⚠" />
        <KpiCard label="Minor Injuries" value={Math.max(0, data.casualties - data.fatalities)} color={COLORS.green} icon="•" />
        <KpiCard label="Total Deaths" value={data.fatalities} color={COLORS.red} icon="†" />
        <KpiCard label="Vehicles Involved" value={totalVehicles.reduce((s, v) => s + v.count, 0)} color={COLORS.purple} icon="⊞" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        <ChartCard title="Monthly Accident Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Accidents" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Annual Accident Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.annual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accident Severity Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={severityPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {severityPie.map((e) => <Cell key={e.name} fill={SEV_COLORS[e.name.toLowerCase()] || COLORS.blue} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accidents by District">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byDistrict} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <Bar dataKey="count" fill={COLORS.orange} radius={[0, 4, 4, 0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accidents by Weather">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.byWeather} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="count" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {data.byWeather.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accidents by Road Type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byRoadCondition}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <Bar dataKey="count" fill={COLORS.teal} radius={[4, 4, 0, 0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Accident Hotspots">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hotspots} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend />
              <Bar dataKey="count" fill={COLORS.red} radius={[0, 4, 4, 0]} name="Accidents" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak Accident Hours">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} labelFormatter={(h: any) => `${h}:00 - ${(Number(h) + 1) % 24}:00`} />
              <Legend />
              <Area type="monotone" dataKey="count" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} strokeWidth={2} name="Accidents" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
