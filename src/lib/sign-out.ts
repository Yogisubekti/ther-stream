import { supabase } from "@/integrations/supabase/client";

/** Flag read by the login screen: clear the Privy session instead of auto-signing back in. */
export const SIGNED_OUT_KEY = "mindcaster-signed-out";

export async function signOutEverywhere() {
  window.localStorage.setItem(SIGNED_OUT_KEY, "1");
  // Drop cached Privy tokens so the wallet login can't silently restore the session.
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith("privy:")) window.localStorage.removeItem(key);
  }
  await supabase.auth.signOut();
}
