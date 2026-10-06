import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { exchangePrivyToken, PRIVY_APP_ID } from "@/lib/privy.functions";

function Inner() {
  const { ready, authenticated, login, getAccessToken, logout } = usePrivy();
  const exchange = useServerFn(exchangePrivyToken);
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
      } finally {
        setBusy(false);
      }
    })();
  }, [ready, authenticated, getAccessToken, exchange, logout]);

  return (
    <>
      <Button type="button" size="lg" className="w-full" disabled={!ready || busy} onClick={() => { setError(null); login(); }}>
        {busy ? "Menyiapkan akun & wallet..." : "Masuk / Daftar dengan Privy"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Wallet otomatis dibuat untuk akun baru.</p>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </>
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
