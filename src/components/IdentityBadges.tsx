import { BadgeCheck } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";

const VERIFIED_USERS = new Set(["ybs", "thorvox", "mindcaster"]);

export function IdentityBadges({ username }: { username?: string | null }) {
  if (!username || !VERIFIED_USERS.has(username.toLowerCase())) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-label="Akun terverifikasi Mindcaster" title="Akun terverifikasi Mindcaster">
      <BadgeCheck className="size-4 fill-primary text-primary-foreground" />
      <BrandLogo size={16} className="rounded-full ring-1 ring-primary/40" />
    </span>
  );
}