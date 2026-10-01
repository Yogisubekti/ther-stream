import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";
import { displayName, timeAgo, type Author } from "@/lib/social";

type Story = { id: string; author_id: string; media_url: string; media_type: "image" | "video"; created_at: string; author: Author };
type Group = { author: Author; authorId: string; items: Story[] };

export function Stories({ userId, onError }: { userId: string; onError: (m: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<{ g: number; i: number } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("stories" as never)
      .select("id, author_id, media_url, media_type, created_at, author:profiles!stories_author_id_fkey(id, display_name, username, avatar_url, wallet_address)")
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true });
    if (error) return onError(error.message);
    const map = new Map<string, Group>();
    for (const s of (data ?? []) as unknown as Story[]) {
      const g = map.get(s.author_id) ?? { author: s.author, authorId: s.author_id, items: [] };
      g.items.push(s); map.set(s.author_id, g);
    }
    const list = [...map.values()].sort((a, b) => (a.authorId === userId ? -1 : b.authorId === userId ? 1 : 0));
    setGroups(list);
  }, [userId, onError]);
  useEffect(() => { void load(); }, [load]);

  async function add(file: File) {
    setBusy(true);
    try {
      const media_url = await uploadImage(file, "story");
      const { error } = await supabase.from("stories" as never).insert({ author_id: userId, media_url, media_type: file.type.startsWith("video/") ? "video" : "image" } as never);
      if (error) throw error;
      await load();
    } catch (e) { onError((e as Error).message); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("stories" as never).delete().eq("id", id);
    if (error) return onError(error.message);
    setOpen(null); void load();
  }

  const cur = open ? groups[open.g]?.items[open.i] : null;
  const next = () => {
    if (!open) return;
    const g = groups[open.g];
    if (open.i + 1 < g.items.length) setOpen({ g: open.g, i: open.i + 1 });
    else if (open.g + 1 < groups.length) setOpen({ g: open.g + 1, i: 0 });
    else setOpen(null);
  };

  useEffect(() => {
    if (!cur || cur.media_type !== "image") return;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  });

  return (
    <>
      <section aria-label="Story" className="glass-panel flex gap-3 overflow-x-auto rounded-[24px] border border-surface/80 p-3">
        <label className={`flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1 ${busy ? "opacity-50" : ""}`} aria-label="Tambah story">
          <span className="grid size-14 place-items-center rounded-full border-2 border-dashed border-primary/60 text-primary"><Plus className="size-6" /></span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">{busy ? "Mengunggah…" : "Story"}</span>
          <input type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void add(f); }} />
        </label>
        {groups.map((g, gi) => (
          <button key={g.authorId} onClick={() => setOpen({ g: gi, i: 0 })} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="rounded-full bg-primary p-[2px]"><span className="block rounded-full bg-background p-[2px]"><Avatar profile={g.author} size={48} /></span></span>
            <span className="w-full truncate text-center text-[11px]">{g.authorId === userId ? "Anda" : displayName(g.author)}</span>
          </button>
        ))}
      </section>

      {cur && open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90">
          <div className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-[600px] gap-1 px-3 pt-3">
            {groups[open.g].items.map((s, i) => <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= open.i ? "bg-background" : "bg-background/30"}`} />)}
          </div>
          <div className="absolute inset-x-0 top-5 z-10 mx-auto flex max-w-[600px] items-center gap-2 px-3 text-background">
            <Avatar profile={groups[open.g].author} size={32} />
            <span className="text-sm font-semibold">{displayName(groups[open.g].author)}</span>
            <span className="text-xs opacity-70">{timeAgo(cur.created_at)}</span>
            <span className="ml-auto flex gap-1">
              {cur.author_id === userId && <button aria-label="Hapus story" onClick={() => { if (confirm("Hapus story ini?")) void remove(cur.id); }} className="grid size-9 place-items-center rounded-full hover:bg-background/20"><Trash2 className="size-5" /></button>}
              <button aria-label="Tutup" onClick={() => setOpen(null)} className="grid size-9 place-items-center rounded-full hover:bg-background/20"><X className="size-5" /></button>
            </span>
          </div>
          {cur.media_type === "video"
            ? <video key={cur.id} src={cur.media_url} autoPlay playsInline onEnded={next} className="max-h-full max-w-full" />
            : <img key={cur.id} src={cur.media_url} alt="Story" className="max-h-full max-w-full object-contain" />}
          <button aria-label="Berikutnya" onClick={next} className="absolute inset-y-20 right-0 w-1/2" />
          <button aria-label="Sebelumnya" onClick={() => setOpen(open.i > 0 ? { g: open.g, i: open.i - 1 } : open.g > 0 ? { g: open.g - 1, i: 0 } : open)} className="absolute inset-y-20 left-0 w-1/2" />
        </div>
      )}
    </>
  );
}
