-- Verifies the comprehensive DaanSetu development/demo seed against the linked
-- Supabase project. This script is read-only and raises an exception whenever a
-- required role, table, lifecycle state, or storage surface is missing.
DO $$
DECLARE
  table_name TEXT;
  row_total BIGINT;
  required_tables CONSTANT TEXT[] := ARRAY[
    'action_rate_limits',
    'activity_logs',
    'ai_flags',
    'analytics_logs',
    'audit_logs',
    'campaign_milestones',
    'campaign_updates',
    'campaigns',
    'content_reports',
    'corporate_campaigns',
    'corporate_employees',
    'corporate_invitations',
    'corporate_profiles',
    'csr_initiatives',
    'csr_match_pledges',
    'csr_settlement_pledges',
    'csr_settlements',
    'donations',
    'donor_tax_profiles',
    'email_queue',
    'follows',
    'moderation_actions',
    'ngo_gallery_images',
    'ngo_programs',
    'ngo_reviews',
    'ngo_service_areas',
    'ngo_updates',
    'ngo_verification_documents',
    'ngo_verifications',
    'ngos',
    'notifications',
    'partnership_requests',
    'payment_events',
    'payment_orders',
    'payment_transfers',
    'payout_accounts',
    'post_bookmarks',
    'post_comments',
    'post_likes',
    'post_views',
    'posts',
    'refund_requests',
    'skill_verifications',
    'subscription_invoices',
    'subscriptions',
    'tax_certificates',
    'user_badges',
    'user_profiles',
    'users',
    'volunteer_applications',
    'volunteer_certificates',
    'volunteer_hours',
    'volunteer_opportunities',
    'volunteer_profiles'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    EXECUTE FORMAT('SELECT COUNT(*) FROM public.%I', table_name)
    INTO row_total;

    IF row_total = 0 THEN
      RAISE EXCEPTION 'Required seeded table public.% is empty', table_name;
    END IF;
  END LOOP;

  SELECT COUNT(*)
  INTO row_total
  FROM auth.users
  WHERE email LIKE '%@demo.daansetu.local';

  IF row_total < 220 THEN
    RAISE EXCEPTION 'Expected at least 220 demo auth users, found %', row_total;
  END IF;

  IF NOT ARRAY['supporter', 'ngo', 'corporate', 'admin']::TEXT[] <@ ARRAY(
    SELECT DISTINCT role
    FROM public.users
    WHERE email LIKE '%@demo.daansetu.local'
  ) THEN
    RAISE EXCEPTION 'Not every application role is represented';
  END IF;

  IF NOT ARRAY[
    'draft', 'submitted', 'changes_requested', 'verified', 'rejected', 'expired'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT verification_status
    FROM public.ngo_verifications
  ) THEN
    RAISE EXCEPTION 'NGO verification lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'draft', 'pending_review', 'changes_requested', 'rejected', 'approved',
    'active', 'paused', 'completed', 'cancelled'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.campaigns
  ) THEN
    RAISE EXCEPTION 'Campaign lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'pending', 'authorized', 'captured', 'failed', 'partially_refunded',
    'refunded', 'reversed'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.donations
  ) THEN
    RAISE EXCEPTION 'Donation lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'created', 'authenticated', 'active', 'paused', 'cancelled', 'pending',
    'halted', 'completed', 'expired'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.subscriptions
  ) THEN
    RAISE EXCEPTION 'Subscription lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'draft', 'pending', 'active', 'restricted', 'rejected', 'disabled'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.payout_accounts
  ) THEN
    RAISE EXCEPTION 'Payout account lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'pending', 'claimed', 'created', 'processing', 'settled', 'failed', 'held',
    'unclaimed', 'reversed'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.payment_transfers
  ) THEN
    RAISE EXCEPTION 'Payout transfer lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'submitted', 'approved', 'rejected', 'processing', 'processed', 'failed',
    'reversed'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.refund_requests
  ) THEN
    RAISE EXCEPTION 'Refund lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.volunteer_applications
  ) THEN
    RAISE EXCEPTION 'Volunteer application lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY['pending', 'approved', 'rejected']::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.volunteer_hours
  ) THEN
    RAISE EXCEPTION 'Volunteer hour lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY['supporter', 'ngo', 'corporate', 'admin']::TEXT[] <@ ARRAY(
    SELECT DISTINCT author_role
    FROM public.posts
  ) THEN
    RAISE EXCEPTION 'Community posts do not cover every author role';
  END IF;

  IF NOT ARRAY['published', 'draft', 'hidden']::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.posts
  ) THEN
    RAISE EXCEPTION 'Community publication/moderation states are incomplete';
  END IF;

  IF NOT ARRAY['pending', 'reviewing', 'resolved', 'dismissed']::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.content_reports
  ) THEN
    RAISE EXCEPTION 'Content report lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'outstanding', 'batched', 'settled', 'cancelled', 'reversed'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.csr_match_pledges
  ) THEN
    RAISE EXCEPTION 'CSR match pledge lifecycle coverage is incomplete';
  END IF;

  IF NOT ARRAY[
    'created', 'captured', 'failed', 'refunded', 'reversed'
  ]::TEXT[] <@ ARRAY(
    SELECT DISTINCT status
    FROM public.csr_settlements
  ) THEN
    RAISE EXCEPTION 'CSR settlement lifecycle coverage is incomplete';
  END IF;

  SELECT COUNT(*)
  INTO row_total
  FROM storage.objects
  WHERE
    bucket_id IN (
      'ngos', 'community-media', 'ngo-verification', 'campaign-evidence',
      'tax-certificates'
    )
    AND name LIKE 'demo/%';

  IF row_total < 220 THEN
    RAISE EXCEPTION 'Expected at least 220 reusable demo storage objects, found %', row_total;
  END IF;
