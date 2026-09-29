import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Mail, WalletCards } from "lucide-react";
import { useState, type FormEvent } from "react";

import signalBackground from "@/assets/ponscaster-signal-bg.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ponscaster — Join the conversation" },
      { name: "description", content: "Create your Ponscaster account or sign in to join the conversation." },
      { property: "og:title", content: "Ponscaster — Join the conversation" },
      { property: "og:description", content: "Create your Ponscaster account or sign in to join the conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <img
        src={signalBackground}
        alt=""
        width={1440}
        height={900}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:py-14">
        <header className="text-center">
          <div className="relative mx-auto mb-5 grid size-16 place-items-center" aria-hidden="true">
            <span className="signal-ring absolute inset-0 rounded-full border border-primary/60" />
            <span className="signal-ring signal-ring-delay-1 absolute inset-0 rounded-full border border-primary/50" />
            <span className="signal-ring signal-ring-delay-2 absolute inset-0 rounded-full border border-primary/40" />
            <div className="relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-signal">
              <span className="font-display text-[15px] font-semibold">P</span>
            </div>
          </div>
          <h1 className="font-display text-[22px] font-semibold leading-tight">Ponscaster</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Join the conversation</p>
        </header>

        <section className="glass-panel mt-7 w-full max-w-[400px] rounded-[28px] border border-surface/80 p-6 sm:p-8">
          <div className="relative grid grid-cols-2 rounded-full bg-muted/70 p-1" role="tablist" aria-label="Authentication mode">
            <span
              aria-hidden="true"
              className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-surface shadow-tab transition-transform duration-300 ${mode === "signin" ? "translate-x-full" : "translate-x-0"}`}
            />
            <Button type="button" role="tab" aria-selected={mode === "signup"} variant="ghost" size="sm" className={`relative z-10 rounded-full ${mode === "signup" ? "text-foreground" : ""}`} onClick={() => setMode("signup")}>Sign Up</Button>
            <Button type="button" role="tab" aria-selected={mode === "signin"} variant="ghost" size="sm" className={`relative z-10 rounded-full ${mode === "signin" ? "text-foreground" : ""}`} onClick={() => setMode("signin")}>Sign In</Button>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input required type="email" autoComplete="email" placeholder="you@ponscaster.fm" className="h-11 w-full rounded-xl border border-border/60 bg-surface/75 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/25" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-foreground/70">Password</span>
                <span className="relative block">
                  <input required minLength={mode === "signup" ? 8 : undefined} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="h-11 w-full rounded-xl border border-border/60 bg-surface/75 py-2.5 pl-3.5 pr-11 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/25" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 size-9 -translate-y-1/2 rounded-lg" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </span>
              </label>
            </div>

            <Button type="submit" size="lg" className="mt-5 w-full">{mode === "signup" ? "Create Account" : "Sign In"}</Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2.5">
            <Button type="button" variant="surface" className="w-full"><span className="text-base leading-none">𝕏</span>Continue with X</Button>
            <Button type="button" variant="surface" className="w-full"><WalletCards className="size-4" />Connect MetaMask</Button>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By joining you agree to the <a href="#terms" className="font-semibold text-link underline underline-offset-2">Terms</a> and <a href="#privacy" className="font-semibold text-link underline underline-offset-2">Privacy Policy</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
