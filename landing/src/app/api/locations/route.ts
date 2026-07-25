// GET /api/locations
// Returns Dar es Salaam districts, wards, streets, or search results.
// All from the Supabase REST API (PostgREST, HTTPS).

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const ward = searchParams.get("ward");
  const query = searchParams.get("q");

  const sb = getSupabaseAdmin();

  // Districts
  if (!district && !ward && !query) {
    const { data, error } = await sb
      .from("Location")
      .select("district, districtCode")
      .eq("region", "DAR-ES-SALAAM");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const seen = new Set<string>();
    const result: { name: string; code: string }[] = [];
    for (const r of data ?? []) {
      const key = `${r.district}|${r.districtCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ name: r.district, code: r.districtCode });
      }
    }
    return NextResponse.json(result);
  }

  // Wards
  if (district && !ward) {
    const { data, error } = await sb
      .from("Location")
      .select("ward, wardCode")
      .eq("district", district)
      .eq("region", "DAR-ES-SALAAM");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const seen = new Set<string>();
    const result: { name: string; code: string }[] = [];
    for (const r of data ?? []) {
      const key = `${r.ward}|${r.wardCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ name: r.ward, code: r.wardCode });
      }
    }
    return NextResponse.json(result);
  }

  // Streets for ward
  if (district && ward) {
    const { data, error } = await sb
      .from("Location")
      .select("id, street, places")
      .eq("district", district)
      .eq("ward", ward)
      .eq("region", "DAR-ES-SALAAM")
      .order("street", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []).filter((s) => s.street));
  }

  // Free-text search
  if (query) {
    const q = `%${query}%`;
    const { data, error } = await sb
      .from("Location")
      .select("id, district, ward, street, places")
      .eq("region", "DAR-ES-SALAAM")
      .or(`street.ilike.${q},places.ilike.${q},ward.ilike.${q},district.ilike.${q}`)
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
