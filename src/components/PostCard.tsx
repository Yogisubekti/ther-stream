import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Flag, Heart, MessageCircle, MoreHorizontal, Pencil, Repeat2, SmilePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { REACTIONS, displayName, handle, short, timeAgo, type Post } from "@/lib/social";

export function PostCard({ post: p, userId, onChange, onError }: { post: Post; userId: string; onChange: () => void; onError: (m: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [showReact, setShowReact] = useState(false);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(p.content);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("spam");
  const liked = p.post_likes.some((l) => l.user_id === userId);
  const reposted = p.post_reposts.some((l) => l.user_id === userId);
  const bookmarked = p.post_bookmarks.some((l) => l.user_id === userId);
  const counts = REACTIONS.map((e) => ({ e, n: p.post_reactions.filter((r) => r.emoji === e).length, mine: p.post_reactions.some((r) => r.emoji === e && r.user_id === userId) })).filter((r) => r.n > 0);

  async function run(q: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await q;
    if (error) onError(error.message); else onChange();
  }
  const toggleLike = () => run(liked ? supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", userId) : supabase.from("post_likes").insert({ post_id: p.id, user_id: userId }));
  const toggleRepost = () => run(reposted ? supabase.from("post_reposts").delete().eq("post_id", p.id).eq("user_id", userId) : supabase.from("post_reposts").insert({ post_id: p.id, user_id: userId }));
  async function toggleBookmark() {
    const { error } = await (bookmarked
      ? supabase.from("post_bookmarks").delete().eq("post_id", p.id).eq("user_id", userId)
      : supabase.from("post_bookmarks").insert({ post_id: p.id, user_id: userId }));
    if (error) return onError(error.message);
    toast.success(bookmarked ? "Bookmark dihapus" : "Postingan disimpan");
    onChange();
  }
  function toggleReact(emoji: string) {
    const mine = p.post_reactions.some((r) => r.emoji === emoji && r.user_id === userId);
    setShowReact(false);
    void run(mine ? supabase.from("post_reactions").delete().eq("post_id", p.id).eq("user_id", userId).eq("emoji", emoji) : supabase.from("post_reactions").insert({ post_id: p.id, user_id: userId, emoji }));
  }
  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await run(supabase.from("post_comments").insert({ post_id: p.id, author_id: userId, content: comment.trim() }));
    setComment("");
  }
  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    const content = editContent.trim();
    if (!content) return;
    const { error } = await supabase.from("posts").update({ content }).eq("id", p.id).eq("author_id", userId);
    if (error) return onError(error.message);
    setEditing(false);
    toast.success("Postingan diperbarui");
    onChange();
  }
  async function deletePost() {
    const { error } = await supabase.from("posts").delete().eq("id", p.id).eq("author_id", userId);
    if (error) return onError(error.message);
    toast.success("Postingan dihapus");
    onChange();
  }
  async function submitReport(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("post_reports").insert({ post_id: p.id, reporter_id: userId, reason });
    if (error) return onError(error.code === "23505" ? "Postingan ini sudah pernah Anda laporkan." : error.message);
    setReporting(false);
    toast.success("Laporan terkirim", { description: "Terima kasih telah membantu menjaga komunitas." });
  }

  return (
    <article className="glass-panel rounded-[24px] border border-surface/80 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <Link to="/profile" search={{ id: p.author_id }}><Avatar profile={p.author} /></Link>
        <div className="min-w-0 flex-1">
          <Link to="/profile" search={{ id: p.author_id }} className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-display text-sm font-semibold">{displayName(p.author)}</span>
            {handle(p.author) && <span className="text-xs text-muted-foreground">{handle(p.author)}</span>}
            <span className="text-xs text-muted-foreground">· {timeAgo(p.created_at)}</span>
          </Link>
          {p.author?.wallet_address && <span className="text-[11px] text-primary">{short(p.author.wallet_address)}</span>}
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{p.content}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Menu postingan"><MoreHorizontal className="size-5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {p.author_id === userId ? (
              <>
                <DropdownMenuItem onSelect={() => { setEditContent(p.content); setEditing(true); }}><Pencil />Edit postingan</DropdownMenuItem>
                <DropdownMenuItem onSelect={deletePost} className="text-destructive focus:text-destructive"><Trash2 />Hapus postingan</DropdownMenuItem>
              </>
            ) : <DropdownMenuItem onSelect={() => setReporting(true)} className="text-destructive focus:text-destructive"><Flag />Laporkan</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {counts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
          {counts.map((r) => (
            <button key={r.e} onClick={() => toggleReact(r.e)} className={`rounded-full border px-2 py-0.5 text-xs ${r.mine ? "border-primary bg-primary/15" : "border-border/60 bg-surface/60"}`}>{r.e} {r.n}</button>
          ))}
        </div>
      )}

      <div className="relative mt-2 flex justify-between pl-[44px] text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)} aria-label="Komentar"><MessageCircle className="size-4" />{p.post_comments.length}</Button>
        <Button variant="ghost" size="sm" onClick={toggleRepost} aria-pressed={reposted} aria-label="Repost" className={reposted ? "text-primary" : ""}><Repeat2 className="size-4" />{p.post_reposts.length}</Button>
        <Button variant="ghost" size="sm" onClick={toggleLike} aria-pressed={liked} aria-label="Like"><Heart className={`size-4 ${liked ? "fill-primary text-primary" : ""}`} />{p.post_likes.length}</Button>
        <Button variant="ghost" size="sm" onClick={() => setShowReact((v) => !v)} aria-label="React"><SmilePlus className="size-4" /></Button>
        <Button variant="ghost" size="icon" className={bookmarked ? "text-primary" : ""} onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? "Hapus bookmark" : "Bookmark"}><Bookmark className={`size-4 ${bookmarked ? "fill-primary" : ""}`} /></Button>
        {showReact && (
          <div className="absolute bottom-full right-0 z-20 mb-1 flex gap-1 rounded-full border border-border/60 bg-surface p-1 shadow-tab">
            {REACTIONS.map((e) => <button key={e} onClick={() => toggleReact(e)} className="grid size-9 place-items-center rounded-full text-lg transition hover:scale-125">{e}</button>)}
          </div>
        )}
      </div>

      {showComments && (
        <div className="mt-2 space-y-2.5 border-t border-border/60 pt-3">
          {p.post_comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <Avatar profile={c.author} size={28} />
              <p className="flex-1 break-words"><span className="font-semibold">{displayName(c.author)}</span> {c.content}</p>
              {c.author_id === userId && <Button variant="ghost" size="icon" className="size-7" aria-label="Hapus komentar" onClick={() => run(supabase.from("post_comments").delete().eq("id", c.id))}><Trash2 className="size-3.5" /></Button>}
            </div>
          ))}
          <form onSubmit={addComment} className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="Tulis komentar…" className="h-9 flex-1 rounded-xl border border-border/60 bg-surface/75 px-3 text-sm outline-none focus:border-primary" />
            <Button type="submit" size="sm" disabled={!comment.trim()}>Balas</Button>
          </form>
        </div>
      )}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <form onSubmit={saveEdit} className="space-y-4">
            <DialogHeader><DialogTitle>Edit postingan</DialogTitle><DialogDescription>Perbarui isi postingan Anda.</DialogDescription></DialogHeader>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={500} rows={5} autoFocus className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary" />
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{editContent.length}/500</span><DialogFooter className="flex-row gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Batal</Button><Button type="submit" size="sm" disabled={!editContent.trim()}>Simpan</Button></DialogFooter></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reporting} onOpenChange={setReporting}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <form onSubmit={submitReport} className="space-y-4">
            <DialogHeader><DialogTitle>Laporkan postingan</DialogTitle><DialogDescription>Pilih alasan yang paling sesuai. Laporan Anda bersifat privat.</DialogDescription></DialogHeader>
            <label className="block text-sm font-semibold">Alasan
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 font-normal outline-none focus:border-primary">
                <option value="spam">Spam</option><option value="harassment">Pelecehan</option><option value="misinformation">Informasi menyesatkan</option><option value="illegal">Konten ilegal</option><option value="other">Lainnya</option>
              </select>
            </label>
            <DialogFooter className="flex-row justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setReporting(false)}>Batal</Button><Button type="submit" variant="destructive" size="sm">Kirim laporan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
