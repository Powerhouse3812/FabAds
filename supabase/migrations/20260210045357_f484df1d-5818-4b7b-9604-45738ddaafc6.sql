
-- Add unique constraints needed for upsert operations in fb-sync
ALTER TABLE public.fb_business_managers
  ADD CONSTRAINT fb_bm_connection_business_unique UNIQUE (fb_connection_id, fb_business_id);

ALTER TABLE public.fb_ad_accounts
  ADD CONSTRAINT fb_ad_connection_account_unique UNIQUE (fb_connection_id, fb_account_id);
