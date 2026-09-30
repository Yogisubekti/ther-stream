import logoAsset from "@/assets/mindcaster-logo.jpg.asset.json";

export function BrandLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <img src={logoAsset.url} alt="Mindcaster" width={size} height={size} className={`shrink-0 rounded-lg object-cover ${className}`} />;
}