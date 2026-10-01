import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cache = new Map<string, { at: number; data: unknown }>();
const cooldown = new Map<string, number>();
let cursor = 0;
const TTL = { alerts: 15_000, thesis: 60_000, leaderboard: 60_000 } as const;

async function fomoGet(path: string) {
  const keys = (process.env["FOMO_API_KEYS"] ?? "").split(/[\s,]+/).filter(Boolean);
  if (!keys.length) throw new Error("FOMO belum dikonfigurasi.");
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(cursor + i) % keys.length]!;
    if ((cooldown.get(key) ?? 0) > Date.now()) continue;
    const res = await fetch(`https://api.fomoapi.io${path}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
    if (res.status === 429 || res.status === 402 || res.status === 401) {
      cooldown.set(key, Date.now() + (res.status === 429 ? 60_000 : 3_600_000));
      continue;
    }
    cursor = (cursor + i + 1) % keys.length;
    if (!res.ok) { console.error("FOMO", res.status, await res.text().catch(() => "")); throw new Error("Data FOMO sedang tidak tersedia."); }
    return res.json();
  }
  throw new Error("Semua key FOMO sedang mencapai batas. Coba sebentar lagi.");
}

export const getFomo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tab: z.enum(["alerts", "thesis", "leaderboard"]) }).parse(d))
  .handler(async ({ data }) => {
    const path = data.tab === "alerts" ? "/v2/alerts?limit=30" : data.tab === "thesis" ? "/v2/thesis?limit=30" : "/v2/leaderboard/7d?limit=50";
    const hit = cache.get(path);
    if (hit && Date.now() - hit.at < TTL[data.tab]) return { json: JSON.stringify(hit.data) };
    const json = await fomoGet(path);
    cache.set(path, { at: Date.now(), data: json });
    return { json: JSON.stringify(json) };
  });
