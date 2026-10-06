import { Eye, EyeOff, Mail } from "lucide-react";
import { lazy, Suspense, useState, type FormEvent } from "react";

const PrivyLogin = lazy(() => import("@/components/PrivyLogin"));

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export function AuthScreen() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: email.split("@")[0] } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage({ type: "error", text: result.error.message });
    else if (mode === "signup" && !result.data.session) {
      setMessage({ type: "success", text: "Check your email to confirm your account, then sign in." });
      setMode("signin");
      setPassword("");
    }
    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
    if (result.error) { setMessage({ type: "error", text: result.error.message }); setIsLoading(false); }
    else if (!result.redirected) setIsLoading(false);
  }

  return (
    <section className="glass-panel mt-7 w-full max-w-[400px] rounded-[28px] border border-surface/80 p-6 sm:p-8">
      <Suspense fallback={<div className="h-11" />}><PrivyLogin /></Suspense>
      <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" />
      </div>
      <div className="relative grid grid-cols-2 rounded-full bg-muted/70 p-1" role="tablist" aria-label="Authentication mode">
        <span aria-hidden="true" className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-surface shadow-tab transition-transform duration-300 ${mode === "signin" ? "translate-x-full" : "translate-x-0"}`} />
        <Button type="button" role="tab" aria-selected={mode === "signup"} variant="ghost" size="sm" className={`relative z-10 rounded-full ${mode === "signup" ? "text-foreground" : ""}`} onClick={() => setMode("signup")}>Sign Up</Button>
        <Button type="button" role="tab" aria-selected={mode === "signin"} variant="ghost" size="sm" className={`relative z-10 rounded-full ${mode === "signin" ? "text-foreground" : ""}`} onClick={() => setMode("signin")}>Sign In</Button>
      </div>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Email</span>
            <span className="relative block">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mindcaster.social" className="h-11 w-full rounded-xl border border-border/60 bg-surface/75 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/25" />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Password</span>
            <span className="relative block">
              <input required minLength={mode === "signup" ? 8 : undefined} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="h-11 w-full rounded-xl border border-border/60 bg-surface/75 py-2.5 pl-3.5 pr-11 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/25" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 size-9 -translate-y-1/2 rounded-lg" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </span>
          </label>
        </div>
        {message && <p role="alert" className={`mt-4 text-sm ${message.type === "error" ? "text-destructive" : "text-foreground"}`}>{message.text}</p>}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={isLoading}>{isLoading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}</Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="surface" className="w-full" disabled={isLoading} onClick={handleGoogleSignIn}><span className="font-display text-base font-semibold leading-none">G</span>Continue with Google</Button>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        By joining you agree to the <a href="/support" className="font-semibold text-link underline underline-offset-2">Terms</a> and <a href="/support" className="font-semibold text-link underline underline-offset-2">Privacy Policy</a>.
      </p>
    </section>
  );
}
