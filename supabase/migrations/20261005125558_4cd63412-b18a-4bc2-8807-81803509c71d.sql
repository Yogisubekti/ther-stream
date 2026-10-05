CREATE TABLE public.support_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('bug', 'account', 'transaction', 'other')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_reports TO authenticated;
GRANT ALL ON public.support_reports TO service_role;

ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support reports"
ON public.support_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own support reports"
ON public.support_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_support_report_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_support_report_updated_at
BEFORE UPDATE ON public.support_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_support_report_updated_at();

REVOKE ALL ON FUNCTION public.set_support_report_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_support_report_updated_at() TO service_role;