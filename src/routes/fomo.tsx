import { createFileRoute } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";

import fomoLogo from "@/assets/fomo-logo.jpg.asset.json";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/fomo")({
  head: () => ({
    meta: [
      { title: "Fomo — Mindcaster" },
      { name: "description", content: "Integrasi Fomo Family di Mindcaster — pantau tren FOMO langsung dari aplikasi." },
      { property: "og:title", content: "Fomo — Mindcaster" },
      { property: "og:description", content: "Integrasi Fomo Family di Mindcaster — pantau tren FOMO langsung dari aplikasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell title="Fomo">{(u) => <Fomo user={u} />}</AppShell>,
});

function Fomo({ user: _user }: { user: User }) {
  return (
    <section className="glass-panel rounded-2xl px-6 py-10 text-center">
      <img src={fomoLogo.url} alt="Logo Fomo" width={816} height={816} loading="lazy" className="mx-auto size-24 rounded-2xl object-contain" />
      <h2 className="mt-4 font-display text-xl font-semibold">Fomo Family</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Integrasi dengan Fomo API sedang disiapkan. Nantinya kamu bisa memantau tren FOMO langsung dari sini.
      </p>
      <p className="mt-6 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">Segera hadir</p>
    </section>
  );
}
