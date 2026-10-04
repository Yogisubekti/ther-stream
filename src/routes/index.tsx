import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, Bookmark, Check, Languages, Menu, ImagePlus, Send, Users, UserRoundPlus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Stories } from "@/components/Stories";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TelegramLogo, XLogo } from "@/components/SocialLogos";
import { uploadImage } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";
import { usePreferences, type LanguagePreference } from "@/lib/preferences";
import { fetchPosts, type Post } from "@/lib/social";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mindcaster — Join the conversation" },
      { name: "description", content: "Mindcaster: social chain untuk posting, like, react, komentar, dan repost bersama komunitas Web3." },
      { property: "og:title", content: "Mindcaster — Join the conversation" },
      { property: "og:description", content: "Social chain untuk posting, like, react, komentar, dan repost bersama komunitas Web3." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeRoute,
});

type HomeView = "home" | "bookmarks" | "groups";

function HomeRoute() {
  const { language, setLanguage, t } = usePreferences();
  const [view, setView] = useState<HomeView>("home");
  const title = view === "bookmarks" ? t("bookmarks") : view === "groups" ? t("groups") : "Home";
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: "auto", label: t("automatic") }, { value: "id", label: t("indonesian") }, { value: "en", label: t("english") },
  ];
  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-9" aria-label="Menu Home"><Menu className="size-5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onSelect={() => setView("groups")}><Users />{t("groups")}</DropdownMenuItem>
        <DropdownMenuItem disabled><UserRoundPlus />{t("createGroup")} <span className="ml-auto text-[10px] font-semibold text-muted-foreground">{t("soon")}</span></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/verify"><BadgeCheck />{t("verifyAccount")}</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setView("bookmarks")}><Bookmark />{t("bookmarks")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><a href="https://x.com/Mindcaster_xyz" target="_blank" rel="noreferrer"><XLogo className="size-4" />X (Twitter)</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href="https://t.me/MindcastApp" target="_blank" rel="noreferrer"><TelegramLogo className="size-4" />Telegram</a></DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground"><Languages className="mr-1.5 inline size-3.5" />{t("language")}</div>
        {languageOptions.map((option) => <DropdownMenuItem key={option.value} onSelect={() => setLanguage(option.value)} className="pl-7">{option.label}{language === option.value && <Check className="ml-auto size-4" />}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return <AppShell title={title} actions={actions}>{(u) => <HomeFeed user={u} view={view} onHome={() => setView("home")} />}</AppShell>;
}

function HomeFeed({ user, view, onHome }: { user: User; view: HomeView; onHome: () => void }) {
  const { t } = usePreferences();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      if (view === "bookmarks") {
        const { data, error: bookmarkError } = await supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false });
        if (bookmarkError) throw bookmarkError;
        setPosts(await fetchPosts({ ids: (data ?? []).map((row) => row.post_id) }));
      } else if (view === "home") setPosts(await fetchPosts());
    } catch (e) { setError((e as Error).message); }
  }, [user.id, view]);
  useEffect(() => { void load(); }, [load]);

  async function createPost(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() && !image) return;
    setBusy(true); setError(null);
    try {
      const image_url = image ? await uploadImage(image, "post") : null;
      const { error } = await supabase.from("posts").insert({ author_id: user.id, content: draft.trim(), image_url });
      if (error) throw error;
      setDraft(""); setImage(null); void load();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      {view === "groups" ? (
        <section className="glass-panel flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-surface/80 px-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary"><Users className="size-7" /></span>
          <h2 className="mt-4 font-display text-lg font-semibold">Grup Mindcaster</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Ruang komunitas sedang disiapkan. Anda akan segera bisa menemukan dan bergabung ke grup.</p>
          <Button variant="surface" size="sm" className="mt-5" onClick={onHome}>Kembali ke Home</Button>
        </section>
      ) : view === "bookmarks" ? (
        <>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {posts.length === 0 && <section className="glass-panel rounded-[24px] border border-surface/80 px-6 py-12 text-center"><Bookmark className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-3 font-display font-semibold">Belum ada bookmark</h2><p className="mt-1 text-sm text-muted-foreground">Postingan yang Anda simpan akan muncul di sini.</p></section>}
          {posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={load} onError={setError} />)}
        </>
      ) : <>
      <Stories userId={user.id} onError={setError} />
      <form onSubmit={createPost} className="glass-panel rounded-[24px] border border-surface/80 p-4">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} rows={3} placeholder={t("whatsHappening")} className="w-full resize-none rounded-xl border border-border/60 bg-surface/75 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" />
        {image && <div className="relative mt-2"><img src={URL.createObjectURL(image)} alt="Pratinjau" className="max-h-60 w-full rounded-xl object-cover" /><button type="button" onClick={() => setImage(null)} aria-label="Hapus gambar" className="absolute right-2 top-2 rounded-full bg-background/80 px-2 text-sm">✕</button></div>}
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <label className="cursor-pointer text-primary" aria-label="Tambah gambar"><ImagePlus className="size-5" /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f && f.size > 10 * 1024 * 1024) return setError("Ukuran maksimal 10 MB."); setImage(f ?? null); }} /></label>
            {draft.length}/500
          </span>
           <Button type="submit" size="sm" disabled={busy || (!draft.trim() && !image)}><Send className="size-4" />{t("post")}</Button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
       {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t("noPosts")}</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={load} onError={setError} />)}
      </>}
    </>
  );
}
