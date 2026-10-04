import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2 } from "lucide-react";
import { encodeFunctionData, erc20Abi } from "viem";
import { toast } from "sonner";

import ogBadge from "@/assets/og-badge.jpg.asset.json";
import { AppShell } from "@/components/AppShell";
import { refreshBadges } from "@/components/IdentityBadges";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CHAINS, PAY_TO, PLANS, type ChainId, type PlanId, type TokenId } from "@/lib/verification";
import { confirmVerificationPayment, getPromoSlots } from "@/lib/verification.functions";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verifikasi Akun — Mindcaster" },
      { name: "description", content: "Dapatkan centang biru Mindcaster dan badge OG dengan bayar USDC atau USDT." },
      { property: "og:title", content: "Verifikasi Akun — Mindcaster" },
      { property: "og:description", content: "Centang biru Mindcaster mulai $3, bayar dengan kripto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell title="Verifikasi">{(u) => <VerifyPage userId={u.id} />}</AppShell>,
});

const PLAN_INFO: Record<PlanId, { title: string; price: string; note: string }> = {
  promo: { title: "Promo Early Bird", price: "$3 / 3 bulan", note: "Khusus 1.000 orang pertama, sekali per akun" },
  monthly: { title: "Bulanan", price: "$3 / bulan", note: "Centang biru verifikasi" },
  yearly: { title: "Tahunan", price: "$30 / tahun", note: "Centang biru + badge OG + benefit mendatang" },
};

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

function VerifyPage({ userId }: { userId: string }) {
  const slotsFn = useServerFn(getPromoSlots);
  const confirmFn = useServerFn(confirmVerificationPayment);
  const [slots, setSlots] = useState<{ used: number; limit: number } | null>(null);
  const [badge, setBadge] = useState<{ verified_until: string; og: boolean; promo_used: boolean } | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId>("promo");
  const [chain, setChain] = useState<ChainId>("base");
  const [token, setToken] = useState<TokenId>("USDC");
  const [step, setStep] = useState<string | null>(null);

  async function load() {
    const [s, b, p] = await Promise.all([
      slotsFn().catch(() => null),
      supabase.from("verified_badges").select("verified_until, og, promo_used").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("wallet_address").eq("id", userId).maybeSingle(),
    ]);
    setSlots(s); setBadge(b.data); setWallet(p.data?.wallet_address ?? null);
  }
  useEffect(() => { void load(); }, [userId]);

  const active = badge && Date.parse(badge.verified_until) > Date.now();
  const promoOff = !!badge?.promo_used || (slots ? slots.used >= slots.limit : false);
  useEffect(() => { if (promoOff && plan === "promo") setPlan("monthly"); }, [promoOff, plan]);

  async function pay(): Promise<void> {
    const eth = (window as unknown as { ethereum?: Eth }).ethereum;
    if (!eth) { toast.error("MetaMask tidak terdeteksi."); return; }
    if (!wallet) { toast.error("Hubungkan dompet di profil terlebih dahulu."); return; }
    const c = CHAINS[chain]; const t = c.tokens[token];
    try {
      setStep("Menghubungkan dompet…");
      const [from] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (from?.toLowerCase() !== wallet.toLowerCase()) throw new Error("Gunakan dompet yang sama dengan yang terhubung di profil.");
      const hexId = "0x" + c.id.toString(16);
      try { await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] }); }
      catch { await eth.request({ method: "wallet_addEthereumChain", params: [{ chainId: hexId, chainName: c.name, rpcUrls: [c.rpc], blockExplorerUrls: [c.explorer], nativeCurrency: { name: chain === "bnb" ? "BNB" : chain === "polygon" ? "POL" : "ETH", symbol: chain === "bnb" ? "BNB" : chain === "polygon" ? "POL" : "ETH", decimals: 18 } }] }); }
      setStep("Konfirmasi pembayaran di dompet…");
      const value = BigInt(PLANS[plan].usd) * 10n ** BigInt(t.decimals);
      const txHash = (await eth.request({ method: "eth_sendTransaction", params: [{ from, to: t.address, data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [PAY_TO, value] }) }] })) as string;
      setStep("Menunggu konfirmasi blockchain…");
      let result;
      for (let i = 0; i < 3; i++) {
        try { result = await confirmFn({ data: { plan, chain, token, txHash } }); break; }
        catch (e) { if (i === 2 || !(e as Error).message.includes("belum terkonfirmasi")) throw e; }
      }
      toast.success(result?.og ? "Verifikasi + badge OG aktif!" : "Centang biru aktif!");
      await Promise.all([load(), refreshBadges()]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setStep(null); }
  }

  return (
    <>
      <section className="glass-panel rounded-[24px] border border-surface/80 p-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary"><BadgeCheck className="size-8" /></span>
        <h2 className="mt-3 font-display text-lg font-semibold">Verifikasi Mindcaster</h2>
        {active ? (
          <p className="mt-1 text-sm text-muted-foreground">Aktif sampai {new Date(badge!.verified_until).toLocaleDateString()}{badge!.og && " · OG member"}. Anda bisa memperpanjang kapan saja.</p>
        ) : <p className="mt-1 text-sm text-muted-foreground">Bayar dengan USDC atau USDT, centang biru aktif otomatis.</p>}
        {slots && <p className="mt-3 text-xs font-semibold text-primary">Slot promo: {Math.max(0, slots.limit - slots.used)}/{slots.limit} tersisa</p>}
      </section>

      <section className="space-y-2">
        {(Object.keys(PLAN_INFO) as PlanId[]).map((id) => {
          const off = id === "promo" && promoOff;
          return (
            <button key={id} type="button" disabled={off} onClick={() => setPlan(id)} className={`glass-panel flex w-full items-center gap-3 rounded-[20px] border p-4 text-left transition disabled:opacity-50 ${plan === id ? "border-primary ring-2 ring-primary/30" : "border-surface/80"}`}>
              {id === "yearly" ? <img src={ogBadge.url} alt="" className="size-10 rounded-full" /> : <BadgeCheck className="size-10 shrink-0 fill-primary text-primary-foreground" />}
              <span className="flex-1"><span className="block font-semibold">{PLAN_INFO[id].title}</span><span className="block text-xs text-muted-foreground">{off ? "Tidak tersedia untuk akun ini" : PLAN_INFO[id].note}</span></span>
              <span className="font-display text-sm font-semibold">{PLAN_INFO[id].price}</span>
            </button>
          );
        })}
      </section>

      <section className="glass-panel space-y-3 rounded-[24px] border border-surface/80 p-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Jaringan</p>
          <div className="flex flex-wrap gap-2">{(Object.keys(CHAINS) as ChainId[]).map((c) => <Button key={c} size="sm" variant={chain === c ? "default" : "surface"} onClick={() => setChain(c)}>{CHAINS[c].name}</Button>)}</div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Koin</p>
          <div className="flex gap-2">{(["USDC", "USDT"] as TokenId[]).map((t) => <Button key={t} size="sm" variant={token === t ? "default" : "surface"} onClick={() => setToken(t)}>{t}</Button>)}</div>
        </div>
        {!wallet && <p className="text-sm text-destructive">Hubungkan dompet MetaMask di <Link to="/profile" search={{}} className="underline">profil</Link> sebelum membayar.</p>}
        <Button className="w-full" disabled={!!step || !wallet} onClick={pay}>
          {step ? <><Loader2 className="size-4 animate-spin" />{step}</> : `Bayar $${PLANS[plan].usd} ${token} di ${CHAINS[chain].name}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Pastikan ada sedikit koin jaringan untuk biaya transaksi.</p>
      </section>
    </>
  );
}
