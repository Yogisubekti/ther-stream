ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text, ADD COLUMN IF NOT EXISTS bio text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_len CHECK (bio IS NULL OR char_length(bio) <= 160);

CREATE TABLE public.post_reposts (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_reposts TO authenticated;
GRANT ALL ON public.post_reposts TO service_role;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View reposts" ON public.post_reposts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Repost as self" ON public.post_reposts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Undo own repost" ON public.post_reposts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_reactions (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('🔥','😂','😮','🚀','👏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "React as self" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove own reaction" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read DMs" ON public.direct_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Send DMs as self" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);
CREATE POLICY "Delete own sent DMs" ON public.direct_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  detail text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Mark own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid; actor uuid; kind text; extra text;
BEGIN
  IF TG_TABLE_NAME = 'direct_messages' THEN
    INSERT INTO notifications(user_id, actor_id, type, detail) VALUES (NEW.recipient_id, NEW.sender_id, 'message', left(NEW.content, 80));
    RETURN NEW;
  END IF;
  SELECT author_id INTO owner FROM posts WHERE id = NEW.post_id;
  IF TG_TABLE_NAME = 'post_likes' THEN actor := NEW.user_id; kind := 'like';
  ELSIF TG_TABLE_NAME = 'post_reposts' THEN actor := NEW.user_id; kind := 'repost';
  ELSIF TG_TABLE_NAME = 'post_reactions' THEN actor := NEW.user_id; kind := 'reaction'; extra := NEW.emoji;
  ELSE actor := NEW.author_id; kind := 'comment'; extra := left(NEW.content, 80);
  END IF;
  IF owner IS NOT NULL AND owner <> actor THEN
    INSERT INTO notifications(user_id, actor_id, type, post_id, detail) VALUES (owner, actor, kind, NEW.post_id, extra);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_activity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_activity();
CREATE TRIGGER notify_repost AFTER INSERT ON public.post_reposts FOR EACH ROW EXECUTE FUNCTION public.notify_activity();
CREATE TRIGGER notify_reaction AFTER INSERT ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.notify_activity();
CREATE TRIGGER notify_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_activity();
CREATE TRIGGER notify_dm AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.notify_activity();
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_len CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 60000);