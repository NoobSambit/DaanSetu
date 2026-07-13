-- Migration 021: employee attribution, immutable CSR matching, and settlement batches.

ALTER TABLE public.corporate_employees
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES public.users(id);
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS csr_initiative_id UUID REFERENCES public.csr_initiatives(id),
  ADD COLUMN IF NOT EXISTS corporate_employee_id UUID REFERENCES public.corporate_employees(id);

CREATE OR REPLACE FUNCTION public.create_csr_match_pledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  initiative public.csr_initiatives;
  employee_total BIGINT;
  initiative_total BIGINT;
  matched BIGINT;
BEGIN
  IF NEW.status <> 'captured' OR NEW.is_demo OR NEW.csr_initiative_id IS NULL OR NEW.corporate_employee_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT * INTO initiative FROM public.csr_initiatives WHERE id = NEW.csr_initiative_id;
  IF initiative.status <> 'active' OR NEW.captured_at NOT BETWEEN initiative.starts_at AND initiative.ends_at THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(matched_paise), 0) INTO employee_total
  FROM public.csr_match_pledges WHERE initiative_id = initiative.id AND employee_id = NEW.corporate_employee_id AND status <> 'cancelled';
  SELECT COALESCE(SUM(matched_paise), 0) INTO initiative_total
  FROM public.csr_match_pledges WHERE initiative_id = initiative.id AND status <> 'cancelled';

  matched := FLOOR(NEW.amount_paise * initiative.match_percent / 100.0);
  IF initiative.per_employee_cap_paise IS NOT NULL THEN matched := LEAST(matched, GREATEST(0, initiative.per_employee_cap_paise - employee_total)); END IF;
  IF initiative.initiative_cap_paise IS NOT NULL THEN matched := LEAST(matched, GREATEST(0, initiative.initiative_cap_paise - initiative_total)); END IF;
  IF matched > 0 THEN
    INSERT INTO public.csr_match_pledges (initiative_id, donation_id, employee_id, matched_paise)
    VALUES (initiative.id, NEW.id, NEW.corporate_employee_id, matched);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_csr_match_after_capture ON public.donations;
CREATE TRIGGER create_csr_match_after_capture
AFTER INSERT OR UPDATE OF status ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.create_csr_match_pledge();

CREATE OR REPLACE FUNCTION public.create_csr_settlement_batch(
  settlement_uuid UUID,
  corporate_uuid UUID,
  pledge_uuids UUID[],
  total_amount_paise BIGINT,
  provider_order_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE calculated BIGINT;
BEGIN
  PERFORM p.id
  FROM public.csr_match_pledges p
  JOIN public.csr_initiatives i ON i.id = p.initiative_id
  WHERE p.id = ANY(pledge_uuids)
    AND p.status = 'outstanding'
    AND i.corporate_id = corporate_uuid
  FOR UPDATE OF p;

  SELECT COALESCE(SUM(matched_paise), 0) INTO calculated
  FROM public.csr_match_pledges p
  JOIN public.csr_initiatives i ON i.id = p.initiative_id
  WHERE p.id = ANY(pledge_uuids) AND p.status = 'outstanding' AND i.corporate_id = corporate_uuid;
  IF calculated <> total_amount_paise THEN RAISE EXCEPTION 'CSR pledge total mismatch'; END IF;

  INSERT INTO public.csr_settlements (id, corporate_id, amount_paise, gateway_order_id)
  VALUES (settlement_uuid, corporate_uuid, calculated, provider_order_id);
  INSERT INTO public.csr_settlement_pledges (settlement_id, pledge_id)
  SELECT settlement_uuid, id FROM public.csr_match_pledges WHERE id = ANY(pledge_uuids);
  UPDATE public.csr_match_pledges SET status = 'batched', updated_at = NOW() WHERE id = ANY(pledge_uuids);
END;
$$;

REVOKE ALL ON FUNCTION public.create_csr_settlement_batch(UUID, UUID, UUID[], BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_csr_settlement_batch(UUID, UUID, UUID[], BIGINT, TEXT) TO service_role;
