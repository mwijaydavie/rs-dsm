// GET  /api/accidents           — list accidents (Supabase REST)
// POST /api/accidents           — public community report submission
//                                  (no auth required; contact required)
//
// Migrated from Prisma/PostgreSQL to Supabase PostgREST.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["pending", "verified", "rejected"] as const;
type Status = (typeof ALLOWED_STATUS)[number];

const SEVERITY_WEIGHT: Record<string, number> = {
  minor: 1,
  serious: 2,
  critical: 3,
  fatal: 4,
};

const ALLOWED_SEVERITY = ["minor", "serious", "critical", "fatal"] as const;
const ALLOWED_VEHICLE = [
  "motorcycle",
  "car",
  "bus",
  "truck",
  "bicycle",
  "pedestrian",
] as const;

export async function GET(request: NextRequest) {
  const start = Date.now();
  const { searchParams } = new URL(request.url);
  const statusRaw = searchParams.get("status");
  const status: Status | null =
    statusRaw && (ALLOWED_STATUS as readonly string[]).includes(statusRaw)
      ? (statusRaw as Status)
      : null;

  const sb = getSupabaseAdmin();

  let query = sb
    .from("Accident")
    .select(
      "id, lat, lng, severity, vehicleTypes, district, junctionName, occurredAt, casualties, fatalities, verified, trustLevel, upvoteCount, verificationStatus, photoUrl, description"
    )
    .order("occurredAt", { ascending: false })
    .limit(1000);

  if (status) {
    query = query.eq("verificationStatus", status);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[api/accidents] supabase error:", error.message);
    return NextResponse.json(
      {
        error: "Upstream database error",
        detail: error.message,
        _meta: { source: "supabase-failed", latencyMs: Date.now() - start },
      },
      { status: 503 }
    );
  }

  const data = (rows ?? []).map((a: any) => {
    let vehicleTypes: string[] = [];
    try {
      vehicleTypes = JSON.parse(a.vehicleTypes || "[]");
    } catch {
      /* ignore */
    }
    return {
      ...a,
      vehicleTypes,
      intensity: SEVERITY_WEIGHT[a.severity] || 1,
      occurredAt:
        typeof a.occurredAt === "string"
          ? a.occurredAt
          : new Date(a.occurredAt).toISOString(),
    };
  });

  return NextResponse.json(data);
}

// POST /api/accidents
// Public community report. The form on /report already includes a `contact`
// field (phone or email) so we don't require an auth session.
export async function POST(request: NextRequest) {
  const start = Date.now();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ----- Validate -----
  const errors: string[] = [];

  const severity = String(body.severity ?? "").toLowerCase();
  if (!(ALLOWED_SEVERITY as readonly string[]).includes(severity)) {
    errors.push("severity must be one of: minor, serious, critical, fatal");
  }

  const vehicleType = String(body.vehicleType ?? "").toLowerCase();
  if (!(ALLOWED_VEHICLE as readonly string[]).includes(vehicleType)) {
    errors.push(
      "vehicleType must be one of: motorcycle, car, bus, truck, bicycle, pedestrian"
    );
  }

  // GPS coordinates — if the browser provides them use them, otherwise default
  // to Dar es Salaam center so the report still goes through. The user's
  // district/ward/street selection is the primary location indicator.
  const rawLat = Number(body.lat);
  const rawLng = Number(body.lng);
  const lat =
    Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90
      ? rawLat
      : -6.792;
  const lng =
    Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180
      ? rawLng
      : 39.208;

  const contact = String(body.contact ?? "").trim();

  const casualties = Number(body.casualties ?? 0) || 0;
  const fatalities = Number(body.fatalities ?? 0) || 0;
  const injuries = Number(body.injuries ?? 0) || 0;

  const description = body.description ? String(body.description).trim() : "";
  // The form allows blank weather/roadCondition/photoUrl/contact; the DB columns
  // are NOT NULL, so substitute empty strings instead of NULL.
  const weather = body.weather ? String(body.weather).trim() : "";
  const roadCondition = body.roadCondition
    ? String(body.roadCondition).trim()
    : "";
  const district = body.district ? String(body.district).trim() : "";
  const ward = body.ward ? String(body.ward).trim() : "";
  // The form sends the street name string as locationId; the DB column is TEXT
  // so store it directly. Editors can reassign the proper Location row later.
  const locationId = body.locationId
    ? String(body.locationId).trim()
    : "";
  const photoUrl = body.photoUrl ? String(body.photoUrl).trim() : "";
  const occurredAt = body.occurredAt
    ? new Date(body.occurredAt).toISOString()
    : new Date().toISOString();

  // ----- Link to authenticated user if logged in -----
  let submittedById: number | null = null;
  try {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() { /* read-only */ },
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const admin = getSupabaseAdmin();
      const { data: profile } = await admin
        .from("UserProfile")
        .select("userId")
        .eq("supabaseUid", user.id)
        .maybeSingle();
      if (profile) {
        submittedById = (profile as any).userId;
      } else if (user.email) {
        const { data: userMatch } = await admin
          .from("User")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
        if (userMatch) {
          submittedById = (userMatch as any).id;
        }
      }
    }
  } catch {
    // Not authenticated — report is anonymous, that's fine
  }

  if (errors.length) {
    return NextResponse.json(
      { error: "Validation failed", detail: errors.join("; ") },
      { status: 400 }
    );
  }

  // ----- Build row -----
  // trustLevel: community-submitted accidents start with a low default trust.
  // Editors raise it on verification.
  const insertRow: Record<string, any> = {
    lat,
    lng,
    severity,
    vehicleTypes: JSON.stringify([vehicleType]),
    casualties,
    fatalities,
    injuries,
    description,
    weather,
    roadCondition,
    contact,
    district,
    ward,
    locationId,
    photoUrl,
    occurredAt,
    reportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationStatus: "pending",
    verified: false,
    trustLevel: "anonymous",
    upvoteCount: 0,
    reporterType: "community",
    ...(submittedById ? { submittedById } : {}),
  };

  // ----- Insert -----
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("Accident")
      .insert(insertRow)
      .select("id, verificationStatus")
      .single();

    if (error) {
      console.error("[api/accidents POST] supabase error:", error.message);
      return NextResponse.json(
        {
          error: "Failed to save report",
          detail: error.message,
          _meta: { latencyMs: Date.now() - start },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        verificationStatus: data.verificationStatus,
        message:
          "Report received. A police officer will review it before it appears on the public map.",
        _meta: { latencyMs: Date.now() - start },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[api/accidents POST] thrown:", err);
    return NextResponse.json(
      {
        error: "Unexpected server error",
        detail: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
