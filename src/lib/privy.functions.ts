import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const PRIVY_APP_ID = "cmuwppx2900op0cjsidb6sw9r";

type LinkedAccount = { type: string; address?: string; email?: string; wallet_client_type?: string; chain_type?: string };

// Verifies a Privy access token, then mints a one-time backend sign-in token for the same email.
export const exchangePrivyToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const secret = process.env["PRIVY_APP_SECRET"];
    if (!secret) throw new Error("Privy belum dikonfigurasi.");
    const { jwtVerify, createRemoteJWKSet } = await import("jose");
    const jwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`));
    const { payload } = await jwtVerify(data.token, jwks, { issuer: "privy.io", audience: PRIVY_APP_ID });
    const did = payload.sub;
    if (!did) throw new Error("Token Privy tidak valid.");

    const res = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(did)}`, {
      headers: { Authorization: `Basic ${btoa(`${PRIVY_APP_ID}:${secret}`)}`, "privy-app-id": PRIVY_APP_ID },
    });
    if (!res.ok) throw new Error("Gagal membaca akun Privy.");
    const user = (await res.json()) as { linked_accounts?: LinkedAccount[] };
    const accounts = user.linked_accounts ?? [];
    const email = (accounts.find((a) => a.type === "email")?.address ?? accounts.find((a) => a.type === "google_oauth")?.email)?.toLowerCase();
    if (!email) throw new Error("Akun Privy perlu email atau Google.");
    const wallet = accounts.find((a) => a.type === "wallet" && a.wallet_client_type === "privy" && a.chain_type === "ethereum")?.address?.toLowerCase();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { display_name: email.split("@")[0] } }).catch(() => null);
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !link.properties?.hashed_token) throw new Error("Gagal membuat sesi.");

    if (wallet && link.user) {
      await supabaseAdmin.from("profiles").update({ wallet_address: wallet, wallet_verified_at: new Date().toISOString() }).eq("id", link.user.id).is("wallet_address", null);
    }
    return { tokenHash: link.properties.hashed_token };
  });
