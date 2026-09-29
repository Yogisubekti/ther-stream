CREATE OR REPLACE FUNCTION public.protect_wallet_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('service_role','postgres','supabase_admin')
     AND (NEW.wallet_address IS DISTINCT FROM OLD.wallet_address OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at) THEN
    RAISE EXCEPTION 'Wallet can only be changed via verification';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_profile_wallet BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_wallet_fields();