// PDF export. Branded A4 portrait with header band, KPI strip, and 4 tables.
// Client-side only, using jspdf + jspdf-autotable.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ExportAccident,
  ExportResponse,
  NAVY,
  NAVY_ACCENT,
  BLUE,
  SLATE_500,
  SLATE_200,
  WHITE,
  SEVERITY_COLOR,
} from "./types";
import { summarize, formatDateTime, filterSummary } from "./stats";

const PAGE_MARGIN = 12; // mm
const HEADER_HEIGHT = 16; // mm
const FOOTER_Y = 285; // mm (A4 portrait, 297mm tall, with 12mm bottom margin)

interface DrawContext {
  doc: jsPDF;
  pageNumber: number;
}

function drawHeader(doc: jsPDF, title: string, subtitle: string): void {
  // Navy band
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, 210, HEADER_HEIGHT, "F");

  // Accent stripe
  doc.setFillColor(NAVY_ACCENT[0], NAVY_ACCENT[1], NAVY_ACCENT[2]);
  doc.rect(0, HEADER_HEIGHT, 210, 1.2, "F");

  // Title
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Road Safety Dar es Salaam", PAGE_MARGIN, 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(title, PAGE_MARGIN, 12);

  // Right-side meta
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text("Incident Report", 210 - PAGE_MARGIN, 7, { align: "right" });
  doc.text(formatDateTime(new Date().toISOString()), 210 - PAGE_MARGIN, 12, {
    align: "right",
  });

  if (subtitle) {
    doc.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(subtitle, PAGE_MARGIN, HEADER_HEIGHT + 6);
  }
}

function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  doc.setDrawColor(SLATE_200[0], SLATE_200[1], SLATE_200[2]);
  doc.line(PAGE_MARGIN, FOOTER_Y - 4, 210 - PAGE_MARGIN, FOOTER_Y - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
  doc.text(
    "Road Safety Dar es Salaam · roadsafetydar@gmail.com",
    PAGE_MARGIN,
    FOOTER_Y
  );
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    210 - PAGE_MARGIN,
    FOOTER_Y,
    { align: "right" }
  );
}

function kpiBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: number[]
): void {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(SLATE_200[0], SLATE_200[1], SLATE_200[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "FD");

  // Accent left bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(x, y, 1.2, h, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
  doc.text(label.toUpperCase(), x + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(value, x + 3, y + 13);
}

function drawKpiStrip(doc: jsPDF, y: number, incidents: ExportAccident[]): number {
  const stats = summarize(incidents);
  const boxW = (210 - PAGE_MARGIN * 2 - 6) / 4; // 4 boxes with 2mm gaps
  const boxH = 18;
  const positions = [
    { label: "Total incidents", value: String(stats.total), accent: BLUE },
    {
      label: "Fatalities",
      value: String(stats.byFatalities),
      accent: SEVERITY_COLOR.fatal,
    },
    {
      label: "Casualties",
      value: String(stats.byCasualties),
      accent: SEVERITY_COLOR.critical,
    },
    {
      label: "Avg severity",
      value: stats.total > 0 ? computeAvgSeverity(stats) : "—",
      accent: NAVY_ACCENT,
    },
  ];
  positions.forEach((p, i) => {
    const x = PAGE_MARGIN + i * (boxW + 2);
    kpiBox(doc, x, y, boxW, boxH, p.label, p.value, p.accent);
  });
  return y + boxH + 4;
}

function computeAvgSeverity(stats: ReturnType<typeof summarize>): string {
  // Weighted score: fatal=4, critical=3, serious=2, minor=1
  const weights: Record<string, number> = {
    fatal: 4,
    critical: 3,
    serious: 2,
    minor: 1,
  };
  let total = 0;
  let count = 0;
  for (const s of stats.severityBreakdown) {
    const w = weights[s.severity] ?? 0;
    total += w * s.count;
    count += s.count;
  }
  if (count === 0) return "—";
  const score = total / count;
  if (score >= 3.5) return "Fatal";
  if (score >= 2.5) return "Critical";
  if (score >= 1.5) return "Serious";
  return "Minor";
}

function sectionLabel(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(text, PAGE_MARGIN, y);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, y + 1.2, 210 - PAGE_MARGIN, y + 1.2);
  return y + 6;
}

export function buildPdf(response: ExportResponse): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const stats = summarize(response.incidents);
  const filterLine = filterSummary(response.filters);

  let y = HEADER_HEIGHT + 12;
  drawHeader(doc, "Incident Report", filterLine);

  y = drawKpiStrip(doc, y, response.incidents);

  // Severity distribution
  y = sectionLabel(doc, y, "Severity distribution");
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Severity", "Count", "Percent"]],
    body: stats.severityBreakdown.map((s) => [
      s.severity,
      String(s.count),
      `${s.pct}%`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });
  // @ts-expect-error jspdf-autotable augments doc with lastAutoTable
  y = doc.lastAutoTable.finalY + 6;

  // Top junctions
  y = sectionLabel(doc, y, "Top 10 junctions");
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Junction", "District", "Incidents", "Fatalities"]],
    body: stats.topJunctions.map((j) => [
      j.junction,
      j.district,
      String(j.incidents),
      String(j.fatalities),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right", textColor: SEVERITY_COLOR.fatal, fontStyle: "bold" },
    },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 6;

  // Top vehicles
  y = sectionLabel(doc, y, "Top 10 vehicle types");
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Vehicle", "Count", "Percent"]],
    body: stats.topVehicles.map((v) => [
      v.vehicle,
      String(v.count),
      `${v.pct}%`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 6;

  // Recent incidents (first 50)
  const recent = response.incidents.slice(0, 50);
  doc.addPage();
  drawHeader(doc, "Recent incidents", filterLine);
  y = HEADER_HEIGHT + 12;

  y = sectionLabel(doc, y, `Recent incidents (${recent.length}${response.incidents.length > 50 ? ` of ${response.incidents.length}` : ""})`);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["ID", "Date", "District", "Severity", "Vehicle", "Cas.", "Fat."]],
    body: recent.map((a) => [
      String(a.id),
      formatDateTime(a.occurredAt).split(",")[0],
      a.district,
      a.severity,
      (a.vehicleTypes ?? []).join(", ") || "—",
      String(a.casualties),
      String(a.fatalities),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 7.8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      // Color the severity column
      if (hookData.section === "body" && hookData.column.index === 3) {
        const sev = String(hookData.cell.raw ?? "").toLowerCase();
        const c = SEVERITY_COLOR[sev];
        if (c) hookData.cell.styles.textColor = c;
      }
    },
  });

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
