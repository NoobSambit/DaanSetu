-- Migration 030: remove the last legacy provider default from the final schema.

ALTER TABLE public.donations
  ALTER COLUMN payment_method SET DEFAULT 'paypal';

UPDATE public.donations
SET payment_method = 'paypal'
WHERE payment_method IS NULL;
