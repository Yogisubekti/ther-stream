CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid; pid uuid;
BEGIN
  actor := NEW.author_id;
  IF TG_TABLE_NAME = 'posts' THEN pid := NEW.id; ELSE pid := NEW.post_id; END IF;
  INSERT INTO notifications(user_id, actor_id, type, post_id, detail)
  SELECT DISTINCT p.id, actor, 'mention', pid, left(NEW.content, 80)
  FROM regexp_matches(NEW.content, '@([A-Za-z0-9_]{2,30})', 'g') AS m(u)
  JOIN profiles p ON lower(p.username) = lower(m.u[1])
  WHERE p.id <> actor;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_mentions() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_post_mentions AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();
CREATE TRIGGER notify_comment_mentions AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();