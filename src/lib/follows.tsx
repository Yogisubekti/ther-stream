import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type FollowsValue = { following: Set<string>; pending: Set<string>; toggleFollow: (profileId: string) => Promise<void> };
const FollowsContext = createContext<FollowsValue | null>(null);

export function FollowsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    void supabase.from("user_follows").select("followed_id").eq("follower_id", userId).then(({ data }) => {
      setFollowing(new Set((data ?? []).map((row) => row.followed_id)));
    });
  }, [userId]);

  const toggleFollow = useCallback(async (profileId: string) => {
    if (profileId === userId || pending.has(profileId)) return;
    const wasFollowing = following.has(profileId);
    setPending((current) => new Set(current).add(profileId));
    setFollowing((current) => {
      const next = new Set(current);
      if (wasFollowing) next.delete(profileId); else next.add(profileId);
      return next;
    });
    const { error } = wasFollowing
      ? await supabase.from("user_follows").delete().eq("follower_id", userId).eq("followed_id", profileId)
      : await supabase.from("user_follows").insert({ follower_id: userId, followed_id: profileId });
    if (error) setFollowing((current) => {
      const next = new Set(current);
      if (wasFollowing) next.add(profileId); else next.delete(profileId);
      return next;
    });
    setPending((current) => { const next = new Set(current); next.delete(profileId); return next; });
  }, [following, pending, userId]);

  const value = useMemo(() => ({ following, pending, toggleFollow }), [following, pending, toggleFollow]);
  return <FollowsContext.Provider value={value}>{children}</FollowsContext.Provider>;
}

export function useFollows() {
  const value = useContext(FollowsContext);
  if (!value) throw new Error("useFollows must be used inside FollowsProvider");
  return value;
}