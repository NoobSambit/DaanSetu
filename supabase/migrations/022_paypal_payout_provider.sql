-- Migration 022: complete the payment-provider switch for payout accounts.

ALTER TABLE public.payout_accounts
  ALTER COLUMN provider SET DEFAULT 'paypal';

UPDATE public.payout_accounts
SET provider = 'paypal',
    updated_at = NOW()
WHERE provider = 'razorpay_route'
  AND gateway_account_id IS NULL
  AND status = 'draft';
