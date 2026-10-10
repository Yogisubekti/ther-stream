-- =====================================================================
-- MINDCASTER — Skrip SQL lengkap (struktur + data)
-- Dibuat: 2026-10-10
-- Isi: 16 tabel (profiles, posts, stories, story_views, post_likes,
--   post_comments, post_reactions, post_reposts, post_bookmarks,
--   post_reports, user_follows, direct_messages, notifications,
--   support_reports, verification_payments, verified_badges),
--   fungsi, trigger (mention, notifikasi, username terlarang, proteksi
--   wallet), aturan akses (RLS), dan semua data yang ada.
-- Cara pakai: buka SQL Editor di project baru, tempel, lalu Run.
-- Catatan: akun login (auth.users) tidak ikut. Relasi profiles -> auth.users
--   dibuat NOT VALID agar data profil tetap bisa dimasukkan.
-- PERINGATAN: skrip menghapus tabel dengan nama sama sebelum membuat ulang.
-- =====================================================================
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS "Viewer or story owner reads" ON public.story_views;
DROP POLICY IF EXISTS "View reposts" ON public.post_reposts;
DROP POLICY IF EXISTS "View reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "View active stories" ON public.stories;
DROP POLICY IF EXISTS "Users view own reports" ON public.post_reports;
DROP POLICY IF EXISTS "Users view own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users update own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users unfollow as themselves" ON public.user_follows;
DROP POLICY IF EXISTS "Users report as themselves" ON public.post_reports;
DROP POLICY IF EXISTS "Users remove own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users remove own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users like as themselves" ON public.post_likes;
DROP POLICY IF EXISTS "Users follow as themselves" ON public.user_follows;
DROP POLICY IF EXISTS "Users delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Users delete own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users create own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view their own support reports" ON public.support_reports;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can submit their own support reports" ON public.support_reports;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users bookmark as themselves" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Update own view" ON public.story_views;
DROP POLICY IF EXISTS "Undo own repost" ON public.post_reposts;
DROP POLICY IF EXISTS "Signed-in users view posts" ON public.posts;
DROP POLICY IF EXISTS "Signed-in users view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Signed-in users view follows" ON public.user_follows;
DROP POLICY IF EXISTS "Signed-in users view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Signed-in users view badges" ON public.verified_badges;
DROP POLICY IF EXISTS "Signed-in users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Send DMs as self" ON public.direct_messages;
DROP POLICY IF EXISTS "Repost as self" ON public.post_reposts;
DROP POLICY IF EXISTS "Remove own reaction" ON public.post_reactions;
DROP POLICY IF EXISTS "Record own view" ON public.story_views;
DROP POLICY IF EXISTS "Read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "React as self" ON public.post_reactions;
DROP POLICY IF EXISTS "Post own stories" ON public.stories;
DROP POLICY IF EXISTS "Participants read DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Owners view own payments" ON public.verification_payments;
DROP POLICY IF EXISTS "Mark own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Delete own stories" ON public.stories;
DROP POLICY IF EXISTS "Delete own sent DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Delete own notifications" ON public.notifications;
ALTER TABLE IF EXISTS ONLY public.verified_badges DROP CONSTRAINT IF EXISTS verified_badges_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.verification_payments DROP CONSTRAINT IF EXISTS verification_payments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_follows DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_follows DROP CONSTRAINT IF EXISTS user_follows_followed_id_fkey;
ALTER TABLE IF EXISTS ONLY public.support_reports DROP CONSTRAINT IF EXISTS support_reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.story_views DROP CONSTRAINT IF EXISTS story_views_viewer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.story_views DROP CONSTRAINT IF EXISTS story_views_story_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stories DROP CONSTRAINT IF EXISTS stories_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS ONLY public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reposts DROP CONSTRAINT IF EXISTS post_reposts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reposts DROP CONSTRAINT IF EXISTS post_reposts_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reports DROP CONSTRAINT IF EXISTS post_reports_reporter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reports DROP CONSTRAINT IF EXISTS post_reports_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_author_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_bookmarks DROP CONSTRAINT IF EXISTS post_bookmarks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_bookmarks DROP CONSTRAINT IF EXISTS post_bookmarks_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_recipient_id_fkey;
DROP TRIGGER IF EXISTS set_support_report_updated_at ON public.support_reports;
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS set_comments_updated_at ON public.post_comments;
DROP TRIGGER IF EXISTS protect_profile_wallet ON public.profiles;
DROP TRIGGER IF EXISTS profiles_reserved_username ON public.profiles;
DROP TRIGGER IF EXISTS notify_repost ON public.post_reposts;
DROP TRIGGER IF EXISTS notify_reaction ON public.post_reactions;
DROP TRIGGER IF EXISTS notify_post_mentions ON public.posts;
DROP TRIGGER IF EXISTS notify_like ON public.post_likes;
DROP TRIGGER IF EXISTS notify_dm ON public.direct_messages;
DROP TRIGGER IF EXISTS notify_comment_mentions ON public.post_comments;
DROP TRIGGER IF EXISTS notify_comment ON public.post_comments;
DROP INDEX IF EXISTS public.verification_payments_user_idx;
DROP INDEX IF EXISTS public.user_follows_followed_id_idx;
DROP INDEX IF EXISTS public.stories_expires_idx;
DROP INDEX IF EXISTS public.profiles_username_key;
DROP INDEX IF EXISTS public.posts_created_at_idx;
DROP INDEX IF EXISTS public.post_comments_post_idx;
ALTER TABLE IF EXISTS ONLY public.verified_badges DROP CONSTRAINT IF EXISTS verified_badges_pkey;
ALTER TABLE IF EXISTS ONLY public.verification_payments DROP CONSTRAINT IF EXISTS verification_payments_tx_hash_key;
ALTER TABLE IF EXISTS ONLY public.verification_payments DROP CONSTRAINT IF EXISTS verification_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.user_follows DROP CONSTRAINT IF EXISTS user_follows_pkey;
ALTER TABLE IF EXISTS ONLY public.support_reports DROP CONSTRAINT IF EXISTS support_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.story_views DROP CONSTRAINT IF EXISTS story_views_pkey;
ALTER TABLE IF EXISTS ONLY public.stories DROP CONSTRAINT IF EXISTS stories_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_wallet_address_key;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.posts DROP CONSTRAINT IF EXISTS posts_pkey;
ALTER TABLE IF EXISTS ONLY public.post_reposts DROP CONSTRAINT IF EXISTS post_reposts_pkey;
ALTER TABLE IF EXISTS ONLY public.post_reports DROP CONSTRAINT IF EXISTS post_reports_post_id_reporter_id_key;
ALTER TABLE IF EXISTS ONLY public.post_reports DROP CONSTRAINT IF EXISTS post_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_pkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.post_bookmarks DROP CONSTRAINT IF EXISTS post_bookmarks_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_pkey;
DROP TABLE IF EXISTS public.verified_badges;
DROP TABLE IF EXISTS public.verification_payments;
DROP TABLE IF EXISTS public.user_follows;
DROP TABLE IF EXISTS public.support_reports;
DROP TABLE IF EXISTS public.story_views;
DROP TABLE IF EXISTS public.stories;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.posts;
DROP TABLE IF EXISTS public.post_reposts;
DROP TABLE IF EXISTS public.post_reports;
DROP TABLE IF EXISTS public.post_reactions;
DROP TABLE IF EXISTS public.post_likes;
DROP TABLE IF EXISTS public.post_comments;
DROP TABLE IF EXISTS public.post_bookmarks;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.direct_messages;
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.set_support_report_updated_at();
DROP FUNCTION IF EXISTS public.protect_wallet_fields();
DROP FUNCTION IF EXISTS public.notify_mentions();
DROP FUNCTION IF EXISTS public.notify_activity();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_wallet();
DROP FUNCTION IF EXISTS public.check_reserved_username();
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: check_reserved_username(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_reserved_username() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE u text := lower(NEW.username);
BEGIN
  IF current_user IN ('service_role','postgres','supabase_admin') THEN RETURN NEW; END IF;
  IF NEW.username IS NULL OR (TG_OP = 'UPDATE' AND lower(coalesce(OLD.username,'')) = u) THEN RETURN NEW; END IF;
  IF length(u) <= 3 AND u <> 'ybs' THEN RAISE EXCEPTION 'Username is reserved' USING ERRCODE = 'P0001'; END IF;
  IF u = ANY (ARRAY['binance','bitget','okx','wallet','cz','brian','jesse','cto','coinbase','bybit','kraken','kucoin','gateio','mexc','htx','huobi','bitfinex','bitstamp','gemini','uniswap','pancakeswap','metamask','phantom','trustwallet','ledger','opensea','tether','circle','usdc','usdt','solana','ethereum','bitcoin','polygon','arbitrum','optimism','base','chainlink','satoshi','nakamoto','vitalik','vitalikbuterin','saylor','elonmusk','elon','tesla','apple','google','microsoft','meta','facebook','twitter','telegram','privy','robinhood','paypal','visa','mastercard','admin','administrator','support','official','help','moderator','system','root','mindcaster','fomo']) THEN
    RAISE EXCEPTION 'Username is reserved' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: get_my_wallet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_wallet() RETURNS TABLE(wallet_address text, wallet_verified_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT wallet_address, wallet_verified_at FROM public.profiles WHERE id = auth.uid() $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: notify_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: notify_mentions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_mentions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: protect_wallet_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_wallet_fields() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user NOT IN ('service_role','postgres','supabase_admin')
     AND (NEW.wallet_address IS DISTINCT FROM OLD.wallet_address OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at) THEN
    RAISE EXCEPTION 'Wallet can only be changed via verification';
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: set_support_report_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_support_report_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direct_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT direct_messages_content_check CHECK (((char_length(content) >= 1) AND (char_length(content) <= 1000)))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    type text NOT NULL,
    post_id uuid,
    detail text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_bookmarks (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_comments_content_check CHECK (((char_length(content) >= 1) AND (char_length(content) <= 300)))
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_reactions (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_reactions_emoji_check CHECK ((emoji = ANY (ARRAY['🔥'::text, '😂'::text, '😮'::text, '🚀'::text, '👏'::text])))
);


--
-- Name: post_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_reports_reason_check CHECK ((reason = ANY (ARRAY['spam'::text, 'harassment'::text, 'misinformation'::text, 'illegal'::text, 'other'::text])))
);


--
-- Name: post_reposts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_reposts (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    CONSTRAINT posts_content_check CHECK (((char_length(content) >= 1) AND (char_length(content) <= 500)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    wallet_address text,
    wallet_verified_at timestamp with time zone,
    username text,
    bio text,
    CONSTRAINT profiles_avatar_len CHECK (((avatar_url IS NULL) OR (char_length(avatar_url) <= 60000))),
    CONSTRAINT profiles_bio_len CHECK (((bio IS NULL) OR (char_length(bio) <= 160))),
    CONSTRAINT profiles_username_format CHECK (((username IS NULL) OR (username ~ '^[a-zA-Z0-9_]{3,20}$'::text)))
);


--
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    music_url text,
    music_title text,
    CONSTRAINT stories_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT stories_music_title_check CHECK (((music_title IS NULL) OR (length(music_title) <= 120)))
);


--
-- Name: story_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_views (
    story_id uuid NOT NULL,
    viewer_id uuid NOT NULL,
    reaction text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT support_reports_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'account'::text, 'transaction'::text, 'other'::text]))),
    CONSTRAINT support_reports_description_check CHECK (((char_length(description) >= 10) AND (char_length(description) <= 2000))),
    CONSTRAINT support_reports_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'reviewing'::text, 'resolved'::text]))),
    CONSTRAINT support_reports_subject_check CHECK (((char_length(subject) >= 3) AND (char_length(subject) <= 120)))
);


