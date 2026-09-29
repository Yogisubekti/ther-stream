import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchPosts, type Post } from "@/lib/social";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ponscaster — Join the conversation" },
      { name: "description", content: "Ponscaster: social chain untuk posting, like, react, komentar, dan repost bersama komunitas Web3." },
      { property: "og:title", content: "Ponscaster — Join the conversation" },
      { property: "og:description", content: "Social chain untuk posting, like, react, komentar, dan repost bersama komunitas Web3." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell title="Home">{(u) => <HomeFeed user={u} />}</AppShell>,
});

function HomeFeed({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => fetchPosts().then(setPosts).catch((e: Error) => setError(e.message)), []);
  useEffect(() => { void load(); }, [load]);

  async function createPost(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const { error } = await supabase.from("posts").insert({ author_id: user.id, content: draft.trim() });
    if (error) return setError(error.message);
    setDraft(""); void load();
  }

  return (
    <>
      <form onSubmit={createPost} className="glass-panel rounded-[24px] border border-surface/80 p-4">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} rows={3} placeholder="Apa yang sedang terjadi?" className="w-full resize-none rounded-xl border border-border/60 bg-surface/75 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{draft.length}/500</span>
          <Button type="submit" size="sm" disabled={!draft.trim()}><Send className="size-4" />Post</Button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada postingan. Mulai percakapan!</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={load} onError={setError} />)}
    </>
  );
}
