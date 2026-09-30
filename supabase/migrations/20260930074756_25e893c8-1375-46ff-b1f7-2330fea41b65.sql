CREATE TABLE public.post_bookmarks (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_bookmarks TO authenticated;
GRANT ALL ON public.post_bookmarks TO service_role;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookmarks"
ON public.post_bookmarks FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Users bookmark as themselves"
ON public.post_bookmarks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own bookmarks"
ON public.post_bookmarks FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'illegal', 'other')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);
GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reports"
ON public.post_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);
CREATE POLICY "Users report as themselves"
ON public.post_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);