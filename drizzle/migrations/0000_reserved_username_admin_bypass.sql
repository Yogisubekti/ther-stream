CREATE OR REPLACE FUNCTION public.check_reserved_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE u text := lower(NEW.username);
BEGIN
  IF current_user IN ('service_role','postgres','supabase_admin') THEN RETURN NEW; END IF;
  IF NEW.username IS NULL OR (TG_OP = 'UPDATE' AND lower(coalesce(OLD.username,'')) = u) THEN RETURN NEW; END IF;
  IF length(u) <= 3 AND u <> 'ybs' THEN RAISE EXCEPTION 'Username is reserved' USING ERRCODE = 'P0001'; END IF;
  IF u = ANY (ARRAY['binance','bitget','okx','wallet','cz','brian','jesse','cto','coinbase','bybit','kraken','kucoin','gateio','mexc','htx','huobi','bitfinex','bitstamp','gemini','uniswap','pancakeswap','metamask','phantom','trustwallet','ledger','opensea','tether','circle','usdc','usdt','solana','ethereum','bitcoin','polygon','arbitrum','optimism','base','chainlink','satoshi','nakamoto','vitalik','vitalikbuterin','saylor','elonmusk','elon','tesla','apple','google','microsoft','meta','facebook','twitter','telegram','privy','robinhood','paypal','visa','mastercard','admin','administrator','support','official','help','moderator','system','root','mindcaster','fomo']) THEN
    RAISE EXCEPTION 'Username is reserved' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $function$;