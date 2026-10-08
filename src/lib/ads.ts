import bannerMind from "@/assets/banner-buy-mind-pons.png.asset.json";
import bannerOgNft from "@/assets/banner-og-nft.png.asset.json";

export type Ad = { text: string; image?: string; cta?: string; href?: string; external?: boolean; aads?: boolean };

// Edit this list to change sponsored posts shown in the Home feed.
export const ADS: Ad[] = [
  { text: "$MIND is coming to PONS on Robinhood Chain 🚀 The social & signal layer of the Robinhood ecosystem.", image: bannerMind.url, cta: "Trade on PONS", href: "https://www.ponsfamily.com", external: true },
  { text: "Discover crypto projects from our partners 👇", aads: true },
  { text: "Get your blue check ✅ Verify your Mindcaster account and stand out in the feed.", image: bannerOgNft.url, cta: "Verify account", href: "/verify" },
];

export const AD_EVERY = 5;
