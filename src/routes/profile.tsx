import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Camera, Share2, LogOut, Mail, Pencil, WalletCards } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";

import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { IdentityBadges } from "@/components/IdentityBadges";
import { FollowStats, ProfileFollowButton } from "@/components/FollowLists";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";
import { supabase } from "@/integrations/supabase/client";
import { linkWallet, walletMessage } from "@/lib/wallet.functions";
import { profileLink, shareLink } from "@/lib/share";
import { displayName, fetchPosts, handle, joined, resizeImage, short, type Post, type Profile } from "@/lib/social";

export const Route = createFileRoute("/profile")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Profil — Mindcaster" },
      { name: "description", content: "Profil Mindcaster: bio, username, foto, dompet Web3, postingan, dan remind." },
      { property: "og:title", content: "Profil — Mindcaster" },
      { property: "og:description", content: "Lihat profil, postingan, dan repost di Mindcaster." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfileRoute,
});


function ProfileRoute() {
  const { id } = Route.useSearch();
  return <AppShell title="Profil">{(u) => <ProfileView key={id ?? u.id} user={u} profileId={id ?? u.id} />}</AppShell>;
}

function ProfileView({ user, profileId }: { user: User; profileId: string }) {
  const isMe = profileId === user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"posts" | "reposts">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = useServerFn(linkWallet);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, display_name, username, bio, avatar_url, wallet_address, created_at").eq("id", profileId).maybeSingle();
    setProfile(data as Profile | null);
  }, [profileId]);

  const loadPosts = useCallback(async () => {
    try {
      if (tab === "posts") setPosts(await fetchPosts({ authorId: profileId }));
      else {
        const { data } = await supabase.from("post_reposts").select("post_id").eq("user_id", profileId).order("created_at", { ascending: false }).limit(50);
        setPosts(await fetchPosts({ ids: (data ?? []).map((r) => r.post_id) }));
      }
    } catch (e) { setError((e as Error).message); }
  }, [tab, profileId]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);

  async function connectWallet() {
    setError(null);
    if (!window.ethereum) return setError("MetaMask tidak terdeteksi. Install untuk menghubungkan dompet.");
    try {
      const [address] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!address) return;
      const issuedAt = new Date().toISOString();
      const signature = (await window.ethereum.request({ method: "personal_sign", params: [walletMessage(user.id, address, issuedAt), address] })) as string;
      await link({ data: { address, issuedAt, signature } });
      void loadProfile();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menghubungkan dompet."); }
  }

  if (!profile) return <p className="py-10 text-center text-sm text-muted-foreground">Memuat profil…</p>;

  return (
    <>
      <section className="glass-panel overflow-hidden rounded-[24px] border border-surface/80">
        <div className="h-24 bg-gradient-to-r from-primary/60 via-primary/25 to-surface" />
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-background"><Avatar profile={profile} size={80} /></div>
            <div className="flex gap-2">
              {isMe ? (
                <>
                  <Button variant="surface" size="sm" onClick={() => setEditing((v) => !v)}><Pencil className="size-4" />Edit profil</Button>
                  <Button variant="ghost" size="icon" aria-label="Keluar" onClick={() => supabase.auth.signOut()}><LogOut className="size-4" /></Button>
                </>
              ) : (
                <>
                  <ProfileFollowButton profileId={profile.id} />
                  <Button asChild variant="surface" size="sm"><Link to="/messages" search={{ with: profile.id }}><Mail className="size-4" />Pesan</Link></Button>
                </>
              )}
              <Button variant="ghost" size="icon" aria-label="Share profil" onClick={() => void shareLink(profileLink(profile.id), displayName(profile))}><Share2 className="size-4" /></Button>
            </div>
          </div>
          <h2 className="mt-3 flex items-center gap-1.5 font-display text-xl font-semibold">{displayName(profile)}<IdentityBadges username={profile.username} /></h2>
          {handle(profile) ? <p className="text-sm text-muted-foreground">{handle(profile)}</p> : isMe && <p className="text-sm text-muted-foreground">Belum ada username</p>}
          {profile.bio && <p className="mt-2 whitespace-pre-wrap text-sm">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />Bergabung {joined(profile.created_at)}</span>
            {profile.wallet_address ? <span className="flex items-center gap-1 text-primary"><WalletCards className="size-3.5" />{short(profile.wallet_address)} terverifikasi</span>
              : isMe && <button onClick={connectWallet} className="flex items-center gap-1 font-semibold text-link"><WalletCards className="size-3.5" />Hubungkan MetaMask</button>}
          </div>
          <FollowStats profileId={profile.id} userId={user.id} />
        </div>
      </section>

      {editing && isMe && <EditProfile profile={profile} onDone={() => { setEditing(false); void loadProfile(); void loadPosts(); }} />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="glass-panel grid grid-cols-2 rounded-full border border-surface/80 p-1">
        {(["posts", "reposts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full py-2 text-sm font-semibold transition ${tab === t ? "bg-surface shadow-tab" : "text-muted-foreground"}`}>{t === "posts" ? "Postingan" : "Remind"}</button>
        ))}
      </div>
      {posts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada {tab === "posts" ? "postingan" : "remind"}.</p>}
      {posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={loadPosts} onError={setError} />)}
    </>
  );
}

function EditProfile({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [name, setName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim();
    if (u && !/^[a-zA-Z0-9_]{3,20}$/.test(u)) return setError("Username 3–20 karakter: huruf, angka, atau _.");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() || null, username: u || null, bio: bio.trim() || null, avatar_url: avatar }).eq("id", profile.id);
    setSaving(false);
    if (error) return setError(error.code === "23505" ? "Username sudah dipakai." : error.message);
    onDone();
  }

  async function pick(file?: File) {
    if (!file) return;
    setError(null); setSaving(true);
    try { setAvatar(await uploadImage(file, "avatar")); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  const field = "h-10 w-full rounded-xl border border-border/60 bg-surface/75 px-3 text-sm outline-none focus:border-primary";
  return (
    <form onSubmit={save} className="glass-panel space-y-3 rounded-[24px] border border-surface/80 p-4">
      <div className="flex items-center gap-3">
        <Avatar profile={{ ...profile, avatar_url: avatar }} size={56} />
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-xs font-semibold">
          <Camera className="size-4" />Ganti foto
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {avatar && <button type="button" onClick={() => setAvatar(null)} className="text-xs text-muted-foreground underline">Hapus</button>}
      </div>
      <label className="block"><span className="mb-1 block text-xs font-semibold text-foreground/70">Nama</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className={field} /></label>
      <label className="block"><span className="mb-1 block text-xs font-semibold text-foreground/70">Username</span>
        <span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span><input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} placeholder="username" className={`${field} pl-7`} /></span>
      </label>
      <label className="block"><span className="mb-1 block text-xs font-semibold text-foreground/70">Bio</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} className={`${field} h-auto resize-none py-2`} /><span className="text-xs text-muted-foreground">{bio.length}/160</span></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Batal</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </form>
  );
}
