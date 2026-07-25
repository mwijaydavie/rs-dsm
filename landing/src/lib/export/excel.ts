// Excel export. Builds a 5-sheet workbook using SheetJS (xlsx).
// Client-side only. The browser downloads via a temporary <a> tag.

import * as XLSX from "xlsx";
import { ExportAccident, ExportResponse, NAVY, WHITE } from "./types";
import { summarize, formatDateTime } from "./stats";

function autoWidth(rows: (string | number)[][]): { wch: number }[] {
  // Per-column width = max header length and longest cell content (clamped).
  if (rows.length === 0) return [];
  const cols = rows[0].length;
  const widths: number[] = new Array(cols).fill(0);
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const v = row[i] == null ? "" : String(row[i]);
      if (v.length > widths[i]) widths[i] = v.length;
    }
  }
  return widths.map((w) => ({ wch: Math.min(Math.max(w + 2, 10), 60) }));
}

function fillRow(ws: XLSX.WorkSheet, row: number, count: number, rgb: number[]) {
  // xlsx doesn't expose per-cell fill via the standard API in all builds.
  // We work around with the hidden s (style) property where supported.
  for (let c = 0; c < count; c++) {
    const addr = XLSX.utils.encode_cell({ r: row, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { patternType: "solid", fgColor: { rgb: rgbToXlsx(rgb) } },
      font: { color: { rgb: rgbToXlsx(WHITE) }, bold: true },
    };
  }
}

function rgbToXlsx(rgb: number[]): string {
  return (
    rgb.map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}

function buildSummarySheet(incidents: ExportAccident[], response: ExportResponse): XLSX.WorkSheet {
  const stats = summarize(incidents);
  const filterLine = response.filters
    ? [
        response.filters.from || "",
        response.filters.to || "",
        response.filters.district || "",
        response.filters.severity?.join(",") || "",
        response.filters.vehicle?.join(",") || "",
        response.filters.status || "all",
      ]
    : ["", "", "", "", "", "all"];

  const rows: (string | number)[][] = [
    ["Road Safety Dar es Salaam — Incident Export"],
    [],
    ["Generated", new Date(response.generatedAt).toLocaleString()],
    ["Total incidents", stats.total],
    ["Fatalities", stats.byFatalities],
    ["Casualties", stats.byCasualties],
    [],
    ["Filters"],
    ["From", filterLine[0]],
    ["To", filterLine[1]],
    ["District", filterLine[2]],
    ["Severity", filterLine[3]],
    ["Vehicle", filterLine[4]],
    ["Status", filterLine[5]],
    [],
    ["Severity breakdown"],
    ["Severity", "Count", "Percent"],
    ...stats.severityBreakdown.map((s) => [s.severity, s.count, `${s.pct}%`]),
    [],
    ["Top junctions"],
    ["Junction", "District", "Incidents", "Fatalities"],
    ...stats.topJunctions.map((j) => [
      j.junction,
      j.district,
      j.incidents,
      j.fatalities,
    ]),
    [],
    ["Top vehicles"],
    ["Vehicle", "Count", "Percent"],
    ...stats.topVehicles.map((v) => [v.vehicle, v.count, `${v.pct}%`]),
    [],
    ...(response.truncated
      ? [["NOTE", `Truncated — first ${incidents.length} of ${response.total} returned. Narrow your filter for full data.`]]
      : []),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = autoWidth(rows);

  // Style the title row + first column of section headers
  fillRow(ws, 0, 1, NAVY); // title
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 0 };
  return ws;
}

function buildIncidentsSheet(incidents: ExportAccident[]): XLSX.WorkSheet {
  const headers = [
    "ID",
    "Occurred at",
    "District",
    "Ward",
    "Junction",
    "Severity",
    "Vehicles",
    "Casualties",
    "Fatalities",
    "Injuries",
    "Weather",
    "Road condition",
    "Verification",
    "Verified",
    "Upvotes",
    "Lat",
    "Lng",
    "Description",
  ];
  const rows: (string | number)[][] = [headers];
  for (const a of incidents) {
    rows.push([
      a.id,
      formatDateTime(a.occurredAt),
      a.district,
      a.ward,
      a.junctionName,
      a.severity,
      (a.vehicleTypes ?? []).join(", "),
      a.casualties,
      a.fatalities,
      a.injuries,
      a.weather,
      a.roadCondition,
      a.verificationStatus,
      a.verified ? "yes" : "no",
      a.upvoteCount,
      a.lat,
      a.lng,
      a.description,
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = autoWidth(rows);
  fillRow(ws, 0, headers.length, NAVY);
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  return ws;
}

function buildAggregationSheet(
  title: string,
  header: string[],
  rows: (string | number)[][]
): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [[title], [], header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = autoWidth(aoa);
  fillRow(ws, 0, header.length, NAVY);
  fillRow(ws, 2, header.length, NAVY);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }];
  return ws;
}

export function buildWorkbook(response: ExportResponse): XLSX.WorkBook {
  const stats = summarize(response.incidents);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildSummarySheet(response.incidents, response), "Summary");
  XLSX.utils.book_append_sheet(wb, buildIncidentsSheet(response.incidents), "Incidents");
  XLSX.utils.book_append_sheet(
    wb,
    buildAggregationSheet(
      "Incidents by Junction",
      ["Junction", "District", "Incidents", "Fatalities"],
      stats.topJunctions.map((j) => [j.junction, j.district, j.incidents, j.fatalities])
    ),
    "By Junction"
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildAggregationSheet(
      "Incidents by Vehicle",
      ["Vehicle", "Count", "Percent"],
      stats.topVehicles.map((v) => [v.vehicle, v.count, `${v.pct}%`])
    ),
    "By Vehicle"
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildAggregationSheet(
      "Incidents by Severity",
      ["Severity", "Count", "Percent"],
      stats.severityBreakdown.map((s) => [s.severity, s.count, `${s.pct}%`])
    ),
    "By Severity"
  );

  return wb;
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}