END;
$$;

SELECT
  JSONB_PRETTY(
    JSONB_BUILD_OBJECT(
      'auth_demo_users',
      (
        SELECT
          COUNT(*)
        FROM
          auth.users
        WHERE
          email LIKE '%@demo.daansetu.local'
      ),
      'public_users',
      (
        SELECT
          COUNT(*)
        FROM
          public.users
      ),
      'ngos',
      (
        SELECT
          COUNT(*)
        FROM
          public.ngos
      ),
      'campaigns',
      (
        SELECT
          COUNT(*)
        FROM
          public.campaigns
      ),
      'donations',
      (
        SELECT
          COUNT(*)
        FROM
          public.donations
      ),
      'subscriptions',
      (
        SELECT
          COUNT(*)
        FROM
          public.subscriptions
      ),
      'volunteer_profiles',
      (
        SELECT
          COUNT(*)
        FROM
          public.volunteer_profiles
      ),
      'volunteer_opportunities',
      (
        SELECT
          COUNT(*)
        FROM
          public.volunteer_opportunities
      ),
      'volunteer_applications',
      (
        SELECT
          COUNT(*)
        FROM
          public.volunteer_applications
      ),
      'posts',
      (
        SELECT
          COUNT(*)
        FROM
          public.posts
      ),
      'post_likes',
      (
        SELECT
          COUNT(*)
        FROM
          public.post_likes
      ),
      'post_comments',
      (
        SELECT
          COUNT(*)
        FROM
          public.post_comments
      ),
      'notifications',
      (
        SELECT
          COUNT(*)
        FROM
          public.notifications
      ),
      'storage_demo_objects',
      (
        SELECT
          COUNT(*)
        FROM
          storage.objects
        WHERE
          name LIKE 'demo/%'
      ),
      'database_size',
      PG_SIZE_PRETTY(PG_DATABASE_SIZE(CURRENT_DATABASE()))
    )
  ) AS demo_seed_summary;
