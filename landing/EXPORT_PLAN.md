# Road Safety Dar — Export Feature Spec

**Status:** planning → ready to ship
**Owner:** Mwijay Davie
**Created:** 2026-07-11
**Design constraint:** DO NOT change existing color palette (navy #0F172A/#1E293B, blue #1E3A5F/#2563EB/#3B82F6, severity #F87171/#FBBF24/#3B82F6/#22C55E).

---

## 1. Design read

Public-sector safety dashboard for Dar es Salaam. Trust-first audience: traffic police, transport ministry, journalists, insurance. The data — not the chrome — is the product. Restrained motion, generous whitespace, the existing severity palette is the brand.

**Dials (taste-skill):** VARIANCE 4, MOTION 3, DENSITY 5. Match existing.
**Tone (stop-slop):** active voice, specific, no "intelligence" / "AI-powered" / "seamless" / "elevate". No em dashes.

## 2. What we're shipping

A **client-side export module** on the dashboard. Three export modes, two formats each.

### 2.1 PDF (`jspdf` + `jspdf-autotable`)

Single-document A4 portrait, branded header band, footer with page numbers. Sections:

1. Header band (navy `#0F172A`, 12mm tall): logo glyph + "Road Safety Dar es Salaam — Incident Report"
2. Subhead line: date range + filter summary + generated timestamp
3. KPI strip (3-column table): Total · Fatal · Critical+Serious · Minor
4. Severity distribution table (severity · count · %)
5. Top 10 junctions table (junction · district · incidents · fatalities)
6. Top 10 vehicle types table (vehicle · count · %)
7. Recent incidents table (first 50 — id · date · district · severity · vehicle · casualties · fatalities)
8. Footer on every page: "Generated 2026-07-11 14:32 EAT · Page N of M · mwijaydavie@gmail.com"

Filename: `road-safety-dar-incidents-YYYY-MM-DD.pdf`

### 2.2 Excel (`xlsx` / SheetJS)

Workbook with 5 sheets:

1. **Summary** — KPIs, filters, generated_at
2. **Incidents** — full filtered accident data, all 30+ columns
3. **By Junction** — junction · district · incident_count · fatality_count
4. **By Vehicle** — vehicle · count · pct
5. **By Severity** — severity · count · pct

Column widths pre-sized. Header row bold + navy fill + white text.
Filename: `road-safety-dar-incidents-YYYY-MM-DD.xlsx`

### 2.3 Export modes

Three buttons in a sticky export bar at the top of the dashboard:

| Button | Behavior |
|---|---|
| **Export current view (PDF)** | Uses the active filter set on the dashboard. Shows count in the button label. |
| **Export current view (Excel)** | Same as above, Excel format. |
| **Custom export…** | Opens a modal with date range, severity, district, vehicle, status. Preview count live. Two buttons inside: "Export PDF" / "Export Excel". |

If the count is 0, buttons disable with a tooltip "No incidents match the current filter."

## 3. Files to add / change

| Path | Change | Why |
|---|---|---|
| `src/lib/export/pdf.ts` | NEW | jspdf wrapper, builds the PDF from accident array + stats |
| `src/lib/export/excel.ts` | NEW | xlsx wrapper, builds the workbook |
| `src/lib/export/stats.ts` | NEW | Pure functions: `bySeverity`, `byJunction`, `byVehicle`, `summarize` |
| `src/lib/export/types.ts` | NEW | Shared TS types (no `any`) |
| `src/app/api/accidents/export/route.ts` | NEW | GET endpoint, returns up to 5000 records with filter params |
| `src/app/dashboard/page.tsx` | EDIT | Add export bar + custom-export modal, wire it up |
| `src/app/dashboard/ExportBar.tsx` | NEW | Presentational component, no logic |
| `src/app/dashboard/CustomExportModal.tsx` | NEW | Modal with filter form + live count |
| `package.json` | EDIT | Add `jspdf`, `jspdf-autotable`, `xlsx` to dependencies |
| `prisma/schema.prisma` | UNCHANGED | Existing `Accident` model already has all the fields we need |

## 4. API contract: `/api/accidents/export`

```
GET /api/accidents/export?
  from=2026-01-01&to=2026-12-31&
  district=Ilala&
  severity=fatal,critical&
  vehicle=motorcycle,car&
  status=verified
```

Response (200):
```json
{
  "filters": { "from": "...", "to": "...", "district": "...", "severity": [...], "vehicle": [...], "status": "..." },
  "count": 47,
  "generatedAt": "2026-07-11T14:32:00Z",
  "incidents": [ { ...allAccidentFields } ]
}
```

Errors: 400 (bad date), 500 (db).

Limit: 5,000 records per export. If actual count exceeds 5,000, response includes `"truncated": true` and the PDF/Excel UI shows a notice "Showing first 5,000 of N — narrow your filter to see more."

## 5. UI copy (stop-slop compliant)

- Bar title: "Export"
- Button labels: "PDF (this view)" / "Excel (this view)" / "Custom export"
- Modal title: "Custom export"
- Empty state: "No incidents match the current filter. Adjust the dates or pick a wider district."
- Loading: "Generating PDF…" / "Building workbook…" (NOT "Loading…")
- Success toast: "Downloaded road-safety-dar-incidents-2026-07-11.pdf" (no exclamation mark)
- Error: "Couldn't generate the export. Try a smaller date range." (NOT "Oops! Something went wrong")

## 6. Anti-slop cleanup (no color change)

- Home page hero subtitle: drop "AI-powered safety insights" → "safety data from every junction"
- Home page feature 2: drop "🤖 AI-powered recommendations" → "📍 Recommendations for high-risk junctions"
- Home page feature 4: drop "Real-time statistics" → "Live statistics and CSV data export" (we'll also have PDF/Excel — adjust later if user wants)
- Don't add em dashes anywhere new
- Don't add "intelligence" / "seamless" / "elevate" / "next-gen" anywhere

## 7. Verification (after build)

- `npm run typecheck` (per the lesson in memory — `npm run lint` is wired to tsc, NOT eslint)
- `npm run build` — must succeed
- `npm run dev` on port 3000
- Manual smoke: load `/dashboard`, click "PDF (this view)" with default filter → file downloads, opens in Edge, shows branded header
- Manual smoke: click "Excel (this view)" → opens in Excel, all 5 sheets present
- Manual smoke: open custom export, pick a tight filter, click "Export PDF" → file downloads, count matches the modal preview
- Cua-driver: take screenshot of the dashboard with the new export bar visible

## 8. Out of scope (this round)

- Server-side PDF rendering (heavyweight; not needed for ≤5000 records client-side)
- Scheduled email exports
- CSV format (we have Excel — open in Excel → save as CSV)
- Branding redesign (color palette locked)
- Mobile-first redesign of the export modal (works on mobile, but desktop is the target audience)
