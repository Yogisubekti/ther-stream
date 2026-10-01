CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT user_follows_no_self CHECK (follower_id <> followed_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users view follows"
ON public.user_follows FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users follow as themselves"
ON public.user_follows FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id AND follower_id <> followed_id);

CREATE POLICY "Users unfollow as themselves"
ON public.user_follows FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

CREATE INDEX user_follows_followed_id_idx ON public.user_follows(followed_id);