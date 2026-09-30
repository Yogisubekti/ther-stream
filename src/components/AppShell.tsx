import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Compass, Home, Mail, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import signalBackground from "@/assets/ponscaster-signal-bg.jpg";
import { AuthScreen } from "@/components/AuthScreen";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/notifications", label: "Notifikasi", icon: Bell },
  { to: "/messages", label: "Pesan", icon: Mail },
  { to: "/profile", label: "Profil", icon: UserRound },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    void supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false).then(({ count }) => setUnread(count ?? 0));
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
              <div className="relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-signal"><span className="font-display text-[15px] font-semibold">P</span></div>
            </div>
            <h1 className="font-display text-[22px] font-semibold leading-tight">Ponscaster</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Join the conversation</p>
          </header>
          <AuthScreen />
        </main>
      ) : (
        <>
          <header className="glass-panel sticky top-0 z-30 border-b border-surface/80">
            <div className="mx-auto flex h-14 max-w-[600px] items-center gap-3 px-4">
              <span className="grid size-8 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground shadow-signal">P</span>
              <h1 className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{title}</h1>
              {actions}
            </div>
          </header>
          <main className="relative z-10 mx-auto w-full max-w-[600px] space-y-3 px-3 pb-28 pt-4 sm:px-4">{children(user)}</main>
          <nav aria-label="Menu utama" className="glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-surface/80 pb-[env(safe-area-inset-bottom)]">
            <ul className="mx-auto grid h-16 max-w-[600px] grid-cols-5">
              {NAV.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} activeOptions={{ exact: true, includeSearch: false }} className="group flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-foreground">
                    <span className="relative grid h-8 w-12 place-items-center rounded-full transition group-data-[status=active]:bg-primary/20">
                      <Icon className="size-5" />
                      {to === "/notifications" && unread > 0 && <span className="absolute right-1.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
