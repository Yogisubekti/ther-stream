import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Track = { id: number; title: string; artist: string; artwork: string; preview: string };

export const searchMusic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data }): Promise<Track[]> => {
    const url = `https://itunes.apple.com/search?media=music&entity=song&limit=20&term=${encodeURIComponent(data.q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Music search is unavailable right now.");
    const json = (await res.json()) as { results: { trackId: number; trackName: string; artistName: string; artworkUrl100: string; previewUrl?: string }[] };
    return json.results.filter((r) => r.previewUrl?.startsWith("https://")).map((r) => ({
      id: r.trackId, title: r.trackName, artist: r.artistName, artwork: r.artworkUrl100, preview: r.previewUrl!,
    }));
  });
