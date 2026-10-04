CREATE TABLE public.verification_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL,
  chain text NOT NULL,
  token text NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  amount_usd numeric NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verification_payments TO authenticated;
GRANT ALL ON public.verification_payments TO service_role;
ALTER TABLE public.verification_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own payments" ON public.verification_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX verification_payments_user_idx ON public.verification_payments(user_id, expires_at);

CREATE TABLE public.verified_badges (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified_until timestamptz NOT NULL,
  og boolean NOT NULL DEFAULT false,
  promo_used boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verified_badges TO authenticated;
GRANT ALL ON public.verified_badges TO service_role;
ALTER TABLE public.verified_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users view badges" ON public.verified_badges FOR SELECT TO authenticated USING (true);