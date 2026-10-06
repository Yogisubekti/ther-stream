REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at, username, bio) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.get_my_wallet()
RETURNS TABLE(wallet_address text, wallet_verified_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT wallet_address, wallet_verified_at FROM public.profiles WHERE id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.get_my_wallet() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_wallet() TO authenticated;