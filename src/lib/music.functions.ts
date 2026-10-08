export type Track = { id: number; title: string; artist: string; artwork: string; preview: string };

// Public Apple Music catalog search; CORS-enabled, so it runs directly in the browser.
export async function searchMusic(q: string): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?media=music&entity=song&limit=20&term=${encodeURIComponent(q.slice(0, 80))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Music search is unavailable right now.");
  const json = (await res.json()) as { results: { trackId: number; trackName: string; artistName: string; artworkUrl100: string; previewUrl?: string }[] };
  return json.results.filter((r) => r.previewUrl?.startsWith("https://")).map((r) => ({
    id: r.trackId, title: r.trackName, artist: r.artistName, artwork: r.artworkUrl100, preview: r.previewUrl!,
  }));
}
