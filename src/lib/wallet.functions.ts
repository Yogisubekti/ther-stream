import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function walletMessage(userId: string, address: string, issuedAt: string) {
  return `Ponscaster wallet link\nUser: ${userId}\nWallet: ${address.toLowerCase()}\nIssued: ${issuedAt}`;
}

export const linkWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      issuedAt: z.string(),
      signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const issued = Date.parse(data.issuedAt);
    if (!issued || Math.abs(Date.now() - issued) > 5 * 60 * 1000) throw new Error("Signature expired, try again.");
    const { verifyMessage } = await import("viem");
    const ok = await verifyMessage({
      address: data.address as `0x${string}`,
      message: walletMessage(context.userId, data.address, data.issuedAt),
      signature: data.signature as `0x${string}`,
    });
    if (!ok) throw new Error("Invalid wallet signature.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_address: data.address.toLowerCase(), wallet_verified_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.code === "23505" ? "This wallet is linked to another account." : "Could not save wallet.");
    return { address: data.address.toLowerCase() };
  });
