import { ExternalLink, Megaphone } from "lucide-react";
import { Link } from "@tanstack/react-router";

import bannerMind from "@/assets/banner-buy-mind-pons.png.asset.json";
import bannerOgNft from "@/assets/banner-og-nft.png.asset.json";
import { AAdsUnit } from "@/components/AAdsUnit";
import { BrandLogo } from "@/components/BrandLogo";

type Ad = { text: string; image?: string; cta?: string; href?: string; external?: boolean; aads?: boolean };

// Edit this list to change sponsored posts shown in the Home feed.
export const ADS: Ad[] = [
  { text: "$MIND is coming to PONS on Robinhood Chain 🚀 The social & signal layer of the Robinhood ecosystem.", image: bannerMind.url, cta: "Trade on PONS", href: "https://www.ponsfamily.com", external: true },
  { text: "Discover crypto projects from our partners 👇", aads: true },
  { text: "Get your blue check ✅ Verify your Mindcaster account and stand out in the feed.", image: bannerOgNft.url, cta: "Verify account", href: "/verify" },
];

export const AD_EVERY = 5;

export function SponsoredPost({ ad }: { ad: Ad }) {
  const cls = "mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground";
  return (
    <article className="glass-panel rounded-[24px] border border-surface/80 p-4">
      <div className="flex items-center gap-3">
        <BrandLogo size={40} className="rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">Mindcaster Ads</p>
          <p className="text-xs text-muted-foreground">@ads</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary"><Megaphone className="size-3" />Sponsored</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{ad.text}</p>
      {ad.aads && <AAdsUnit className="mt-3" />}
      {ad.image && <img src={ad.image} alt="" loading="lazy" className="mt-3 aspect-[16/9] w-full rounded-xl object-cover" />}
      {ad.href && ad.cta && (ad.external
        ? <a href={ad.href} target="_blank" rel="noreferrer" className={cls}>{ad.cta}<ExternalLink className="size-3.5" /></a>
        : <Link to={ad.href} className={cls}>{ad.cta}</Link>)}
    </article>
  );
}
