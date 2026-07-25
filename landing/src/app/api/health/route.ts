// GET /api/health
// Reports the live state of all backend dependencies.
// 200 = healthy, 503 = degraded. Always includes enough detail to debug from logs.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = {
  name: string;
  status: "ok" | "warn" | "fail";
  latencyMs: number;
  detail: string;
};

async function timed<T>(label: string, fn: () => Promise<T>): Promise<{ result?: T; check: Check }> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      result,
      check: {
        name: label,
        status: "ok",
        latencyMs: Date.now() - start,
        detail: "reachable",
      },
    };
  } catch (err: any) {
    return {
      check: {
        name: label,
        status: "fail",
        latencyMs: Date.now() - start,
        detail: err?.message || String(err),
      },
    };
  }
}

export async function GET() {
  const checks: Check[] = [];

  // 1) Supabase reachability (HTTPS REST)
  const sbTest = await timed("supabase-rest", async () => {
    const sb = getSupabaseAdmin();
    const { count, error } = await sb
      .from("Accident")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count;
  });
  checks.push(sbTest.check);
  if (sbTest.result !== undefined) {
    checks[checks.length - 1].detail = `${sbTest.result} accidents in DB`;
  }

  // 2) Env vars
  const envCheck: Check = {
    name: "env",
    status: "ok",
    latencyMs: 0,
    detail: "ok",
  };
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    envCheck.status = "fail";
    envCheck.detail = `Missing: ${missing.join(", ")}`;
  }
  checks.push(envCheck);

  // 3) Node version
  checks.push({
    name: "node",
    status: "ok",
    latencyMs: 0,
    detail: process.version,
  });

  const overallOk = checks.every((c) => c.status === "ok");
  const httpStatus = overallOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: overallOk,
      service: "road-safety-dar-landing",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: httpStatus }
  );
}
