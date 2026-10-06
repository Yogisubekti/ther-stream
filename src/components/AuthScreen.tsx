import { lazy, Suspense } from "react";

const PrivyLogin = lazy(() => import("@/components/PrivyLogin"));

export function AuthScreen() {
  return (
    <section className="glass-panel mt-7 w-full max-w-[400px] rounded-[28px] border border-surface/80 p-6 sm:p-8">
      <Suspense fallback={<div className="h-40" />}><PrivyLogin /></Suspense>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        By joining you agree to the <a href="/support" className="font-semibold text-link underline underline-offset-2">Terms</a> and <a href="/support" className="font-semibold text-link underline underline-offset-2">Privacy Policy</a>.
      </p>
    </section>
  );
}