--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_follows (
    follower_id uuid NOT NULL,
    followed_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_follows_no_self CHECK ((follower_id <> followed_id))
);


--
-- Name: verification_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan text NOT NULL,
    chain text NOT NULL,
    token text NOT NULL,
    tx_hash text NOT NULL,
    amount_usd numeric NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: verified_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verified_badges (
    user_id uuid NOT NULL,
    verified_until timestamp with time zone NOT NULL,
    og boolean DEFAULT false NOT NULL,
    promo_used boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: direct_messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.direct_messages (id, sender_id, recipient_id, content, created_at) VALUES ('57343897-d048-4d30-921d-96a775aceae3', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Hallo bro apa kabar', '2026-09-30 07:33:52+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('1c043039-dc44-4821-9152-ca80c0718e63', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'like', 'aca4a5cb-5667-425b-aede-2689289a406a', NULL, false, '2026-09-30 07:30:12+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('3e304c8f-08d2-474b-a0e1-cca082ce5be4', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'reaction', 'aca4a5cb-5667-425b-aede-2689289a406a', '🚀', false, '2026-09-30 07:30:22+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('14c96324-6529-4fb2-aaca-02a78eae0409', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'message', NULL, 'Hallo bro apa kabar', false, '2026-09-30 07:33:52+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('345c2d88-e43c-47f3-a6ee-f88241596122', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0e0bc613-b892-4bf8-845a-067718c8c950', 'like', 'a1000000-0000-4000-8000-000000000003', NULL, false, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('82585c08-3502-404d-b384-781baded5dd0', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'reaction', 'a1000000-0000-4000-8000-000000000003', '👏', false, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('d735e9e1-00af-4002-8db6-afa9911ac0bf', '0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'mention', 'a1000000-0000-4000-8000-000000000003', 'Proud to be part of @Mindcaster. Stories, reminds and FOMO alerts all in one pla', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('1590884c-3322-4c36-bd88-09406e76222f', '0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'comment', 'a1000000-0000-4000-8000-000000000001', 'Let''s go! 🔥', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('590f2b96-8425-4d06-9de1-14b9d16bb357', '0e0bc613-b892-4bf8-845a-067718c8c950', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'comment', 'a1000000-0000-4000-8000-000000000001', 'Great start, excited to build here.', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('c6a8f2e2-286e-420e-8443-523bd5c50f83', '0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'like', 'a1000000-0000-4000-8000-000000000001', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('810f4986-4455-4bf4-b966-b856b61e019e', '0e0bc613-b892-4bf8-845a-067718c8c950', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'like', 'a1000000-0000-4000-8000-000000000001', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('2d6f6be8-89c0-45e8-866a-b59c90650db5', '0e0bc613-b892-4bf8-845a-067718c8c950', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'like', 'a1000000-0000-4000-8000-000000000005', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('ebe0b483-e647-4a7f-97ec-2797fa86fdab', '0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'reaction', 'a1000000-0000-4000-8000-000000000001', '🔥', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('6d5c24ae-f410-497f-aa13-39002cda128a', '0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'repost', 'a1000000-0000-4000-8000-000000000001', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('a9e3367f-120a-499e-9a65-dc5116469507', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '0e0bc613-b892-4bf8-845a-067718c8c950', 'like', 'aca4a5cb-5667-425b-aede-2689289a406a', NULL, false, '2026-10-07 19:17:22.865781+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('ca3e07a0-6e32-4657-afab-75373167d083', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'aca4a5cb-5667-425b-aede-2689289a406a', NULL, false, '2026-10-08 06:09:51.787691+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('d4386bb9-642c-40f9-b0b5-edb1e25aecfb', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'like', 'a1000000-0000-4000-8000-000000000004', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('0a2ac640-2161-456f-a818-579d2300de30', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '0e0bc613-b892-4bf8-845a-067718c8c950', 'like', 'eac20b69-fb36-468f-9486-94af89fe5886', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('0566ceaf-0320-4e2f-b285-3371af795306', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '0e0bc613-b892-4bf8-845a-067718c8c950', 'reaction', 'a1000000-0000-4000-8000-000000000004', '🔥', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('8149a9e6-428d-43bf-9a66-89e2ade379e4', '0e0bc613-b892-4bf8-845a-067718c8c950', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'a1000000-0000-4000-8000-000000000005', NULL, false, '2026-10-08 05:57:11.915146+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('94c29e0f-b932-4456-b97c-a55f45c90f21', '0e0bc613-b892-4bf8-845a-067718c8c950', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'a1000000-0000-4000-8000-000000000001', NULL, false, '2026-10-08 05:57:13.647533+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('cd27aee1-4fe5-4f75-bb2b-668add104eac', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'mention', 'a1000000-0000-4000-8000-000000000002', 'Watching $BTC hold strong this week. What is everyone accumulating? @Thorvox @yb', false, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('b1aa2987-90ba-4414-bdb7-4af61775a073', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'a1000000-0000-4000-8000-000000000003', NULL, false, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('4c9230e7-b848-4608-9bf3-69ac9baf7ecc', '0e0bc613-b892-4bf8-845a-067718c8c950', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'a1000000-0000-4000-8000-000000000001', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('c797c0c4-b303-4d5d-a7a4-0d6f66fb5f4a', '0e0bc613-b892-4bf8-845a-067718c8c950', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'reaction', 'a1000000-0000-4000-8000-000000000001', '🚀', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('26276717-d08c-4f48-bd39-690973b84bcc', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'mention', 'a1000000-0000-4000-8000-000000000002', 'Watching $BTC hold strong this week. What is everyone accumulating? @Thorvox @yb', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('e7883c1b-6c8d-4cec-854a-1d06c19c3916', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'comment', 'a1000000-0000-4000-8000-000000000004', 'Keep building bro 💪', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('5248da59-0690-4c51-8b28-d1adf5c0b22f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'comment', 'a1000000-0000-4000-8000-000000000002', 'Stacking $ETH slowly 👀', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('8d203a3c-e9b1-42da-bf83-7eb843181116', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'comment', 'a1000000-0000-4000-8000-000000000002', 'Same here, DCA all the way.', true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('ecf88721-e596-48b5-94da-ecac747e2f76', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '0e0bc613-b892-4bf8-845a-067718c8c950', 'like', 'a1000000-0000-4000-8000-000000000002', NULL, true, '2026-10-07 18:34:16.658101+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('c749e1f4-8380-4eef-a67e-c805614c4075', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'a1000000-0000-4000-8000-000000000004', NULL, true, '2026-10-08 06:09:43.466148+00');
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, detail, read, created_at) VALUES ('ef5a25c2-210a-410d-936c-3a0f490a8c79', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'like', 'eac20b69-fb36-468f-9486-94af89fe5886', NULL, true, '2026-10-08 06:09:49.935263+00');


--
-- Data for Name: post_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.post_comments (id, post_id, author_id, content, created_at, updated_at) VALUES ('5457fe4d-69b2-4124-b936-f18f9a534d7f', 'a1000000-0000-4000-8000-000000000001', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Let''s go! 🔥', '2026-10-07 12:44:16.658101+00', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_comments (id, post_id, author_id, content, created_at, updated_at) VALUES ('7a2e3e5e-001a-4b59-a1ca-147c45b5f167', 'a1000000-0000-4000-8000-000000000001', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'Great start, excited to build here.', '2026-10-07 12:54:16.658101+00', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_comments (id, post_id, author_id, content, created_at, updated_at) VALUES ('08050cf8-1c1b-4d35-b46b-27ff94e91c6f', 'a1000000-0000-4000-8000-000000000002', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Stacking $ETH slowly 👀', '2026-10-07 13:44:16.658101+00', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_comments (id, post_id, author_id, content, created_at, updated_at) VALUES ('092a72af-3d15-4670-841a-b6b3434e47f6', 'a1000000-0000-4000-8000-000000000002', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'Same here, DCA all the way.', '2026-10-07 14:04:16.658101+00', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_comments (id, post_id, author_id, content, created_at, updated_at) VALUES ('560eeb39-03de-4bca-81d7-16deb6f9dd70', 'a1000000-0000-4000-8000-000000000004', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'Keep building bro 💪', '2026-10-07 16:34:16.658101+00', '2026-10-08 06:06:14.480797+00');


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-09-30 07:30:17+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000002', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000003', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000004', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000005', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('eac20b69-fb36-468f-9486-94af89fe5886', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 19:17:22.865781+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 19:17:26.319108+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000005', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 19:18:30.047129+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000005', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 05:57:11.915146+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 05:57:13.647533+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000003', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000004', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 06:09:43.466148+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000002', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 06:09:46.907009+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('eac20b69-fb36-468f-9486-94af89fe5886', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 06:09:49.935263+00');
INSERT INTO public.post_likes (post_id, user_id, created_at) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-08 06:09:51.787691+00');


--
-- Data for Name: post_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '🔥', '2026-09-29 10:13:30+00');
INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '🚀', '2026-09-30 07:30:22+00');
INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '🔥', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('a1000000-0000-4000-8000-000000000003', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '👏', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('a1000000-0000-4000-8000-000000000004', '0e0bc613-b892-4bf8-845a-067718c8c950', '🔥', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.post_reactions (post_id, user_id, emoji, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '🚀', '2026-10-07 18:34:16.658101+00');


--
-- Data for Name: post_reports; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: post_reposts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.post_reposts (post_id, user_id, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('aca4a5cb-5667-425b-aede-2689289a406a', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Nice', '2026-09-29 09:49:53+00', '2026-09-29 09:49:53+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('eac20b69-fb36-468f-9486-94af89fe5886', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'Hello world :)', '2026-09-30 07:31:55+00', '2026-09-30 07:31:55+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('a1000000-0000-4000-8000-000000000001', '0e0bc613-b892-4bf8-845a-067718c8c950', 'Welcome to Mindcaster 🧠 Post your ideas, track $BTC and $ETH with cashtags, and get verified onchain. Where Ideas Become Onchain.', '2026-10-07 12:34:16.658101+00', '2026-10-07 18:34:16.658101+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('a1000000-0000-4000-8000-000000000003', '39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Proud to be part of @Mindcaster. Stories, reminds and FOMO alerts all in one place 🚀', '2026-10-07 14:34:16.658101+00', '2026-10-07 18:34:16.658101+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('a1000000-0000-4000-8000-000000000004', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'Building every day. $ETH ecosystem is getting more fun to explore. Lets build on 🔨', '2026-10-07 15:34:16.658101+00', '2026-10-07 18:34:16.658101+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('a1000000-0000-4000-8000-000000000005', '0e0bc613-b892-4bf8-845a-067718c8c950', 'Tip: use "Quick idea → AI draft" in the composer to turn a short thought into a full post ✨', '2026-10-07 17:34:16.658101+00', '2026-10-07 18:34:16.658101+00', NULL);
INSERT INTO public.posts (id, author_id, content, created_at, updated_at, image_url) VALUES ('a1000000-0000-4000-8000-000000000002', '42965ba4-474d-4866-82f6-7c2c93c16ed7', 'Watching $BTC hold strong this week. What is everyone accumulating? @Thorvox @ybs', '2026-10-07 13:34:16.658101+00', '2026-10-08 06:06:14.480797+00', NULL);


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at, wallet_address, wallet_verified_at, username, bio) VALUES ('0641661a-1ccf-4735-81d6-e8953548f3e6', 'Gabriel', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/avatars/0641661a-1ccf-4735-81d6-e8953548f3e6/1791396740232-cc2174bd.jpg', '2026-10-07 17:41:47.359895+00', '2026-10-07 18:12:24.706235+00', NULL, NULL, 'Gabriel', '📈');
INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at, wallet_address, wallet_verified_at, username, bio) VALUES ('0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'ybs', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/avatars/0d2fb09b-dafd-4bb6-aeb6-943b9857274f/1791396839440-bd04e0d6.jpg', '2026-09-30 07:29:58+00', '2026-10-07 18:14:02.990022+00', NULL, NULL, 'ybs', 'Lets build on');
INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at, wallet_address, wallet_verified_at, username, bio) VALUES ('39e47596-b70c-4a93-9501-4c1a4585d9c4', 'Thorvox', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/avatars/39e47596-b70c-4a93-9501-4c1a4585d9c4/1791396902058-8e14455f.jpg', '2026-09-29 09:49:20+00', '2026-10-07 18:15:36.747922+00', NULL, NULL, 'Thorvox', 'Brand ambasador of @mindcaster');
INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at, wallet_address, wallet_verified_at, username, bio) VALUES ('0e0bc613-b892-4bf8-845a-067718c8c950', 'Mindcaster', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/avatars/0e0bc613-b892-4bf8-845a-067718c8c950/1791397124110-112040ca.png', '2026-09-30 15:05:32+00', '2026-10-07 18:34:16.658101+00', NULL, NULL, 'Mindcaster', 'Where Ideas Become Onchain • The social chain for minds, alerts, and onchain signals.');
INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at, wallet_address, wallet_verified_at, username, bio) VALUES ('42965ba4-474d-4866-82f6-7c2c93c16ed7', 'Jundan🦜', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/avatars/42965ba4-474d-4866-82f6-7c2c93c16ed7/1791426877799-d91c0f9b.png', '2026-10-08 02:32:56.134839+00', '2026-10-08 06:09:06.164831+00', NULL, NULL, 'Jundan', 'Exploring Web3, onchain ideas, and crypto alpha.');


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.stories (id, author_id, media_url, media_type, created_at, expires_at, music_url, music_title) VALUES ('763cfc70-2327-4873-9d3e-ecd11f55c69c', '0e0bc613-b892-4bf8-845a-067718c8c950', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/stories/0e0bc613-b892-4bf8-845a-067718c8c950/1791400494866-05a585b4.png', 'image', '2026-10-07 19:14:57.705184+00', '2026-10-08 19:14:57.705184+00', 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e7/c8/d4/e7c8d47a-3882-a61d-412d-662c234f3de7/mzaf_12204102076480052244.plus.aac.p.m4a', 'The Monster (feat. Rihanna) · Eminem');
INSERT INTO public.stories (id, author_id, media_url, media_type, created_at, expires_at, music_url, music_title) VALUES ('747f1e6a-19a1-4043-8143-abbf5324298a', '0e0bc613-b892-4bf8-845a-067718c8c950', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/stories/0e0bc613-b892-4bf8-845a-067718c8c950/1791425849794-d9e9dafa.png', 'image', '2026-10-08 02:17:33.884896+00', '2026-10-09 02:17:33.884896+00', 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a6/82/aa/a682aa65-ba0a-9546-f0f3-7437bb63e577/mzaf_11108392513631711416.plus.aac.p.m4a', 'DJ KICAU MANIA · akuo');
INSERT INTO public.stories (id, author_id, media_url, media_type, created_at, expires_at, music_url, music_title) VALUES ('c176bbee-515a-449f-91cc-322a01874287', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', 'https://pub-d034b933849d489189b5d66b74ffd589.r2.dev/stories/0d2fb09b-dafd-4bb6-aeb6-943b9857274f/1791515969859-84847202.png', 'image', '2026-10-09 03:19:32.675464+00', '2026-10-10 03:19:32.675464+00', 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0a/a1/ed/0aa1ed3e-b8be-2d68-f7af-3b406af8bdf3/mzaf_10569100302993733747.plus.aac.p.m4a', 'One Call Away · Charlie Puth');


--
-- Data for Name: story_views; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: support_reports; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('39e47596-b70c-4a93-9501-4c1a4585d9c4', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('39e47596-b70c-4a93-9501-4c1a4585d9c4', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0e0bc613-b892-4bf8-845a-067718c8c950', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0e0bc613-b892-4bf8-845a-067718c8c950', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('42965ba4-474d-4866-82f6-7c2c93c16ed7', '0e0bc613-b892-4bf8-845a-067718c8c950', '2026-10-08 05:57:09.341338+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('42965ba4-474d-4866-82f6-7c2c93c16ed7', '39e47596-b70c-4a93-9501-4c1a4585d9c4', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('42965ba4-474d-4866-82f6-7c2c93c16ed7', '0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('39e47596-b70c-4a93-9501-4c1a4585d9c4', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0d2fb09b-dafd-4bb6-aeb6-943b9857274f', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-07 18:34:16.658101+00');
INSERT INTO public.user_follows (follower_id, followed_id, created_at) VALUES ('0e0bc613-b892-4bf8-845a-067718c8c950', '42965ba4-474d-4866-82f6-7c2c93c16ed7', '2026-10-07 18:34:16.658101+00');


--
-- Data for Name: verification_payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: verified_badges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_bookmarks post_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT post_bookmarks_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: post_reactions post_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_pkey PRIMARY KEY (post_id, user_id, emoji);


--
-- Name: post_reports post_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT post_reports_pkey PRIMARY KEY (id);


--
-- Name: post_reports post_reports_post_id_reporter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT post_reports_post_id_reporter_id_key UNIQUE (post_id, reporter_id);


--
-- Name: post_reposts post_reposts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reposts
    ADD CONSTRAINT post_reposts_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_views story_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_pkey PRIMARY KEY (story_id, viewer_id);


--
-- Name: support_reports support_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_reports
    ADD CONSTRAINT support_reports_pkey PRIMARY KEY (id);


--
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, followed_id);


--
-- Name: verification_payments verification_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_payments
    ADD CONSTRAINT verification_payments_pkey PRIMARY KEY (id);


--
-- Name: verification_payments verification_payments_tx_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_payments
    ADD CONSTRAINT verification_payments_tx_hash_key UNIQUE (tx_hash);


--
-- Name: verified_badges verified_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verified_badges
    ADD CONSTRAINT verified_badges_pkey PRIMARY KEY (user_id);


--
-- Name: post_comments_post_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_comments_post_idx ON public.post_comments USING btree (post_id, created_at);


--
-- Name: posts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at DESC);


--
-- Name: profiles_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (lower(username));


--
-- Name: stories_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stories_expires_idx ON public.stories USING btree (expires_at);


--
-- Name: user_follows_followed_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_follows_followed_id_idx ON public.user_follows USING btree (followed_id);


--
-- Name: verification_payments_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_payments_user_idx ON public.verification_payments USING btree (user_id, expires_at);


--
-- Name: post_comments notify_comment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_activity();


--
-- Name: post_comments notify_comment_mentions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_comment_mentions AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();


--
-- Name: direct_messages notify_dm; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_dm AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.notify_activity();


--
-- Name: post_likes notify_like; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_activity();


--
-- Name: posts notify_post_mentions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_post_mentions AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();


--
-- Name: post_reactions notify_reaction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_reaction AFTER INSERT ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.notify_activity();


--
-- Name: post_reposts notify_repost; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_repost AFTER INSERT ON public.post_reposts FOR EACH ROW EXECUTE FUNCTION public.notify_activity();


--
-- Name: profiles profiles_reserved_username; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_reserved_username BEFORE INSERT OR UPDATE OF username ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_reserved_username();


--
-- Name: profiles protect_profile_wallet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER protect_profile_wallet BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_wallet_fields();


--
-- Name: post_comments set_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: posts set_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: support_reports set_support_report_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_support_report_updated_at BEFORE UPDATE ON public.support_reports FOR EACH ROW EXECUTE FUNCTION public.set_support_report_updated_at();


--
-- Name: direct_messages direct_messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: direct_messages direct_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_bookmarks post_bookmarks_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT post_bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_bookmarks post_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_bookmarks
    ADD CONSTRAINT post_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_reactions post_reactions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_reactions post_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_reports post_reports_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_reports post_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reports
    ADD CONSTRAINT post_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_reposts post_reposts_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reposts
    ADD CONSTRAINT post_reposts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_reposts post_reposts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reposts
    ADD CONSTRAINT post_reposts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;


--
-- Name: stories stories_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: story_views story_views_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_views story_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: support_reports support_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_reports
    ADD CONSTRAINT support_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_followed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_followed_id_fkey FOREIGN KEY (followed_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: verification_payments verification_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_payments
    ADD CONSTRAINT verification_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: verified_badges verified_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verified_badges
    ADD CONSTRAINT verified_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications Delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: direct_messages Delete own sent DMs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete own sent DMs" ON public.direct_messages FOR DELETE TO authenticated USING ((auth.uid() = sender_id));


--
-- Name: stories Delete own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete own stories" ON public.stories FOR DELETE TO authenticated USING ((auth.uid() = author_id));


--
-- Name: notifications Mark own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mark own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: verification_payments Owners view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners view own payments" ON public.verification_payments FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: direct_messages Participants read DMs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants read DMs" ON public.direct_messages FOR SELECT TO authenticated USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: stories Post own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Post own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (((auth.uid() = author_id) AND (expires_at <= (now() + '24:01:00'::interval))));


--
-- Name: post_reactions React as self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "React as self" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Read own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: story_views Record own view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Record own view" ON public.story_views FOR INSERT TO authenticated WITH CHECK ((auth.uid() = viewer_id));


--
-- Name: post_reactions Remove own reaction; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Remove own reaction" ON public.post_reactions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: post_reposts Repost as self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Repost as self" ON public.post_reposts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: direct_messages Send DMs as self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Send DMs as self" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND (sender_id <> recipient_id)));


--
-- Name: profiles Signed-in users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: verified_badges Signed-in users view badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users view badges" ON public.verified_badges FOR SELECT TO authenticated USING (true);


--
-- Name: post_comments Signed-in users view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users view comments" ON public.post_comments FOR SELECT TO authenticated USING (true);


--
-- Name: user_follows Signed-in users view follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users view follows" ON public.user_follows FOR SELECT TO authenticated USING (true);


--
-- Name: post_likes Signed-in users view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);


--
-- Name: posts Signed-in users view posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Signed-in users view posts" ON public.posts FOR SELECT TO authenticated USING (true);


--
-- Name: post_reposts Undo own repost; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Undo own repost" ON public.post_reposts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: story_views Update own view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Update own view" ON public.story_views FOR UPDATE TO authenticated USING ((auth.uid() = viewer_id)) WITH CHECK ((auth.uid() = viewer_id));


--
-- Name: post_bookmarks Users bookmark as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users bookmark as themselves" ON public.post_bookmarks FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: support_reports Users can submit their own support reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can submit their own support reports" ON public.support_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: support_reports Users can view their own support reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own support reports" ON public.support_reports FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: post_comments Users create own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users create own comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));


--
-- Name: posts Users create own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));


--
-- Name: post_comments Users delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE TO authenticated USING ((auth.uid() = author_id));


--
-- Name: posts Users delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE TO authenticated USING ((auth.uid() = author_id));


--
-- Name: user_follows Users follow as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users follow as themselves" ON public.user_follows FOR INSERT TO authenticated WITH CHECK (((auth.uid() = follower_id) AND (follower_id <> followed_id)));


--
-- Name: post_likes Users like as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users like as themselves" ON public.post_likes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_bookmarks Users remove own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users remove own bookmarks" ON public.post_bookmarks FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: post_likes Users remove own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users remove own likes" ON public.post_likes FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: post_reports Users report as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users report as themselves" ON public.post_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: user_follows Users unfollow as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users unfollow as themselves" ON public.user_follows FOR DELETE TO authenticated USING ((auth.uid() = follower_id));


--
-- Name: post_comments Users update own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own comments" ON public.post_comments FOR UPDATE TO authenticated USING ((auth.uid() = author_id)) WITH CHECK ((auth.uid() = author_id));


--
-- Name: posts Users update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE TO authenticated USING ((auth.uid() = author_id)) WITH CHECK ((auth.uid() = author_id));


--
-- Name: post_bookmarks Users view own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own bookmarks" ON public.post_bookmarks FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: post_reports Users view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own reports" ON public.post_reports FOR SELECT TO authenticated USING ((auth.uid() = reporter_id));


--
-- Name: stories View active stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View active stories" ON public.stories FOR SELECT TO authenticated USING (((expires_at > now()) OR (auth.uid() = author_id)));


--
-- Name: post_reactions View reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);


--
-- Name: post_reposts View reposts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View reposts" ON public.post_reposts FOR SELECT TO authenticated USING (true);


--
-- Name: story_views Viewer or story owner reads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Viewer or story owner reads" ON public.story_views FOR SELECT TO authenticated USING (((auth.uid() = viewer_id) OR (EXISTS ( SELECT 1
   FROM public.stories s
  WHERE ((s.id = story_views.story_id) AND (s.author_id = auth.uid()))))));


--
-- Name: direct_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: post_bookmarks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: post_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: post_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: post_reposts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

--
-- Name: story_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

--
-- Name: support_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: verified_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verified_badges ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



-- Hak akses API
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
