// GET /api/ai-summary
//
// Generates a short AI safety brief from the latest serious accidents.
// Multi-provider: Groq (preferred, OpenAI-compatible, fastest) > Cloudflare
// AI (Llama 3.3 70B, ~70k neurons/day free) > 503 if neither is configured.
//
// Response shape:
//   { ok: true,  text: string, provider: "groq"|"cloudflare", ms: number, cached?: boolean }
//   { ok: false, error: string, hint: string }
//
// Caching: in-process Map, 5-minute TTL, keyed by (date + recent 10 incident IDs).
// This means the dashboard doesn't burn a fresh LLM call every page load.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-process cache. Resets on server restart.
const cache = new Map<string, { text: string; provider: string; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

type Provider = "groq" | "cloudflare";

function pickProvider(): Provider | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.CLOUDFLARE_API_TOKEN) return "cloudflare";
  return null;
}

function buildPrompt(incidents: Array<{ severity: string; junctionName: string; district: string; casualties: number; fatalities: number; upvoteCount: number; description: string }>, lang: "en" | "sw") {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lines = incidents.map((i, idx) => {
    const desc = (i.description || "").replace(/^\[mood:[^\]]+\]\s*/i, "").slice(0, 140);
    return `${idx + 1}. [${i.severity.toUpperCase()}] ${i.junctionName || "unknown junction"}${i.district ? `, ${i.district}` : ""} | ${i.fatalities} dead, ${i.casualties} injured, ${i.upvoteCount} applauds${desc ? ` | "${desc}"` : ""}`;
  }).join("\n");

  if (lang === "sw") {
    return [
      `Wewe ni mtaalamu wa usalama barabarani Dar es Salaam. Tarehe: ${today}.`,
      `Hizi hapa ajali mpya za hivi karibuni (severe/critical/fatal tu):`,
      lines,
      ``,
      `Kwa sentensi 3-4 fupi za Kiswahili, eleza:`,
      `1) Mwelekeo (pattern) unaoonekana`,
      `2) Maeneo hatari zaidi`,
      `3) Ujumbe mfupi kwa jamii (call to action)`,
      ``,
      `Tumia lugha ya heshima, isiyo ya kuhukumu. Usibuni takwimu mpya.`,
    ].join("\n");
  }

  return [
    `You are a road-safety analyst for Dar es Salaam. Date: ${today}.`,
    `Here are the most recent serious accidents (fatal/critical/serious, last 30 days):`,
    lines,
    ``,
    `In 3-4 short sentences, give:`,
    `1) The pattern you see (peak hours, common causes, hotspots)`,
    `2) The single most dangerous area right now`,
    `3) A 1-sentence call to action for the community`,
    ``,
    `Tone: respectful, factual, no sensationalism. Do not invent new numbers.`,
  ].join("\n");
}

async function callGroq(prompt: string, systemPrompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 400,
      stream: false,
    }),
    signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function callCloudflare(prompt: string, systemPrompt: string, signal: AbortSignal): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID missing");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.4,
    }),
    signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cloudflare ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.result?.response?.trim() || "";
}

export async function GET(request: Request) {
  const start = Date.now();
  const url = new URL(request.url);
  const lang = (url.searchParams.get("lang") === "sw" ? "sw" : "en") as "sw" | "en";
  const bypassCache = url.searchParams.get("fresh") === "1";

  const provider = pickProvider();
  if (!provider) {
    return NextResponse.json({
      ok: false,
      error: "No LLM provider configured",
      hint: "Add GROQ_API_KEY (preferred) or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID to landing/.env, then restart the dev server.",
    }, { status: 503 });
  }

  // 1) Pull last 30 days of serious/fatal/critical accidents
  let incidents: any[] = [];
  let supabaseError: string | null = null;
  try {
    const sb = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb
      .from("Accident")
      .select("id, severity, junctionName, district, casualties, fatalities, upvoteCount, description, occurredAt")
      .in("severity", ["fatal", "critical", "serious"])
      .gte("occurredAt", thirtyDaysAgo)
      .order("occurredAt", { ascending: false })
      .limit(15);
    if (error) supabaseError = error.message;
    else incidents = data || [];
  } catch (err: any) {
    supabaseError = err?.message || String(err);
  }

  // 2) If we have zero serious incidents, return a friendly fallback (don't burn an LLM call)
  if (!incidents.length) {
    return NextResponse.json({
      ok: true,
      text: lang === "sw"
        ? "Hakuna ajali kubwa zilizorekodiwa katika siku 30 zilizopita. Barabara ziko salama kwa sasa — endelea kuwa mwangalifu."
        : "No serious accidents reported in the last 30 days. The roads look calm right now — stay alert and keep driving safely.",
      provider,
      ms: Date.now() - start,
      cached: false,
      incidentCount: 0,
    });
  }

  // 3) Cache key = date + IDs of the 10 most recent (so a new report invalidates)
  const cacheKey = `${new Date().toISOString().slice(0, 10)}:${incidents.slice(0, 10).map((i) => i.id).join(",")}:${lang}`;
  if (!bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json({ ok: true, text: cached.text, provider: cached.provider, ms: Date.now() - start, cached: true, incidentCount: incidents.length });
    }
  }

  // 4) Call LLM
  const systemPrompt = lang === "sw"
    ? "Wewe ni msaidizi wa usalama barabarani. Jibu kwa Kiswahili sanifu, sentensi 3-4 fupi, bila kuhukumu, ukizingatia fakta tu."
    : "You are a road-safety assistant. Reply in clear English, 3-4 short sentences, no judgement, facts only.";
  const prompt = buildPrompt(incidents, lang);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const text = provider === "groq" ? await callGroq(prompt, systemPrompt, controller.signal) : await callCloudflare(prompt, systemPrompt, controller.signal);
    if (!text) throw new Error("Empty response from LLM");
    cache.set(cacheKey, { text, provider, ts: Date.now() });
    return NextResponse.json({ ok: true, text, provider, ms: Date.now() - start, cached: false, incidentCount: incidents.length });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: "LLM call failed",
      detail: err?.message || String(err),
      provider,
      supabaseError,
    }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
