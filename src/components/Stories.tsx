import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, Send, Trash2, X } from "lucide-react";

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
      .select("id, author_id, media_url, media_type, created_at, author:profiles!stories_author_id_fkey(id, display_name, username, avatar_url)")
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
  const [viewers, setViewers] = useState<{ viewer_id: string; reaction: string | null; viewer: Author }[] | null>(null);
  const [msg, setMsg] = useState("");
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [sent, setSent] = useState("");

  useEffect(() => {
    setViewers(null); setMsg(""); setSent(""); setMyReaction(null);
    if (!cur) return;
    if (cur.author_id !== userId) {
      void supabase.from("story_views" as never).upsert({ story_id: cur.id, viewer_id: userId } as never, { onConflict: "story_id,viewer_id", ignoreDuplicates: true });
    }
  }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadViewers() {
    if (!cur) return;
    const { data, error } = await supabase.from("story_views" as never)
      .select("viewer_id, reaction, viewer:profiles!story_views_viewer_id_fkey(id, display_name, username, avatar_url)")
      .eq("story_id", cur.id).order("created_at", { ascending: false });
    if (error) return onError(error.message);
    setViewers((data ?? []) as never);
  }

  async function react(emoji: string) {
    if (!cur) return;
    setMyReaction(emoji);
    const { error } = await supabase.from("story_views" as never).upsert({ story_id: cur.id, viewer_id: userId, reaction: emoji } as never, { onConflict: "story_id,viewer_id" });
    if (error) return onError(error.message);
    await supabase.from("direct_messages").insert({ sender_id: userId, recipient_id: cur.author_id, content: `${emoji} membalas story Anda` });
    setSent("Reaksi terkirim");
  }

  async function sendMsg() {
    if (!cur || !msg.trim()) return;
    const { error } = await supabase.from("direct_messages").insert({ sender_id: userId, recipient_id: cur.author_id, content: `Balasan story: ${msg.trim()}` });
    if (error) return onError(error.message);
    setMsg(""); setSent("Pesan terkirim");
  }
  const paused = viewers !== null || msg.length > 0;
  const next = () => {
    if (!open || !groups[open.g]) return;
    const g = groups[open.g]!;
    if (open.i + 1 < g.items.length) setOpen({ g: open.g, i: open.i + 1 });
    else if (open.g + 1 < groups.length) setOpen({ g: open.g + 1, i: 0 });
    else setOpen(null);
  };

  useEffect(() => {
    if (!cur || cur.media_type !== "image" || paused) return;
    const timer = setTimeout(next, 5000);
    return () => clearTimeout(timer);
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
            {groups[open.g]!.items.map((s, i) => <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= open.i ? "bg-background" : "bg-background/30"}`} />)}
          </div>
          <div className="absolute inset-x-0 top-5 z-10 mx-auto flex max-w-[600px] items-center gap-2 px-3 text-background">
            <Avatar profile={groups[open.g]!.author} size={32} />
            <span className="text-sm font-semibold">{displayName(groups[open.g]!.author)}</span>
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
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[600px] p-3 text-background">
            {sent && <p className="mb-2 text-center text-xs opacity-80">{sent}</p>}
            {cur.author_id === userId ? (
              <button onClick={() => void loadViewers()} className="mx-auto flex items-center gap-2 rounded-full bg-background/20 px-4 py-2 text-sm"><Eye className="size-4" />Lihat siapa yang melihat</button>
            ) : (
              <>
                <div className="mb-2 flex justify-center gap-2">
                  {["❤️", "🔥", "😂", "😮", "👏", "🚀"].map((e) => (
                    <button key={e} aria-label={`Reaksi ${e}`} onClick={() => void react(e)} className={`grid size-10 place-items-center rounded-full text-xl ${myReaction === e ? "bg-background/40" : "bg-background/10"}`}>{e}</button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); void sendMsg(); }} className="flex gap-2">
                  <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} placeholder={`Balas ke ${displayName(groups[open.g]!.author)}…`} className="h-11 flex-1 rounded-full border border-background/40 bg-transparent px-4 text-sm text-background placeholder:text-background/60 outline-none" />
                  <button type="submit" aria-label="Kirim pesan" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="size-4" /></button>
                </form>
              </>
            )}
          </div>
          {viewers && (
            <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-h-[60%] max-w-[600px] overflow-y-auto rounded-t-3xl bg-background p-4 text-foreground">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Dilihat oleh {viewers.length}</h3>
                <button aria-label="Tutup daftar" onClick={() => setViewers(null)}><X className="size-5" /></button>
              </div>
              {viewers.length === 0 && <p className="text-sm text-muted-foreground">Belum ada yang melihat.</p>}
              {viewers.map((v) => (
                <div key={v.viewer_id} className="flex items-center gap-3 py-2">
                  <Avatar profile={v.viewer} size={36} />
                  <span className="flex-1 truncate text-sm">{displayName(v.viewer)}</span>
                  {v.reaction && <span className="text-lg">{v.reaction}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
