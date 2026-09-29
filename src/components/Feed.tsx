import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Heart, LogOut, MessageCircle, Send, Trash2, WalletCards } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { linkWallet, walletMessage } from "@/lib/wallet.functions";

type Author = { display_name: string | null; wallet_address: string | null } | null;
type Comment = { id: string; content: string; created_at: string; author_id: string; author: Author };
type Post = {
  id: string; content: string; created_at: string; author_id: string; author: Author;
  post_likes: { user_id: string }[]; post_comments: Comment[];
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const name = (a: Author) => a?.display_name || "Anonymous";

declare global {
  interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }
}

export function Feed({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const link = useServerFn(linkWallet);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, created_at, author_id, author:profiles!posts_author_id_fkey(display_name, wallet_address), post_likes(user_id), post_comments(id, content, created_at, author_id, author:profiles!post_comments_author_id_fkey(display_name, wallet_address))")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    else setPosts(((data ?? []) as unknown as Post[]).map((p) => ({ ...p, post_comments: [...p.post_comments].sort((a, b) => a.created_at.localeCompare(b.created_at)) })));
  }, []);

  useEffect(() => {
    void load();
    void supabase.from("profiles").select("wallet_address").eq("id", user.id).maybeSingle().then(({ data }) => setWallet(data?.wallet_address ?? null));
  }, [load, user.id]);

  async function createPost(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const { error } = await supabase.from("posts").insert({ author_id: user.id, content: draft.trim() });
    if (error) return setError(error.message);
    setDraft(""); void load();
  }

  async function toggleLike(p: Post) {
    const liked = p.post_likes.some((l) => l.user_id === user.id);
    const { error } = liked
      ? await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: p.id, user_id: user.id });
    if (error) setError(error.message); else void load();
  }

  async function addComment(e: FormEvent, postId: string) {
    e.preventDefault();
    if (!commentDraft.trim()) return;
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: user.id, content: commentDraft.trim() });
    if (error) return setError(error.message);
    setCommentDraft(""); void load();
  }

  async function remove(table: "posts" | "post_comments", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setError(error.message); else void load();
  }

  async function connectWallet() {
    setError(null);
    if (!window.ethereum) return setError("MetaMask not detected. Install it to link a wallet.");
    try {
      const [address] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!address) return;
      const issuedAt = new Date().toISOString();
      const signature = (await window.ethereum.request({ method: "personal_sign", params: [walletMessage(user.id, address, issuedAt), address] })) as string;
      const res = await link({ data: { address, issuedAt, signature } });
      setWallet(res.address); void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    }
  }

  return (
    <div className="w-full max-w-[560px] space-y-4">
      <section className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-surface/80 p-5">
        <div className="min-w-0">
          <p className="font-display font-semibold">{user.user_metadata?.['display_name'] || user.email}</p>
          <p className="text-xs text-muted-foreground">{wallet ? `Wallet ${short(wallet)} verified` : "No wallet linked"}</p>
        </div>
        <div className="flex gap-2">
          {!wallet && <Button variant="surface" size="sm" onClick={connectWallet}><WalletCards className="size-4" />Connect MetaMask</Button>}
          <Button variant="ghost" size="sm" onClick={onSignOut}><LogOut className="size-4" />Sign Out</Button>
        </div>
      </section>

      <form onSubmit={createPost} className="glass-panel rounded-[28px] border border-surface/80 p-5">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} rows={3} placeholder="What's on your frequency?" className="w-full resize-none rounded-xl border border-border/60 bg-surface/75 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{draft.length}/500</span>
          <Button type="submit" size="sm" disabled={!draft.trim()}><Send className="size-4" />Post</Button>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {posts.length === 0 && <p className="text-center text-sm text-muted-foreground">No posts yet. Start the conversation.</p>}

      {posts.map((p) => {
        const liked = p.post_likes.some((l) => l.user_id === user.id);
        return (
          <article key={p.id} className="glass-panel rounded-[28px] border border-surface/80 p-5">
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-semibold">{name(p.author)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.author?.wallet_address && <span className="mr-2 text-primary">{short(p.author.wallet_address)}</span>}
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              {p.author_id === user.id && <Button variant="ghost" size="icon" aria-label="Delete post" onClick={() => remove("posts", p.id)}><Trash2 className="size-4" /></Button>}
            </header>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.content}</p>
            <div className="mt-3 flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => toggleLike(p)} aria-pressed={liked}>
                <Heart className={`size-4 ${liked ? "fill-primary text-primary" : ""}`} />{p.post_likes.length}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setOpenComments(openComments === p.id ? null : p.id); setCommentDraft(""); }}>
                <MessageCircle className="size-4" />{p.post_comments.length}
              </Button>
            </div>
            {openComments === p.id && (
              <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {p.post_comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                    <p><span className="font-semibold">{name(c.author)}</span> {c.content}</p>
                    {c.author_id === user.id && <Button variant="ghost" size="icon" className="size-7" aria-label="Delete comment" onClick={() => remove("post_comments", c.id)}><Trash2 className="size-3.5" /></Button>}
                  </div>
                ))}
                <form onSubmit={(e) => addComment(e, p.id)} className="flex gap-2">
                  <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} maxLength={300} placeholder="Write a comment" className="h-9 flex-1 rounded-xl border border-border/60 bg-surface/75 px-3 text-sm outline-none focus:border-primary" />
                  <Button type="submit" size="sm" disabled={!commentDraft.trim()}>Reply</Button>
                </form>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
