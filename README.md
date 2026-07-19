# 🚦 Road Safety Dar es Salaam — Real-time Accident Intelligence

> **Crowdsourced accident hotspot intelligence for Tanzania's commercial capital.**  
> Every report saves a life. Every hotspot identified prevents the next crash.

🟢 **Status:** Production Ready v1.0.0  
📅 **Last updated:** July 2026  
📧 **Contact:** [roadsafetydar@gmail.com](mailto:roadsafetydar@gmail.com)  
🌍 **Live site:** [roadsafety-dar.vercel.app](https://roadsafety-dar.vercel.app)

---

## 📋 Table of Contents

- [1. Project Identity](#1-project-identity)
- [2. Live System Snapshot](#2-live-system-snapshot)
- [3. System Architecture](#3-system-architecture)
- [4. Complete File Structure](#4-complete-file-structure)
- [5. Installation & Setup](#5-installation--setup)
- [6. How to Use It](#6-how-to-use-it)
- [7. Database Schema](#7-database-schema)
- [8. AI Integration Details](#8-ai-integration-details)
- [9. Modification & Addon Guide](#9-modification--addon-guide)
- [10. Deployment Guide](#10-deployment-guide)
- [11. Cost Calculator](#11-cost-calculator)
- [12. Roadmap](#12-roadmap)
- [13. Quick Reference Card](#13-quick-reference-card)

---

## 1. Project Identity

### 🚦 Road Safety Dar es Salaam

**To a 10-year-old:** This is a map that shows where car crashes happen in Dar es Salaam so people know where to be careful and the government knows where to fix the roads.

**To a developer:** A full-stack Next.js 15 application with Supabase backend, real-time Leaflet heat maps, AI-powered safety analysis, role-based verification workflows, multi-format data export (PDF/Excel), and PWA support — purpose-built for crowdsourced traffic incident intelligence in Dar es Salaam, Tanzania.

**The business problem:** Dar es Salaam, one of Africa's fastest-growing cities, has no centralized, publicly accessible system for tracking road accidents. Data is scattered across police stations, hospital records, and word-of-mouth. This means:
- Citizens don't know which junctions are dangerous
- Traffic police have no aggregated view of hotspots
- Urban planners lack data to prioritize infrastructure spending
- Media reports on road safety are based on anecdotes, not data

**What makes this different:**
- **Community-powered:** Anyone can report an accident in 60 seconds, no account required
- **Police-verified workflow:** Reports are not final until verified by traffic police — prevents fake data
- **AI safety briefs:** AI generates plain-language safety summaries from real accident data in English or Swahili
- **Built for Dar es Salaam specifically:** 5 districts, 90+ wards, 1,000+ streets pre-loaded — not a generic "anywhere" tool
- **Free-first stack:** Entirely built on free/freemium tiers — Supabase, Cloudinary, Vercel, and free AI providers
- **PWA-enabled:** Installs like an app on any phone, works offline-capable, no Play Store needed

**Built by:** Mwijay & Fred — engineers who saw a gap and filled it.

---

## 2. Live System Snapshot

### Component Status

| Component | Status | What It Does | Tech Used |
|-----------|--------|-------------|-----------|
| Landing Page | ✅ Live | Hero, KPIs, district overview, SDG 11.2 branding | Next.js 15 Server Component |
| Dashboard Map | ✅ Live | Interactive Leaflet heat map with severity-coded markers | Leaflet, leaflet.heat, Chart.js |
| Report Form | ✅ Live | Accident submission with photo upload and GPS auto-detect | Next.js Client Component, Cloudinary |
| Editor Queue | ✅ Live | Traffic police review/verify/reject workflow | Next.js Client Component |
| Auth System | ✅ Live | Email/password + Google OAuth, guest mode | Supabase Auth + SSR cookies |
| User Profile | ✅ Live | My Reports list, role badge, sign out | Next.js Client Component |
| Authority Console | ✅ Live | User management, role assignment, system KPIs | Next.js Client Component |
| AI Safety Brief | ✅ Live | AI-generated safety summaries in EN/SW | Free AI API (primary + fallback) |
| PDF Export | ✅ Live | Branded PDF reports with KPIs and data tables | jsPDF, jsPDF-AutoTable |
| Excel Export | ✅ Live | Multi-sheet Excel workbooks with summary + details | SheetJS (xlsx) |
| PWA Support | ✅ Live | Manifest, icons, standalone display, install prompt | PWA manifest.json |
| Location API | ✅ Live | Cascading district → ward → street selector | Supabase Location table |
| API Health | ✅ Live | Backend health check endpoint | Next.js API Route |
| Routes | Route | Purpose | Auth |
| Statistics & Charts | ✅ Live | Severity distribution, vehicle types, monthly trends, KPI grid | Chart.js, custom aggregation |
| Responsive Design | ✅ Live | Mobile-first, breakpoints at 820px, touch targets | Tailwind CSS v4 |
| Console Easter Egg | ✅ Live | Branded console.log with verification hash | Inline script |

### What is Fully Working

- ✅ Anonymous accident reporting with photo upload (Cloudinary)
- ✅ GPS auto-detection on page load (browser geolocation API)
- ✅ Cascading location selector (5 districts, all wards/streets)
- ✅ Interactive dashboard map with heat layer + circle markers
- ✅ Severity color coding (green/yellow/orange/red)
- ✅ Hour filter and "Serious Mode" toggle
- ✅ KPI grid with live counts (total, verified, fatal, critical, serious, junctions)
- ✅ AI safety brief generation (English + Swahili, with server-side caching)
- ✅ English / Swahili toggle on AI brief
- ✅ 5-minute server-side cache on AI responses
- ✅ Verification workflow: Pending → Verified / Rejected → Re-open
- ✅ Staff auth guard + role-based UI rendering
- ✅ Guest mode (no account needed to browse)
- ✅ PDF and Excel export with date range, district, severity, vehicle filters
- ✅ Supabase service-role client for admin operations
- ✅ Hardcoded admin email fallback (roadsafetydar@gmail.com)
- ✅ OAuth callback session management with cookie-based SSR auth
- ✅ User profile page with submitted reports list
- ✅ Authority console with user management (role, admin toggles)
- ✅ PWA manifest and meta tags
- ✅ Responsive navigation with scroll-aware gradient/white background
- ✅ 200 seed demo accidents across 25 known hotspots
- ✅ Health check endpoint monitoring Supabase connectivity
- ✅ Build compiles clean (`next build` passes)

### What is Partially Working

- ⚠️ **GPS auto-detect:** Works on HTTPS/secure contexts only; falls back silently to Dar es Salaam center on HTTP or denial
- ⚠️ **Photo upload:** Cloudinary upload preset is hardcoded (not env var); works but not configurable without code change
- ⚠️ **Cloudflare AI fallback:** API key (`CLOUDFLARE_ACCOUNT_ID`) is set but the actual Cloudflare AI token env var was not found — fallback may not function
- ⚠️ **OAuth callback:** Guest mode + email fallback works, but avatar extraction from Google metadata has inconsistent fallback paths
- ⚠️ **Upvote system:** `upvoteCount` field exists in the database but no UI for upvoting on the dashboard

### What is Planned But Not Started

- 📋 **SMS notifications** for verification status via Twilio/AfricasTalking
- 📋 **WhatsApp bot** for reporting accidents via chat
- 📋 **Real-time updates** via Supabase Realtime subscriptions
- 📋 **Advanced analytics** with time-series trend analysis
- 📋 **Mobile app** (Flutter/Expo) wrapping the PWA
- 📋 **Multi-city expansion** (Mwanza, Arusha, Zanzibar)
- 📋 **Public API** for third-party developers
- 📋 **Heat map animation** showing accident hot zones over time



---

## 3. System Architecture

### ASCII Architecture Diagram

```
                           ┌──────────────────────────────────────────────────┐
                           │                  BROWSER (Client)                │
                           │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
                           │  │ Landing  │  │Dashboard │  │  Report Form  │  │
                           │  │  Page   │  │  Map +   │  │  GPS + Photo  │  │
                           │  │         │  │ Charts   │  │  + Mood       │  │
                           │  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
                           │       │              │               │           │
                           │  ┌────▼──────────────▼───────────────▼────────┐  │
                           │  │         PremiumTopNav (Nav Bar)            │  │
                           │  └────────────────────────────────────────────┘  │
                           │                                                   │
                           │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
                           │  │ Editor   │  │Authority │  │   Profile     │  │
                           │  │ Queue    │  │ Console  │  │   Page        │  │
                           │  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
                           │       │              │               │           │
                           │  ┌────▼──────────────▼───────────────▼────────┐  │
                           │  │       Clerk Auth / Guest Cookie           │  │
                           │  └────────────────────────────────────────────┘  │
                           └──────────────────┬───────────────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
        ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
        │   Next.js 15 SSR   │      │  Next.js API Routes│      │   Leaflet CDN      │
        │  (Page Rendering)  │      │   (/api/*)         │      │  (Map Rendering)   │
        └────────────────────┘      └─────────┬──────────┘      └────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
        ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
        │   Supabase Auth    │      │   Supabase REST    │      │   Cloudinary       │
        │  (Email/Google OAuth)│    │   PostgREST API    │      │  (Photo Upload)    │
        │  + SSR Cookies     │      │   (service_role)   │      │                    │
        └────────────────────┘      └─────────┬──────────┘      └────────────────────┘
                                               │
                                                ▼
                                    ┌────────────────────┐
                                    │   Supabase         │
                                    │   PostgreSQL DB    │
                                    │                    │
                                    │  ┌──────────────┐  │
                                    │  │  Accident    │  │
                                    │  │  User        │  │
                                    │  │  UserProfile │  │
                                    │  │  Location    │  │
                                    │  │  Junction    │  │
                                    │  │  AuditLog    │  │
                                    │  │  SiteSettings│  │
                                    │  └──────────────┘  │
                                    └────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
        ┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
        │   Free AI API     │      │  Free AI API       │      │   Vercel           │
        │  (Primary)        │      │  (Fallback)        │      │  (Hosting)         │
        │  AI Safety Briefs  │      │                    │      │                    │
        └────────────────────┘      └────────────────────┘      └────────────────────┘

        LEGEND:
        ───>  Direct HTTP/API call
        ───>  Server-side data flow
        ───>  Client-side rendering / CDN
```

### Step-by-Step: What Happens When a User Reports an Accident

1. **User opens** `/report` — the browser loads the Next.js client component
2. **On page load**, a `useEffect` fires:
   - Fetches `/api/locations` to populate the district dropdown
   - Silently calls `navigator.geolocation.getCurrentPosition()` to capture GPS coordinates
3. **User selects** District → Ward → Street (each selection triggers a fetch to `/api/locations`)
4. **User optionally** drags a photo into the upload zone, clicks "Upload Photo" → the file is sent directly from the browser to `https://api.cloudinary.com/v1_1/roougsg4/image/upload` via `FormData` with the upload preset `darroeadsafety`
5. **User clicks** "Submit Report" — the form:
   - Validates district, ward, and description on the client
   - Builds a JSON payload with form fields, GPS coords, mood tag, photo URL, and timestamps
   - POSTs to `/api/accidents`
6. **Next.js API route** `/api/accidents` receives the request:
   - Validates severity, vehicle type, and optional GPS (defaults to Dar es Salaam center if missing)
   - Builds an insert row with `verificationStatus: "pending"`, `trustLevel: "anonymous"`
   - Inserts into Supabase `Accident` table via service-role client (bypasses RLS)
   - Returns `{ ok: true, id, verificationStatus: "pending" }`
7. **Client receives** 201 response → shows success page with "View Map" link
8. **Traffic Police** (logged in with `isStaff = true`) opens `/editor`:
   - Sees the new report in "Pending" tab
   - Reviews details, photo, location
   - Clicks "Verify" → POST `/api/accidents/[id]/verify` with `{ status: "verified" }`
   - Or clicks "Reject" → prompted for reason → POST with `{ status: "rejected", reason }`
9. **Verified reports** appear on the public dashboard map and in the AI safety brief analysis

---

## 4. Complete File Structure

```
roadsafety-dar-landing/
├── .env                              # Supabase credentials + Cloudflare AI key (NEVER COMMIT)
├── .env.example                      # Template with placeholder values
├── .gitignore                        # Ignores node_modules, .next, dev.db, .env
├── next.config.ts                    # Minimal Next.js config (outputFileTracingRoot)
├── next-env.d.ts                     # Next.js TypeScript reference (auto-generated)
├── package.json                      # Dependencies, scripts, Prisma config
├── package-lock.json                 # Locked dependency tree
├── postcss.config.mjs                # Tailwind CSS v4 PostCSS plugin
├── tsconfig.json                     # TypeScript config (strict mode, path aliases)
├── vercel.json                       # Vercel deploy config (build command, framework)
├── dev.db                            # SQLite dev database (local fallback)
│
├── prisma/
│   ├── schema.prisma                 # 8 database models (Accident, User, Location, etc.)
│   ├── seed.ts                       # Seeds Dar es Salaam locations + 200 demo accidents
│   ├── migrations/
│   │   ├── migration_lock.toml       # PostgreSQL provider lock
│   │   └── 0_init/
│   │       └── migration.sql         # Full DDL for all 8 tables
│
├── public/
│   ├── favicon.svg                   # Browser tab icon
│   ├── manifest.json                 # PWA manifest (standalone, icons)
│   ├── icon-192x192.png              # PWA icon (192px)
│   ├── icon-512x512.png              # PWA icon (512px)
│   ├── badge-72x72.png               # PWA badge icon
│   ├── accident-icon.png             # Report page header graphic
│   ├── accident-protection.png       # Footer brand icon
│   ├── add-report.png                # Dashboard "Report" CTA icon
│   ├── fingerprint-icon.png          # Login page biometric icon
│   ├── map-icon.png                  # Dashboard map marker icon
│   ├── map-icon-2.png                # Dashboard map marker icon (alt)
│   ├── sign-in.png                   # Login page illustration
│   ├── stone-hazard.png              # Authority page hazard icon
│   └── icons.svg                     # Bluesky, Discord, GitHub, X icons sprite
│
├── scripts/
│   ├── use-sqlite.ps1                # Switches Prisma to SQLite provider
│   ├── use-pg.ps1                    # Switches Prisma to PostgreSQL provider
│   └── migrate-from-django.ts        # Migrates legacy Django SQLite DB to Prisma
│
└── src/
    ├── middleware.ts                  # Route guard: /dashboard, /editor, /authority
    │
    ├── app/
    │   ├── globals.css               # Tailwind v4 imports, custom theme, responsive utils
    │   ├── layout.tsx                # Root layout: HTML shell, Leaflet/Chart.js CDN, PWA meta
    │   ├── page.tsx                  # Landing page: hero, KPIs, stats, CTA, footer
    │   │
    │   ├── login/
    │   │   └── page.tsx              # Sign In / Register / Google OAuth / Guest mode
    │   │
    │   ├── dashboard/
    │   │   ├── page.tsx              # Main dashboard: map, charts, KPI grid, AI summary
    │   │   ├── ExportBar.tsx         # Quick + Custom export buttons (PDF/Excel)
    │   │   └── CustomExportModal.tsx # Filtered export dialog with live count
    │   │
    │   ├── report/
    │   │   └── page.tsx              # Accident report form: GPS, photo, mood, location
    │   │
    │   ├── editor/
    │   │   └── page.tsx              # Verification queue: pending/verified/rejected tabs
    │   │
    │   ├── profile/
    │   │   └── page.tsx              # User profile: avatar, role, my reports list
    │   │
    │   ├── authority/
    │   │   └── page.tsx              # Admin console: KPIs, user mgmt, report overview
    │   │
    │   ├── terms/
    │   │   └── page.tsx              # Static Terms of Service page
    │   │
    │   ├── privacy/
    │   │   └── page.tsx              # Static Privacy Policy page
    │   │
    │   ├── auth/
    │   │   ├── callback/
    │   │   │   ├── route.ts          # OAuth code exchange → session cookies
    │   │   │   └── done/page.tsx     # Client-side OAuth completion + profile stash
    │   │
    │   └── api/
    │       ├── accidents/
    │       │   ├── route.ts          # GET (list) + POST (submit) accidents
    │       │   ├── export/route.ts   # GET filtered export data
    │       │   └── [id]/verify/       #
    │       │       └── route.ts      # POST verify/reject accident
    │       ├── locations/route.ts    # GET districts → wards → streets hierarchy
    │       ├── stats/route.ts        # GET aggregated statistics
    │       ├── ai-summary/route.ts   # GET AI safety brief (EN + SW)
    │       ├── me/
    │       │   ├── route.ts          # GET current user profile
    │       │   └── accidents/route.ts # GET user's submitted accidents
    │       ├── auth/
    │       │   ├── me/route.ts       # GET Supabase user + DB role
    │       │   └── register/route.ts # POST create new account
    │       ├── admin/
    │       │   └── users/route.ts    # GET list users, POST update role/flags
    │       └── health/route.ts       # GET system health check
    │
    ├── components/
    │   └── PremiumTopNav.tsx          # Responsive nav: scroll-aware, user menu, mobile drawer
    │
    └── lib/
        ├── supabase.ts               # Browser + admin Supabase clients (singleton)
        ├── supabase-server.ts         # service-role admin client + pingSupabase()
        ├── supabase-browser.ts        # @supabase/ssr browser client for SSR pages
        ├── prisma.ts                  # Prisma singleton (dev only)
        └── export/
            ├── types.ts               # Export types, color constants, severity order
            ├── stats.ts               # Aggregation functions, date formatting
            ├── pdf.ts                 # jsPDF report builder (branded A4)
            └── excel.ts               # SheetJS workbook builder (multi-sheet)
```

---

## 5. Installation & Setup

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20.x+ | [nodejs.org](https://nodejs.org/) |
| npm | 10.x+ | Ships with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| Supabase Account | Free | [supabase.com](https://supabase.com) |
| Cloudinary Account | Free | [cloudinary.com](https://cloudinary.com) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/mwijaydavie/rs-dsm.git
cd rs-dsm
```

**Expected output:**
```
Cloning into 'rs-dsm'...
remote: Enumerating objects: ...
Receiving objects: 100% (.../...), done.
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added XXXX packages in XXs
```
If you see `ERR!` check your Node.js version (`node --version` must be 18+).

### Step 3: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project (name: `road-safety-dar`, password: choose a strong one, region: closest to Tanzania e.g. `South Africa (af-south-1)`)
3. Wait 1-2 minutes for the database to provision
4. Copy these from **Project Settings → API**:
   - `Project URL` (looks like `https://xxxxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (click "Reveal")

### Step 4: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id  # Optional, for AI fallback
```

### Step 5: Push Database Schema

```bash
npx prisma generate
npx prisma db push
```

**Expected output:**
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client to node_modules/@prisma/client
```

If you see authentication errors, double-check your `DATABASE_URL` in `.env`.

### Step 6: Seed Location Data & Demo Accidents

```bash
npx tsx prisma/seed.ts
```

**Expected output:**
```
Seeding database...
Imported XXXX locations
Seeded 200 demo accidents
Site settings seeded
```

### Step 7: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
```
Open `http://localhost:3000` in your browser. You should see the landing page.

### Step 8: Verify It Works

1. **Landing page:** Scroll through hero section, KPI grid, feature cards, and footer
2. **Dashboard:** Visit `/dashboard` — see the heat map with demo data
3. **Report form:** Visit `/report` — fill and submit a test report
4. **Login:** Visit `/login` — register an account, sign in
5. **Editor:** Log in, set your role to staff via Supabase SQL editor:
   ```sql
   UPDATE "User" SET "isStaff" = true WHERE email = 'your@email.com';
   ```
   Then visit `/editor` to see the verification queue

### Common Setup Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `prisma: error Environment variable not found: DATABASE_URL` | `.env` missing or incorrect | Copy `.env.example` to `.env` and fill in real values |
| `supabase: AuthRetryableFetchError` | Supabase URL or anon key wrong | Double-check values from Supabase dashboard |
| `Module not found: Can't resolve '@supabase/ssr'` | Dependencies not installed | Run `npm install` |
| `Error: listen EADDRINUSE :::3000` | Port 3000 already in use | Kill the other process or use `npm run dev -- -p 3001` |
| `(node:...) ExperimentalWarning: --experimental-loader` | Node.js version warning | Safe to ignore; upgrade to Node 20+ |
| `Failed to submit report` in browser console | API validation fails | Check server terminal for the actual validation error message |
| `Cloudinary: Upload preset not found` | Preset not created | Go to Cloudinary Settings → Upload → Create preset named `darroeadsafety` |

---

## 6. How to Use It

### 6.1 View the Landing Page

**What it does:** Shows the project overview, key statistics, and navigation to main features.

Open `http://localhost:3000` — you'll see:
- A hero section with "Road Safety Dar es Salaam" branding
- Live KPI badges (1,200+ Reports, 850+ Verified, 60+ Junctions, 40% Police Verified)
- Feature cards (Report an Accident, Dashboard, Live Hotspots, Data Export)
- Footer with district links and SDG 11.2 reference

### 6.2 Report an Accident (POST `/api/accidents`)

**What it does:** Submit a new accident report to the system.

**Browser form:** Visit `/report`, fill in all fields, click "Submit Report".

**Direct API call:**
```bash
curl -X POST http://localhost:3000/api/accidents \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "serious",
    "vehicleType": "car",
    "casualties": 2,
    "fatalities": 0,
    "injuries": 1,
    "description": "Two cars collided at Mwenge intersection",
    "weather": "clear",
    "roadCondition": "good",
    "contact": "0712345678",
    "lat": -6.772,
    "lng": 39.230,
    "district": "Kinondoni",
    "ward": "Mwenge",
    "locationId": "Mwenge Road",
    "photoUrl": "",
    "occurredAt": "2026-07-12T14:30:00.000Z"
  }'
```

**Success response (201):**
```json
{
  "ok": true,
  "id": 201,
  "verificationStatus": "pending",
  "message": "Report received. An editor will review it before it appears on the public map.",
  "_meta": { "latencyMs": 234 }
}
```

**Validation error response (400):**
```json
{
  "error": "Validation failed",
  "detail": "severity must be one of: minor, serious, critical, fatal"
}
```

### 6.3 List Accidents (GET `/api/accidents`)

**What it does:** Returns all accidents, optionally filtered by verification status.

```bash
curl http://localhost:3000/api/accidents?status=verified
```

**Response (200):**
```json
[
  {
    "id": 1,
    "lat": -6.816,
    "lng": 39.273,
    "severity": "serious",
    "vehicleTypes": ["car"],
    "district": "Ilala",
    "occurredAt": "2026-06-15T08:30:00.000Z",
    "casualties": 3,
    "fatalities": 0,
    "verified": true,
    "trustLevel": "anonymous",
    "upvoteCount": 0,
    "verificationStatus": "verified",
    "photoUrl": "",
    "description": "Accident at Kariakoo Market",
    "intensity": 2
  }
]
```

### 6.4 Verify an Accident (POST `/api/accidents/[id]/verify`)

**What it does:** Staff-only endpoint. Approves or rejects a pending report.

```bash
curl -X POST http://localhost:3000/api/accidents/1/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"status": "verified"}'
```

**Success response (200):**
```json
{
  "ok": true,
  "id": 1,
  "verificationStatus": "verified"
}
```

### 6.5 Get AI Safety Brief (GET `/api/ai-summary`)

**What it does:** AI-generated plain-language summary of recent accidents.

```bash
curl "http://localhost:3000/api/ai-summary?lang=en"
```

**Response (200):**
```json
{
  "ok": true,
  "text": "In the last 30 days, Dar es Salaam recorded 45 serious accidents. The most dangerous district is Kinondoni with 15 incidents. Motorcycle accidents account for 40% of all cases. Stay alert at Mwenge intersection and Ubungo bus terminal.",
  "provider": "groq",
  "ms": 1234,
  "cached": false,
  "incidentCount": 45
}
```

**Swahili version:**
```bash
curl "http://localhost:3000/api/ai-summary?lang=sw"
```

### 6.6 Export Data (GET `/api/accidents/export`)

**What it does:** Returns filtered accident data for PDF/Excel export.

```bash
curl "http://localhost:3000/api/accidents/export?from=2026-01-01&to=2026-07-12&district=Kinondoni&severity=serious,fatal"
```

**Response (200):**
```json
{
  "filters": { "from": "2026-01-01", "to": "2026-07-12", "district": "Kinondoni", "severity": ["serious", "fatal"] },
  "count": 23,
  "total": 23,
  "incidents": [ ... ]
}
```

### 6.7 Health Check (GET `/api/health`)

```bash
curl http://localhost:3000/api/health
```

**Response (200):**
```json
{
  "status": "ok",
  "supabase": { "ok": true, "count": 201, "latencyMs": 45 },
  "env": { "supabaseUrl": true, "anonKey": true, "serviceKey": true },
  "node": "v22.x.x",
  "uptime": 12345
}
```

---

## 7. Database Schema

### Model: Accident

Primary accident report table. Stores all submitted and verified incidents.

| Field | Type | Default | Example | Description |
|-------|------|---------|---------|-------------|
| `id` | Int (PK) | auto | 1 | Auto-incrementing ID |
| `lat` | Float | — | -6.816 | GPS latitude |
| `lng` | Float | — | 39.273 | GPS longitude |
| `h3Cell` | String | `""` | — | Uber H3 geospatial index (reserved) |
| `district` | String | `""` | "Kinondoni" | Dar es Salaam district |
| `ward` | String | `""` | "Mwenge" | Ward name |
| `locationId` | String | `""` | "Mwenge Road" | Street/location name (not FK) |
| `junctionName` | String | `""` | "Kariakoo" | Named junction/hotspot |
| `junctionId` | Int? | null | 5 | FK to Junction table |
| `occurredAt` | DateTime | — | 2026-06-15 | When the accident happened |
| `reportedAt` | DateTime | now() | 2026-06-15 | When it was reported |
| `severity` | String | — | "serious" | minor / serious / critical / fatal |
| `vehicleTypes` | String | `"[]"` | `["car","bus"]` | JSON-encoded array |
| `reporterType` | String | `"community"` | "community" | community / police / editor |
| `casualties` | Int | 0 | 3 | Total people involved |
| `fatalities` | Int | 0 | 1 | Deaths |
| `injuries` | Int | 0 | 2 | Injured |
| `description` | String | `""` | "Head-on collision" | Free-text description |
| `weather` | String | `""` | "rainy" | Weather condition |
| `roadCondition` | String | `""` | "wet" | Road surface condition |
| `contact` | String | `""` | "+255712345678" | Reporter contact |
| `photoUrl` | String | `""` | "https://res.cloudinary.com/..." | Cloudinary photo URL |
| `sourceNotes` | String | `""` | — | Internal notes |
| `verified` | Boolean | false | true | Approval flag |
| `isDemo` | Boolean | false | true | Demo seed data flag |
| `submittedById` | Int? | null | 3 | FK to User who submitted |
| `trustLevel` | String | `"anonymous"` | "anonymous" | Trust scoring string |
| `upvoteCount` | Int | 0 | 0 | Community applauds |
| `verificationStatus` | String | `"pending"` | "verified" | pending / verified / rejected |
| `officialNotes` | String? | null | — | Editor/official notes |
| `rejectionReason` | String? | null | "Duplicate" | Why rejected |
| `verifiedById` | Int? | null | 1 | FK to User who verified |
| `verifiedAt` | DateTime? | null | 2026-06-16 | When verified |
| `createdAt` | DateTime | now() | — | Record creation timestamp |
| `updatedAt` | DateTime | auto | — | Last modification |

**Indexes:** `(lat, lng)`, `(occurredAt, severity)`, `(district)`, `(verificationStatus)`  
**Relations:** `submittedBy → User`, `verifiedBy → User`, `junction → Junction`, `upvotes → AccidentUpvote[]`, `auditLogs → AuditLog[]`

### Model: Location

Pre-seeded Dar es Salaam geographic hierarchy (1,000+ entries from official CSV).

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | Int (PK) | 1 | Auto-increment |
| `region` | String | "DAR-ES-SALAAM" | Region name |
| `regionCode` | Int | 8 | Region code |
| `district` | String | "Kinondoni" | District name |
| `districtCode` | Int | 2 | District code |
| `ward` | String | "Mwenge" | Ward name |
| `wardCode` | Int | 15 | Ward code |
| `street` | String | "Mwenge Road" | Street name |
| `places` | String | "Near Mwenge Bus Stand" | Landmark / place description |
| `lat` | Float? | -6.772 | Approximate latitude |
| `lng` | Float? | 39.230 | Approximate longitude |

**Indexes:** `(region)`, `(district)`, `(ward)`, `(regionCode, districtCode, wardCode)`

### Model: User

Legacy/local user accounts. Supabase Auth is the primary auth system; this table stores metadata.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment |
| `username` | String (unique) | Unique username |
| `email` | String (unique) | Email address |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `password` | String | Password hash (legacy, "!supabase-managed" for OAuth users) |
| `isActive` | Boolean | Account active flag |
| `isStaff` | Boolean | Can access editor queue |
| `isSuperuser` | Boolean | Can access authority console |
| `lastLogin` | DateTime? | Last sign-in timestamp |
| `dateJoined` | DateTime | Account creation date |

### Model: UserProfile

Extended profile linked to Supabase Auth.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment |
| `userId` | Int (unique, FK → User) | Links to User table |
| `role` | String | "community" / "editor" / "admin" |
| `phone` | String | Contact phone |
| `emailNotifications` | Boolean | Notification preference |
| `supabaseUid` | String? (unique) | Supabase Auth UID |
| `avatarUrl` | String? | Profile picture URL |

### Model: Junction

Named accident-prone locations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment |
| `name` | String (unique) | Junction name (e.g. "Kariakoo") |
| `slug` | String | URL-friendly slug |
| `lat` | Float | Latitude |
| `lng` | Float | Longitude |
| `district` | String | District name |
| `description` | String | Description |
| `isDemo` | Boolean | Demo data flag |

### Model: AccidentUpvote

Many-to-many relation for community applauds.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment |
| `accidentId` | Int (FK → Accident) | Which accident |
| `userId` | Int (FK → User) | Who applauded |

**Unique constraint:** `(accidentId, userId)`

### Model: AuditLog

Tracks verification actions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int (PK) | Auto-increment |
| `accidentId` | Int? (FK) | Related accident |
| `userId` | Int? (FK) | Who performed the action |
| `action` | String | e.g. "verified", "rejected", "re-opened" |
| `description` | String | Free-text details |

### Model: SiteSettings

Singleton app configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | Int (PK) | 1 | Always 1 |
| `showDemoData` | Boolean | true | Toggle demo accidents on/off |

---

## 8. AI Integration Details

### Model Choice: Free AI API (Primary + Fallback)

**Why this approach:**
- **Speed:** Responses in under 2 seconds with the primary provider's fast inference
- **Cost:** Generous free tiers — zero cost for current scale
- **Swahili support:** Handles Swahili well, which is critical for the `/api/ai-summary?lang=sw` feature
- **Reliability:** Two providers configured — primary for speed, fallback for redundancy

### System Prompt

The prompt is dynamically constructed with real accident data. Here's the actual template:

```
You are a road safety analyst for Dar es Salaam, Tanzania.
Summarize the recent accident data below in {language} language.

Keep it:
- Short (3-5 sentences)
- Easy to understand
- Focus on what a driver should know

DATA:
- Period: {period}
- Total incidents: {total}
- Fatal accidents: {fatal}
- Serious accidents: {serious}
- Most affected district: {topDistrict} ({topDistrictCount} incidents)
- Top vehicle types involved: {topVehicles}
- Top locations: {topLocations}

Write in a clear, helpful tone. Do NOT use bullet points.
```

### Dynamic Construction

```typescript
// From src/app/api/ai-summary/route.ts
const period = "last 30 days";
const total = 45;
const fatal = 3;
const serious = 12;
const topDistrict = "Kinondoni";
const topDistrictCount = 15;
const topVehicles = "motorcycle (40%), car (35%)";
const topLocations = "Mwenge, Ubungo, Kariakoo";
const language = lang === "sw" ? "Swahili" : "English";

const prompt = `You are a road safety analyst...` // as above with values injected
```

### Token Usage & Cost

| Metric | Value |
|--------|-------|
| Average input tokens | ~450 (prompt + data) |
| Average output tokens | ~200 (3-5 sentence summary) |
| Cost per request (free tier) | $0.00 |
| Cost per request (paid tier) | ~$0.0004 |
| Cache hits | ~60% (5-minute TTL) |
| Monthly requests (est.) | 3,000 @ current scale |
| Monthly cost | $0.00 (free tier) |

### Error Handling

| Error | What Happens |
|-------|-------------|
| Primary AI timeout | Falls back to secondary AI provider |
| Secondary AI timeout | Returns `{ ok: false, error: "AI service unavailable" }` |
| No accident data in 30 days | Returns graceful message: "Not enough data to generate a summary" |
| Malformed response | Truncates to safe length, strips markdown |
| Rate limit (429) | Falls back to secondary provider; if both rate-limited, returns cache if available |

### Ideas for Improvement

- **Fine-tune on Swahili road safety terminology** for better local language quality
- **Add location-specific briefs** (e.g., "Kinondoni District Weekly Brief")
- **Incorporate historical comparison** ("30% more accidents than last month")
- **Multi-turn analysis** — allow users to ask follow-up questions
- **Audio summaries** via ElevenLabs or local TTS for accessibility

---

## 9. Modification & Addon Guide

### MOD 1: Add a New AI Model (e.g., Switch to GPT-4o)

- **Difficulty:** ⭐⭐ (2/5)
- **Time:** 1-2 hours
- **Files to modify:** `src/app/api/ai-summary/route.ts`
- **New files:** None
- **Dependencies:** `npm install openai`

**Steps:**
1. Add `OPENAI_API_KEY` to `.env`
2. In `route.ts`, import `OpenAI` from `openai`
3. Add a new provider block:
```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 300,
});
```
4. Set `provider = "openai"` in the response
5. Make the new model the primary, the current free provider the fallback (or vice versa)

**Test:** Call `GET /api/ai-summary` and verify the response includes `"provider": "openai"`.

### MOD 2: Add SMS Notifications via Twilio

- **Difficulty:** ⭐⭐⭐ (3/5)
- **Time:** 4-6 hours
- **Files to modify:** `src/app/api/accidents/[id]/verify/route.ts`
- **New files:** `src/lib/sms.ts`
- **Dependencies:** `npm install twilio`

**Steps:**
1. Get a Twilio account (free trial credit available)
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to `.env`
3. Create `src/lib/sms.ts`:
```typescript
import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export async function sendVerificationSMS(phone: string, status: string) {
  await client.messages.create({
    body: `Your Road Safety Dar report has been ${status}. Thank you for contributing.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}
```
4. In the verify route, after successful verification, call `sendVerificationSMS` if the accident has a phone contact

**Test:** Verify an accident with a known phone number → confirm SMS arrives.

### MOD 3: Add Real-Time Updates (Supabase Realtime)

- **Difficulty:** ⭐⭐⭐ (3/5)
- **Time:** 3-4 hours
- **Files to modify:** `src/app/dashboard/page.tsx`
- **New files:** None
- **Dependencies:** Already included (`@supabase/supabase-js`)

**Steps:**
1. In the dashboard page, subscribe to the `Accident` table:
```typescript
import { supabase } from "@/lib/supabase-browser";
useEffect(() => {
  const channel = supabase
    .channel("accidents-realtime")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "Accident" },
      (payload) => { refreshData(); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```
2. Refresh the map markers and KPI data when a change is received
3. Add a small "Live" indicator badge to the dashboard

**Test:** Open dashboard in two windows; submit a report in one → see it appear in the other.

### MOD 4: Add WhatsApp Reporting Bot

- **Difficulty:** ⭐⭐⭐⭐ (4/5)
- **Time:** 1-2 weeks
- **New files:** `src/app/api/whatsapp/route.ts`, `src/lib/whatsapp.ts`
- **Dependencies:** Twilio WhatsApp API or WhatsApp Cloud API (Meta)

**Steps:**
1. Set up a WhatsApp Business Account via Meta Developer Portal
2. Create a webhook endpoint at `POST /api/whatsapp` to receive incoming messages
3. Parse the message for accident details (location, severity, photo)
4. Call the existing `POST /api/accidents` internally
5. Reply with the confirmation and report ID

**Test:** Send a WhatsApp message with accident details → receive a confirmation.

### MOD 5: Add Multi-City Support

- **Difficulty:** ⭐⭐⭐ (3/5)
- **Time:** 3-5 days
- **Files to modify:** `src/app/api/locations/route.ts`, `prisma/seed.ts`, `src/app/report/page.tsx`
- **New files:** CSV data files for Mwanza, Arusha, etc.

**Steps:**
1. Obtain location CSVs for new cities (Tanzania open data portals)
2. Add a `city` field to the `Location` table
3. Update the seed script to import all cities
4. Update the `/api/locations` endpoint to accept `?city=...` parameter
5. Update the report form and dashboard to include a city selector

### MOD 6: Add Public API

- **Difficulty:** ⭐⭐⭐⭐ (4/5)
- **Time:** 1 week
- **New files:** `src/app/api/v1/...`, `src/lib/api-auth.ts`
- **Dependencies:** None

**Steps:**
1. Create a versioned API structure under `src/app/api/v1/`
2. Add API key authentication (store keys in a new `ApiKey` table)
3. Provide endpoints: `GET /api/v1/accidents`, `GET /api/v1/stats`, `GET /api/v1/hotspots`
4. Add rate limiting (e.g., 100 req/min per key)
5. Document the API with examples

### MOD 7: Add User Upvoting (Community Applauds)

- **Difficulty:** ⭐ (1/5)
- **Time:** 2 hours
- **Files to modify:** `src/app/dashboard/page.tsx`
- **New files:** `src/app/api/accidents/[id]/upvote/route.ts`

**Steps:**
1. Create a new API route `POST /api/accidents/[id]/upvote`
2. Insert into `AccidentUpvote` table
3. Increment `Accident.upvoteCount`
4. Add a 👍 button to each marker/incident card on the dashboard

### MOD 8: Add Analytics Tracking (PostHog)

- **Difficulty:** ⭐ (1/5)
- **Time:** 1 hour
- **Files to modify:** `src/app/layout.tsx`
- **Dependencies:** `npm install posthog-js`

**Steps:**
1. Sign up for PostHog (generous free tier: 1M events/month)
2. Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env`
3. In `layout.tsx`:
```typescript
import posthog from "posthog-js";
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}
```
4. Track key events: report_submitted, verified, dashboard_viewed, export_downloaded

---

## 10. Deployment Guide

### Deploy to Vercel (Recommended)

**Step 1:** Push your code to GitHub
```bash
git add -A
git commit -m "ready for production"
git push origin main
```

**Step 2:** Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New → Project"
3. Select your `rs-dsm` repository
4. Vercel auto-detects Next.js framework

**Step 3:** Configure Environment Variables

In Vercel Project Settings → Environment Variables, add all variables from your `.env`:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:...` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `SUPABASE_SERVICE_KEY` | `sb_secret_...` |
| `SUPABASE_JWT_SECRET` | your JWT secret |
| `CLOUDFLARE_ACCOUNT_ID` | (optional) |

**Step 4:** Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Your site is live at `https://rs-dsm.vercel.app`

**Step 5:** Set Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your domain (e.g., `roadsafetydar.go.tz`)
3. Configure DNS (CNAME to `cname.vercel-dns.com`)

### Supabase Production Checklist

```sql
-- Enable Row Level Security (RLS) on all tables
ALTER TABLE "Accident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;

-- Create a policy for public reads on verified accidents
CREATE POLICY "Public can read verified accidents"
ON "Accident" FOR SELECT
USING (verificationStatus = 'verified' OR isDemo = true);

-- Create a policy for service-role admin writes
-- (No policy needed — service-role bypasses RLS)
```

### Monitoring After Deployment

| Check | How | Frequency |
|-------|-----|-----------|
| Health endpoint | `curl https://your-site.com/api/health` | Every 5 min (Uptime Robot free tier) |
| Error logs | Vercel Dashboard → Logs → Runtime Logs | After each deploy |
| Supabase status | [status.supabase.com](https://status.supabase.com) | Daily |
| Database size | Supabase Dashboard → Database → Database size | Weekly |
| Free tier limits | Vercel Dashboard → Usage | Monthly |

### Rollback Procedure

```bash
# Option 1: Quick rollback via Vercel
Vercel Dashboard → Deployments → Find last working deploy → ⋮ → Promote to Production

# Option 2: Git revert
git revert HEAD --no-edit
git push origin main
# Vercel auto-deploys the revert
```

---

## 11. Cost Calculator

### Current Monthly Costs

| Service | Free Tier Limit | Current Usage | Monthly Cost |
|---------|----------------|---------------|-------------|
| Vercel (Hosting) | 100 GB bandwidth, 6000 build mins | ~5 GB, ~200 build mins | **$0** |
| Supabase (Database + Auth) | 500 MB DB, 50,000 users, 2 GB bandwidth | ~50 MB, ~100 users, ~500 MB | **$0** |
| Supabase (Auth) | 50,000 monthly active users | ~50 MAU | **$0** |
| Cloudinary (Photos) | 25 GB storage, 25 GB bandwidth | ~100 MB, ~500 MB | **$0** |
| Free AI API (Primary) | 10,000+ requests/day | ~100 requests/day | **$0** |
| Free AI API (Fallback) | 10,000 requests/day | ~10 requests/day (fallback only) | **$0** |
| Cloudinary (Transformations) | 25 transformed images/month | ~0 | **$0** |
| GitHub (Source Control) | Unlimited public repos | 1 repo | **$0** |
| **Total** | | | **$0.00/month** |

### Projected Costs at Scale

| Service | 1,000 Users | 10,000 Users | 100,000 Users |
|---------|-------------|--------------|---------------|
| Vercel Pro ($20/mo) | $20 | $20 | $20 |
| Supabase Pro ($25/mo) | $25 | $25 | $25 |
| Vercel Bandwidth overage | $0 | $0 | $20-$100 |
| Supabase Bandwidth overage | $0 | $0 | $10-$50 |
| Cloudinary ($89/mo tier) | $0 | $0 | $89 |
| AI API (paid) | $0 | $0 | $5-$20 |
| **Total** | **$45/mo** | **$45/mo** | **~$200-$300/mo** |

**Key insight:** The current stack scales to ~1,000 users at zero cost. The first paid tier is Vercel Pro ($20/mo) + Supabase Pro ($25/mo) = $45/month, which handles up to ~50,000 users.

### Cost Optimization Tips

- **CDN caching:** Add `Cache-Control` headers to API responses for frequently accessed data (locations, stats)
- **Image optimization:** Serve Cloudinary photos with `w_400,c_scale` to reduce bandwidth
- **Database indexing:** Ensure all query filters have indexes (already done for `lat/lng`, `occurredAt`, `severity`, `district`, `verificationStatus`)
- **AI caching:** Current 5-minute cache reduces API calls significantly
- **Pagination:** Add pagination to `GET /api/accidents` to reduce payload size

---

## 12. Roadmap

### Short Term (Next 2 Weeks)

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 1 | SMS notifications for verification status | High | 2 days |
| 2 | Community upvoting (applauds) on dashboard | Medium | 1 day |
| 3 | Pagination on dashboard map + accident list | High | 2 days |
| 4 | Fix Cloudflare AI fallback (add missing API token) | Medium | 2 hours |
| 5 | Migrate hardcoded admin email to env var | Medium | 1 hour |

### Medium Term (Next 3 Months)

| # | Feature | Why |
|---|---------|-----|
| 1 | WhatsApp bot for reporting | Reaches users who don't have smartphones or data for the website |
| 2 | Monthly PDF report auto-generated and emailed to subscribers | Keeps stakeholders informed without logging in |
| 3 | District-level heat map filtering | Allows police and planners to focus on their jurisdiction |
| 4 | Historical trend charts (compare month-over-month) | Shows whether road safety is improving |
| 5 | User leaderboard (most reports, most verified) | Gamifies community participation |
| 6 | Anonymous data sharing agreement with TANROADS | Government adoption unlocks funding and impact |
| 7 | Mobile app (Flutter/Expo) wrapping the PWA with push notifications | Native experience drives engagement |

### Long Term (6-12 Months)

**Version 2.0 Vision:**

Road Safety Dar es Salaam becomes **the national road safety intelligence platform for Tanzania**, expanding city-by-city:
1. **Mwanza** — Lake Zone commercial hub, second city
2. **Arusha** — EAC capital, northern tourist corridor
3. **Zanzibar** — Tourism-dependent island with unique traffic patterns
4. **Dodoma** — National capital, new city with growing traffic
5. **Mbeya** — Southern highlands gateway
6. **Mtwara** — Southern port city

**Beyond MVP:**
- **AI predictive hotspots:** Use historical data + ML to predict where accidents will happen next week
- **Insurance API:** Licensed insurance companies can pull verified accident data for claims processing
- **Emergency services integration:** Auto-notify ambulances, fire, and police when a serious/fatal report is submitted near them
- **Road quality crowdsourcing:** Users can report potholes, broken traffic lights, missing signage
- **School safety zones:** Map and monitor accidents near schools; advocate for speed bumps and crossing guards
- **Public dashboard for media:** Media outlets embed real-time accident maps on their news sites
- **Government contract:** Sell annual subscription to TANROADS, SUMATRA, and city councils for data access + custom reports

**Monetization strategy (if needed):**
- Government contracts (annual data license)
- ESG reporting for corporations (e.g., infor for fleet safety analytics)
- API access for insurance and logistics companies
- Advertising from road safety brands, driving schools, insurance companies

---

## 13. Quick Reference Card

### 🚀 Start the Development Server

```bash
npm run dev
# → http://localhost:3000
```

### 🏗️ Build for Production

```bash
npm run build
# → .next/ (deploy to Vercel)
```

### 🗄️ Database Commands

```bash
npx prisma generate       # Generate Prisma client after schema changes
npx prisma db push        # Push schema to database (careful in production)
npx tsx prisma/seed.ts    # Seed locations + demo data
```

### 📡 Most Important API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accidents` | GET | List accidents (`?status=pending\|verified\|rejected`) |
| `/api/accidents` | POST | Submit a new accident report |
| `/api/accidents/export` | GET | Export filtered data (`?from=&to=&district=&severity=&vehicle=&status=`) |
| `/api/locations` | GET | Get districts (`?district=X&ward=Y` for cascade) |
| `/api/stats` | GET | Dashboard statistics |
| `/api/ai-summary` | GET | AI safety brief (`?lang=en\|sw`) |
| `/api/health` | GET | System health check |

### 🔐 Key Environment Variables

```env
DATABASE_URL=postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_KEY=sb_secret_...
```

### 🔧 Common Fix Commands

```bash
# "Cannot find module @prisma/client"
npx prisma generate

# "Port 3000 already in use"
npm run dev -- -p 3001

# "Database does not exist"
npx prisma db push

# "TypeScript errors in new code"
npx tsc --noEmit

# "Reset demo data"
npx tsx prisma/seed.ts

# "Switch to SQLite for local dev"
.\scripts\use-sqlite.ps1
```

### 📁 Important File Paths

| File | Purpose |
|------|---------|
| `src/app/api/accidents/route.ts` | Core accident CRUD |
| `src/app/report/page.tsx` | Report form UI |
| `src/app/dashboard/page.tsx` | Main dashboard with map |
| `src/app/editor/page.tsx` | Verification queue |
| `prisma/schema.prisma` | Full database schema |
| `src/lib/supabase-server.ts` | Service-role client |
| `src/middleware.ts` | Auth route guard |
| `src/components/PremiumTopNav.tsx` | Navigation bar |
| `src/app/globals.css` | Tailwind theme + utilities |

---

> 🚦 **Every report saves a life. Every hotspot identified prevents the next crash.**  
> Built with ❤️ for Dar es Salaam, Tanzania.  
> Contact: [roadsafetydar@gmail.com](mailto:roadsafetydar@gmail.com)
