import { PrivyProvider, useLoginWithEmail, useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
import { KeyRound, Mail } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { exchangePrivyToken, PRIVY_APP_ID } from "@/lib/privy.functions";

const inputClass =
  "h-11 w-full rounded-xl border border-border/60 bg-surface/75 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/25";

function Inner() {
  const { ready, authenticated, getAccessToken, logout } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail();
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth();
  const exchange = useServerFn(exchangePrivyToken);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || done.current) return;
    done.current = true;
    setBusy(true);
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Token Privy kosong.");
        const { tokenHash } = await exchange({ data: { token } });
        const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
        if (e) throw e;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal masuk.");
        done.current = false;
        await logout();
        setStep("email");
      } finally {
        setBusy(false);
      }
    })();
  }, [ready, authenticated, getAccessToken, exchange, logout]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (step === "email") {
        await sendCode({ email });
        setStep("code");
      } else {
        await loginWithCode({ code });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try { await initOAuth({ provider: "google" }); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal masuk dengan Google."); }
  }

  const loading = oauthLoading || busy || !ready || state.status === "sending-code" || state.status === "submitting-code";

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Email</span>
          <span className="relative block">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input required type="email" autoComplete="email" disabled={step === "code"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mindcaster.social" className={inputClass} />
          </span>
        </label>
        {step === "code" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Kode verifikasi</span>
            <span className="relative block">
              <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode 6 digit dari email" className={inputClass} />
            </span>
          </label>
        )}
      </div>
      {step === "code" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Kode dikirim ke {email}.{" "}
          <button type="button" className="font-semibold text-link underline underline-offset-2" onClick={() => { setStep("email"); setCode(""); }}>Ganti email</button>
        </p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading}>
        {loading ? "Mohon tunggu..." : step === "email" ? "Lanjutkan dengan Email" : "Masuk"}
      </Button>
      <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="surface" size="lg" className="w-full" disabled={loading} onClick={onGoogle}>
        <span className="font-display text-base font-semibold leading-none">G</span>Lanjutkan dengan Google
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Wallet otomatis dibuat untuk akun baru.</p>
    </form>
  );
}

export default function PrivyLogin() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google"],
        appearance: { theme: "light", accentColor: "#3B82F6" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
      }}
    >
      <Inner />
    </PrivyProvider>
  );
}
