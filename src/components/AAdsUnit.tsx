// A-ADS crypto ad unit (iframe, no script). Unit id is public.
export const AADS_UNIT = "2457892";

export function AAdsUnit({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-xl ${className}`}>
      <iframe
        data-aa={AADS_UNIT}
        src={`https://acceptable.a-ads.com/${AADS_UNIT}/?size=Adaptive`}
        title="Sponsored"
        loading="lazy"
        className="mx-auto block h-[120px] w-full border-0"
        style={{ overflow: "hidden" }}
      />
    </div>
  );
}
