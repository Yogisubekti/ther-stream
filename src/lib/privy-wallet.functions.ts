import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRIVY_APP_ID } from "@/lib/privy.functions";

type LinkedAccount = { type: string; address?: string; wallet_client_type?: string; chain_type?: string };

// Links the caller's Privy embedded wallet to their profile, after confirming via the Privy API
// that this wallet belongs to the Privy user with the caller's email.
export const syncPrivyWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const secret = process.env["PRIVY_APP_SECRET"];
    if (!secret) throw new Error("Privy is not configured.");
    const email = (context.claims as { email?: string }).email?.toLowerCase();
    if (!email) throw new Error("Account has no email.");
    const res = await fetch("https://auth.privy.io/api/v1/users/email/address", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${PRIVY_APP_ID}:${secret}`)}`, "privy-app-id": PRIVY_APP_ID, "Content-Type": "application/json" },
      body: JSON.stringify({ address: email }),
    });
    if (!res.ok) throw new Error("Could not read Privy account.");
    const user = (await res.json()) as { linked_accounts?: LinkedAccount[] };
    const addr = data.address.toLowerCase();
    const owns = (user.linked_accounts ?? []).some((a) => a.type === "wallet" && a.address?.toLowerCase() === addr);
    if (!owns) throw new Error("This wallet is not linked to your account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ wallet_address: addr, wallet_verified_at: new Date().toISOString() }).eq("id", context.userId);
    if (error) throw new Error(error.code === "23505" ? "This wallet is linked to another account." : "Could not save wallet.");
    return { address: addr };
  });
