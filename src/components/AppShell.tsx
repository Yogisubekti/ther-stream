import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Compass, Home, Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import signalBackground from "@/assets/ponscaster-signal-bg.jpg";
import fomoLogo from "@/assets/fomo-logo.jpg.asset.json";
import { AuthScreen } from "@/components/AuthScreen";
import { Avatar } from "@/components/Avatar";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { FollowsProvider } from "@/lib/follows";
import { usePreferences } from "@/lib/preferences";
import type { Profile } from "@/lib/social";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/notifications", label: "Notifikasi", icon: Bell },
  { to: "/messages", label: "Pesan", icon: Mail },
  { to: "/fomo", label: "Fomo" },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: (user: User) => ReactNode }) {
  const { t } = usePreferences();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    void supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false).then(({ count }) => setUnread(count ?? 0));
    void supabase.from("profiles").select("id, display_name, username, bio, avatar_url, wallet_address, created_at").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <img src={signalBackground} alt="" width={1440} height={900} className="pointer-events-none fixed inset-0 h-full w-full object-cover" />
      {!ready ? null : !user ? (
        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10">
          <header className="text-center">
              <div className="relative mx-auto mb-5 grid size-16 place-items-center" aria-hidden="true">
              <span className="signal-ring absolute inset-0 rounded-full border border-primary/60" />
              <span className="signal-ring signal-ring-delay-1 absolute inset-0 rounded-full border border-primary/50" />
              <span className="signal-ring signal-ring-delay-2 absolute inset-0 rounded-full border border-primary/40" />
                <BrandLogo size={44} className="relative shadow-signal" />
            </div>
            <h1 className="font-display text-[22px] font-semibold leading-tight">Mindcaster</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Join the conversation</p>
          </header>
          <AuthScreen />
        </main>
      ) : (
        <FollowsProvider userId={user.id}>
          <header className="glass-panel sticky top-0 z-30 border-b border-surface/80">
            <div className="relative mx-auto flex h-14 max-w-[600px] items-center justify-between px-4">
              <Link to="/profile" search={{}} aria-label="Buka profil saya" className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar profile={profile} size={34} />
              </Link>
              {title === "Home" ? <BrandLogo size={34} className="pointer-events-none absolute left-1/2 -translate-x-1/2" /> : <h1 className="absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-display text-base font-semibold">{title === "Discover" ? t("discover") : title === "Notifikasi" ? t("notifications") : title === "Pesan" ? t("messages") : title === "Profil" ? t("profile") : title}</h1>}
              <div className="ml-auto">{actions}</div>
            </div>
          </header>
          <main className="relative z-10 mx-auto w-full max-w-[600px] space-y-3 px-3 pb-28 pt-4 sm:px-4">{children(user)}</main>
          <nav aria-label="Menu utama" className="glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-surface/80 pb-[env(safe-area-inset-bottom)]">
            <ul className="mx-auto grid h-16 max-w-[600px] grid-cols-5">
              {NAV.map(({ to, label, ...rest }) => {
                const Icon = "icon" in rest ? rest.icon : null;
                const translatedLabel = label === "Home" ? t("home") : label === "Discover" ? t("discover") : label === "Notifikasi" ? t("notifications") : label === "Pesan" ? t("messages") : label;
                return (
                  <li key={to}>
                    <Link to={to} activeOptions={{ exact: true, includeSearch: false }} aria-label={translatedLabel} title={translatedLabel} className="group flex h-full items-center justify-center text-muted-foreground data-[status=active]:text-foreground">
                      <span className="relative grid size-11 place-items-center rounded-full transition group-data-[status=active]:bg-primary/20">
                        {Icon ? (
                          <Icon className="size-[22px]" />
                        ) : (
                          <img src={fomoLogo.url} alt="" width={816} height={816} className="size-[24px] rounded-md object-contain" />
                        )}
                        {to === "/notifications" && unread > 0 && <span className="absolute right-1.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </FollowsProvider>
      )}
    </div>
  );
}
