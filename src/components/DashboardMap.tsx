"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet.markercluster";

if (typeof window !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
  const clusterLink = document.createElement("link");
  clusterLink.rel = "stylesheet";
  clusterLink.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
  document.head.appendChild(clusterLink);
  const clusterLink2 = document.createElement("link");
  clusterLink2.rel = "stylesheet";
  clusterLink2.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
  document.head.appendChild(clusterLink2);
}

interface Accident {
  id: number; lat: number; lng: number; severity: string;
  vehicleTypes: string[]; district: string; ward?: string;
  junctionName: string; occurredAt: string; casualties: number;
  fatalities: number; verified: boolean; upvoteCount: number;
  intensity: number; photoUrl?: string; description?: string;
  weather?: string; roadCondition?: string;
}

interface DashboardMapProps {
  accidents: Accident[];
  selectedHour: string;
  seriousMode: boolean;
  onFilterChange?: (filters: { district?: string; severity?: string; weather?: string }) => void;
}

const SEV_COLORS: Record<string, string> = {
  fatal: "#DC2626", critical: "#FBBF24", serious: "#3B82F6", minor: "#22C55E",
};

export default function DashboardMap({ accidents, selectedHour, seriousMode, onFilterChange }: DashboardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [searchText, setSearchText] = useState("");

  const getFiltered = useCallback(() => {
    let list = selectedHour === "all" ? accidents : accidents.filter((a) => new Date(a.occurredAt).getHours() === parseInt(selectedHour));
    if (seriousMode) {
      list = list.filter((a) => ["fatal", "critical", "serious"].includes(a.severity)).filter((a) => a.verified || a.upvoteCount > 0);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter((a) => a.junctionName?.toLowerCase().includes(q) || a.district?.toLowerCase().includes(q));
    }
    return list;
  }, [accidents, selectedHour, seriousMode, searchText]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      const map = L.map(mapRef.current, {
        zoomControl: true, attributionControl: true,
        center: [-6.7924, 39.2083], zoom: 11, zoomSnap: 0.5, wheelPxPerZoomLevel: 120,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
      const inv = () => { try { map.invalidateSize(); } catch {} };
      setTimeout(inv, 100); setTimeout(inv, 300); setTimeout(inv, 600);
      window.addEventListener("resize", inv);
      return () => {
        window.removeEventListener("resize", inv);
        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      };
    } catch (e) { console.error("[DashboardMap] init error:", e); }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerGroupRef.current) { map.removeLayer(markerGroupRef.current); markerGroupRef.current = null; }
    if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }

    const filtered = getFiltered();
    const points: [number, number, number][] = [];

    if (showClusters) {
      const cluster = L.markerClusterGroup({
        chunkedLoading: true, maxClusterRadius: 50,
        spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true,
        iconCreateFunction: (c: any) => {
          const count = c.getChildCount();
          let color = "#22C55E";
          if (count > 20) color = "#DC2626";
          else if (count > 10) color = "#F59E0B";
          else if (count > 5) color = "#3B82F6";
          return L.divIcon({
            html: `<div style="background:${color};color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.2);">${count}</div>`,
            className: "", iconSize: L.point(36, 36),
          });
        },
      });
      markerGroupRef.current = cluster;
    } else {
      markerGroupRef.current = L.layerGroup();
    }

    filtered.forEach((a) => {
      const sevColor = SEV_COLORS[a.severity] || "#3B82F6";
      const vehicles = Array.isArray(a.vehicleTypes) ? a.vehicleTypes.join(", ") : "";
      const html = `<div style="min-width:220px;font-family:system-ui,sans-serif;">
        ${a.photoUrl ? `<img src="${a.photoUrl}" alt="" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
        <div style="border-bottom:1px solid #E2E8F0;padding-bottom:8px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sevColor};flex-shrink:0;"></span>
            <strong style="font-size:14px;text-transform:capitalize;">${a.severity}</strong>
            ${a.verified ? `<span style="font-size:10px;background:#DCFCE7;color:#166534;padding:1px 6px;border-radius:999;">Verified</span>` : ""}
          </div>
        </div>
        <div style="font-size:12px;color:#0F172A;font-weight:600;">#${a.id} - ${a.junctionName || "Unknown"}</div>
        <div style="font-size:11px;color:#64748B;">${new Date(a.occurredAt).toLocaleString()}</div>
        <div style="font-size:11px;color:#475569;margin-top:4px;">
          ${a.district ? `<span>📍 ${a.district}</span>` : ""}
          ${vehicles ? `<span>🚗 ${vehicles}</span>` : ""}
        </div>
        <div style="font-size:11px;color:#475569;margin-top:2px;">
          ${a.casualties > 0 ? `<span>⚠ ${a.casualties} injured</span>` : ""}
          ${a.fatalities > 0 ? `<span style="color:#DC2626;">† ${a.fatalities} fatal</span>` : ""}
          ${a.weather ? `<span>🌤 ${a.weather}</span>` : ""}
        </div>
        ${a.description ? `<div style="font-size:11px;color:#64748B;margin-top:4px;border-top:1px solid #E2E8F0;padding-top:4px;">${a.description.slice(0, 100)}</div>` : ""}
      </div>`;

      const marker = L.marker([a.lat, a.lng], {
        icon: L.divIcon({
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${sevColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
          className: "", iconSize: L.point(16, 16),
        }),
      });
      marker.bindPopup(html);
      markerGroupRef.current!.addLayer(marker);
      points.push([a.lat, a.lng, a.intensity || 1]);
    });

    map.addLayer(markerGroupRef.current);

    if (showHeatmap && points.length > 0) {
      try {
        const HeatLayer = (window as any).L?.heatLayer;
        if (HeatLayer) {
          heatLayerRef.current = HeatLayer(points, {
            radius: 30, blur: 20, maxZoom: 10, max: 3,
            gradient: { 0.4: "#22C55E", 0.6: "#FBBF24", 0.8: "#F97316", 1: "#DC2626" },
          });
          map.addLayer(heatLayerRef.current);
        }
      } catch {}
    }
  }, [accidents, selectedHour, seriousMode, showHeatmap, showClusters, searchText, getFiltered]);

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" placeholder="Search location..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, minHeight: 40 }} />
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showClusters} onChange={() => setShowClusters((v) => !v)} /> Clusters
        </label>
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showHeatmap} onChange={() => setShowHeatmap((v) => !v)} /> Heatmap
        </label>
      </div>
      <div style={{ position: "absolute", top: 60, right: 12, zIndex: 1000, background: "#fff", borderRadius: 8, padding: "6px 10px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 11, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ color: "#DC2626", fontWeight: 600 }}>● Fatal</span>
        <span style={{ color: "#FBBF24", fontWeight: 600 }}>● Critical</span>
        <span style={{ color: "#3B82F6", fontWeight: 600 }}>● Serious</span>
        <span style={{ color: "#22C55E", fontWeight: 600 }}>● Minor</span>
      </div>
      <div ref={mapRef} style={{ width: "100%", height: "500px", minHeight: "400px", borderRadius: 16, overflow: "hidden", border: "1px solid #E2E8F0", background: "#E8EDF2" }} />
    </div>
  );
}
