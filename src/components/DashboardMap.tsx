"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

// Add Leaflet CSS dynamically (client-side only)
if (typeof window !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

interface Accident {
  id: number;
  lat: number;
  lng: number;
  severity: string;
  vehicleTypes: string[];
  district: string;
  junctionName: string;
  occurredAt: string;
  casualties: number;
  fatalities: number;
  verified: boolean;
  upvoteCount: number;
  intensity: number;
  photoUrl?: string;
  description?: string;
}

interface DashboardMapProps {
  accidents: Accident[];
  selectedHour: string;
  seriousMode: boolean;
}

const SEV_COLORS: Record<string, string> = {
  fatal: "#DC2626",
  critical: "#FBBF24",
  serious: "#3B82F6",
  minor: "#22C55E",
};

export default function DashboardMap({ accidents, selectedHour, seriousMode }: DashboardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
        center: [-6.7924, 39.2083],
        zoom: 11,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 120,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Force multiple invalidates to ensure it fills the container
      const doInvalidate = () => {
        try { map.invalidateSize(); } catch {}
      };
      setTimeout(doInvalidate, 100);
      setTimeout(doInvalidate, 300);
      setTimeout(doInvalidate, 600);

      // Re-invalidate on resize
      const onResize = () => doInvalidate();
      window.addEventListener("resize", onResize);
      
      // Clean up listener on unmount
      const currentCleanup = () => {
        window.removeEventListener("resize", onResize);
      };
      (map as any)._rsdCleanup = currentCleanup;
    } catch (e) {
      console.error("[DashboardMap] init error:", e);
    }

    return () => {
      if (mapInstanceRef.current) {
        const cleanup = (mapInstanceRef.current as any)._rsdCleanup;
        if (cleanup) cleanup();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Filter accidents
    const filtered = selectedHour === "all"
      ? accidents
      : accidents.filter((a) => new Date(a.occurredAt).getHours() === parseInt(selectedHour));

    const displayList = seriousMode
      ? filtered
          .filter((a) => ["fatal", "critical", "serious"].includes(a.severity))
          .filter((a) => a.verified || a.upvoteCount > 0)
          .sort((a, b) => {
            const sevWeight = (s: string) => s === "fatal" ? 3 : s === "critical" ? 2 : 1;
            if (sevWeight(b.severity) !== sevWeight(a.severity)) return sevWeight(b.severity) - sevWeight(a.severity);
            if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
            return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
          })
      : filtered;

    // Add markers
    displayList.forEach((a) => {
      const sevColor = SEV_COLORS[a.severity] || "#3B82F6";
      const desc = a.description || "";
      const moodMatch = /^\[mood:(sad|tragic|hopeful|miraculous)\]\s*/i.exec(desc);
      const cleanDesc = moodMatch ? desc.slice(moodMatch[0].length) : desc;

      const html = `
        <div style="min-width:220px;font-family:system-ui,sans-serif;">
          ${a.photoUrl ? `<img src="${a.photoUrl}" alt="Photo" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sevColor};"></span>
            <strong style="font-size:14px;text-transform:capitalize;">${a.severity}</strong>
          </div>
          <div style="font-size:12px;color:#475569;margin-bottom:2px;">
            <strong>${a.junctionName || "Unknown"}</strong>${a.district ? `, ${a.district}` : ""}
          </div>
          <div style="font-size:12px;color:#64748B;">${new Date(a.occurredAt).toLocaleDateString()}</div>
          ${cleanDesc ? `<div style="font-size:12px;color:#475569;margin-top:4px;border-top:1px solid #E2E8F0;padding-top:4px;">${cleanDesc}</div>` : ""}
        </div>`;

      const marker = L.circleMarker([a.lat, a.lng], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: sevColor,
        fillOpacity: 0.9,
      }).addTo(map);
      marker.bindPopup(html);
      markersRef.current.push(marker);
    });

    // Try heatmap if leaflet.heat available from CDN
    try {
      const HeatLayer = (window as any).L?.heatLayer;
      if (HeatLayer && filtered.length > 0) {
        const points = filtered
          .map((a) => {
            const lat = Number(a.lat);
            const lng = Number(a.lng);
            const intensity = Number((a as any).intensity);
            if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(intensity)) return null;
            return [lat, lng, intensity] as [number, number, number];
          })
          .filter(Boolean) as [number, number, number][];

        if (points.length > 0) {
          HeatLayer(points, {
            radius: 25, blur: 15, maxZoom: 10, max: 4,
            gradient: { 0.4: "#22C55E", 0.6: "#FBBF24", 0.8: "#F87171", 1: "#DC2626" },
          }).addTo(map);
        }
      }
    } catch {}
  }, [accidents, selectedHour, seriousMode]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
        minHeight: "400px",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 24,
        border: "1px solid #E2E8F0",
        position: "relative",
        zIndex: 1,
        background: "#E8EDF2",
      }}
    />
  );
}