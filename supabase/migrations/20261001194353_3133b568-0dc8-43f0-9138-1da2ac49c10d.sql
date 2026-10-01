CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active stories" ON public.stories FOR SELECT TO authenticated USING (expires_at > now() OR auth.uid() = author_id);
CREATE POLICY "Post own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND expires_at <= now() + interval '24 hours 1 minute');
CREATE POLICY "Delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX stories_expires_idx ON public.stories(expires_at);