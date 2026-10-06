CREATE TABLE public.story_views (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Record own view" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Update own view" ON public.story_views FOR UPDATE TO authenticated USING (auth.uid() = viewer_id) WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Viewer or story owner reads" ON public.story_views FOR SELECT TO authenticated USING (
  auth.uid() = viewer_id OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid())
);