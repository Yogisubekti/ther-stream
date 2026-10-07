import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Avatar } from "@/components/Avatar";
import { IdentityBadges } from "@/components/IdentityBadges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useFollows } from "@/lib/follows";
import { displayName, handle, type Profile } from "@/lib/social";

type Tab = "following" | "followers";
const COLS = "id, display_name, username, bio, avatar_url, created_at";

export function FollowStats({ profileId, userId }: { profileId: string; userId: string }) {
  const { following: myFollowing } = useFollows();
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [open, setOpen] = useState<Tab | null>(null);

  const loadCounts = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from("user_follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", profileId),
      supabase.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", profileId),
    ]);
    setCounts({ following: a.count ?? 0, followers: b.count ?? 0 });
  }, [profileId]);

  // Refresh when the viewer follows/unfollows anyone.
  useEffect(() => { void loadCounts(); }, [loadCounts, myFollowing]);

  return (
    <>
      <div className="mt-3 flex gap-4 text-sm">
        <button onClick={() => setOpen("following")} className="hover:underline"><span className="font-semibold">{counts.following}</span> <span className="text-muted-foreground">Following</span></button>
        <button onClick={() => setOpen("followers")} className="hover:underline"><span className="font-semibold">{counts.followers}</span> <span className="text-muted-foreground">Followers</span></button>
      </div>
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Connections</DialogTitle></DialogHeader>
          {open && <FollowList profileId={profileId} userId={userId} tab={open} setTab={setOpen} onNavigate={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FollowList({ profileId, userId, tab, setTab, onNavigate }: { profileId: string; userId: string; tab: Tab; setTab: (t: Tab) => void; onNavigate: () => void }) {
  const { following, pending, toggleFollow } = useFollows();
  const [people, setPeople] = useState<Profile[] | null>(null);

  useEffect(() => {
    setPeople(null);
    const [mine, other] = tab === "following" ? ["follower_id", "followed_id"] as const : ["followed_id", "follower_id"] as const;
    void (async () => {
      const { data } = await supabase.from("user_follows").select(other).eq(mine, profileId).order("created_at", { ascending: false }).limit(200);
      const ids = (data ?? []).map((r) => (r as Record<string, string>)[other]).filter((x): x is string => !!x);
      if (!ids.length) return setPeople([]);
      const { data: profs } = await supabase.from("profiles").select(COLS).in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
      setPeople(ids.map((id) => byId.get(id)).filter((p): p is Profile => !!p));
    })();
  }, [profileId, tab]);

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 rounded-full bg-muted p-1">
        {(["following", "followers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full py-1.5 text-sm font-semibold transition ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{t === "following" ? "Following" : "Followers"}</button>
        ))}
      </div>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {people === null && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
        {people?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{tab === "following" ? "Not following anyone yet." : "No followers yet."}</p>}
        {people?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/60">
            <Link to="/profile" search={{ id: p.id }} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar profile={p} size={40} />
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate text-sm font-semibold">{displayName(p)}<IdentityBadges username={p.username} /></p>
                {handle(p) && <p className="truncate text-xs text-muted-foreground">{handle(p)}</p>}
              </div>
            </Link>
            {p.id !== userId && (
              <Button size="sm" variant={following.has(p.id) ? "surface" : "default"} disabled={pending.has(p.id)} onClick={() => toggleFollow(p.id)}>
                {following.has(p.id) ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileFollowButton({ profileId }: { profileId: string }) {
  const { following, pending, toggleFollow } = useFollows();
  const on = following.has(profileId);
  return <Button size="sm" variant={on ? "surface" : "default"} disabled={pending.has(profileId)} onClick={() => toggleFollow(profileId)}>{on ? "Following" : "Follow"}</Button>;
}
