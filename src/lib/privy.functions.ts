import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const PRIVY_APP_ID = "cmuwppx2900op0cjsidb6sw9r";

type LinkedAccount = { type: string; address?: string; email?: string; wallet_client_type?: string; chain_type?: string };

// Verifies a Privy access token, then mints a one-time backend sign-in token for the same email.
export const exchangePrivyToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const secret = process.env["PRIVY_APP_SECRET"];
    if (!secret) throw new Error("Privy is not configured.");
    const { jwtVerify, createRemoteJWKSet } = await import("jose");
    const jwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`));
    const { payload } = await jwtVerify(data.token, jwks, { issuer: "privy.io", audience: PRIVY_APP_ID });
    const did = payload.sub;
    if (!did) throw new Error("Invalid Privy token.");

    const fetchAccounts = async () => {
      const res = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(did)}`, {
        headers: { Authorization: `Basic ${btoa(`${PRIVY_APP_ID}:${secret}`)}`, "privy-app-id": PRIVY_APP_ID },
      });
      if (!res.ok) throw new Error("Could not read Privy account.");
      const user = (await res.json()) as { linked_accounts?: LinkedAccount[] };
      return user.linked_accounts ?? [];
    };
    const findWallet = (list: LinkedAccount[]) =>
      list.find((a) => a.type === "wallet" && a.chain_type === "ethereum" && (a.wallet_client_type === "privy" || !a.wallet_client_type))?.address?.toLowerCase()
      ?? list.find((a) => a.type === "wallet" && a.chain_type === "ethereum")?.address?.toLowerCase();
    let accounts = await fetchAccounts();
    // Embedded wallets are created right after login; wait briefly for it to appear.
    for (let i = 0; i < 4 && !findWallet(accounts); i++) {
      await new Promise((r) => setTimeout(r, 1500));
      accounts = await fetchAccounts();
    }
    const email = (accounts.find((a) => a.type === "email")?.address ?? accounts.find((a) => a.type === "google_oauth")?.email)?.toLowerCase();
    if (!email) throw new Error("Privy account needs an email or Google.");
    const wallet = findWallet(accounts);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { display_name: email.split("@")[0] } }).catch(() => null);
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !link.properties?.hashed_token) throw new Error("Could not create session.");

    if (wallet && link.user) {
      await supabaseAdmin.from("profiles").update({ wallet_address: wallet, wallet_verified_at: new Date().toISOString() }).eq("id", link.user.id).is("wallet_address", null);
    }
    return { tokenHash: link.properties.hashed_token };
  });
