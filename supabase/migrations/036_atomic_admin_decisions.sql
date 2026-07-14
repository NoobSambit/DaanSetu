-- Migration 036: atomic campaign, moderation, and impact-story decisions.

CREATE OR REPLACE FUNCTION public.transition_campaign(
  campaign_uuid UUID,
  next_status TEXT,
  decision_note TEXT DEFAULT NULL
)
RETURNS public.campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_campaign public.campaigns;
  caller_role TEXT;
  payout_status TEXT;
BEGIN
  SELECT * INTO current_campaign
  FROM public.campaigns
  WHERE id = campaign_uuid
  FOR UPDATE;

  IF current_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  SELECT role INTO caller_role
  FROM public.users
  WHERE id = auth.uid();

  IF auth.uid() <> current_campaign.creator_id AND caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF caller_role <> 'admin' AND NOT (
    (
      current_campaign.status = 'draft'
      AND next_status IN ('pending_review', 'cancelled')
    )
    OR (
      current_campaign.status = 'changes_requested'
      AND next_status IN ('pending_review', 'cancelled')
    )
    OR (
      current_campaign.status = 'active'
      AND next_status IN ('paused', 'completed', 'cancelled')
    )
    OR (
      current_campaign.status = 'paused'
      AND next_status IN ('active', 'completed', 'cancelled')
    )
  ) THEN
    RAISE EXCEPTION 'Invalid campaign transition';
  END IF;

  IF caller_role = 'admin' AND NOT (
    (
      current_campaign.status = 'pending_review'
      AND next_status IN ('changes_requested', 'rejected', 'approved')
    )
    OR (
      current_campaign.status = 'approved'
      AND next_status IN ('active', 'cancelled')
    )
    OR (
      current_campaign.status IN ('active', 'paused')
      AND next_status IN ('paused', 'active', 'completed', 'cancelled')
    )
  ) THEN
    RAISE EXCEPTION 'Invalid administrative transition';
  END IF;

  IF caller_role = 'admin'
    AND next_status IN ('changes_requested', 'rejected')
    AND NULLIF(btrim(decision_note), '') IS NULL
  THEN
    RAISE EXCEPTION 'A decision note is required';
  END IF;

  IF next_status = 'active' THEN
    SELECT status INTO payout_status
    FROM public.payout_accounts
    WHERE id = current_campaign.payout_account_id;

    IF payout_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'An active payout account is required';
    END IF;
  END IF;

  UPDATE public.campaigns
  SET status = next_status,
      moderation_notes = NULLIF(btrim(decision_note), ''),
      approved_at = CASE
        WHEN next_status = 'approved' THEN NOW()
        ELSE approved_at
      END,
      published_at = CASE
        WHEN next_status = 'active' THEN NOW()
        ELSE published_at
      END,
      updated_at = NOW()
  WHERE id = campaign_uuid
  RETURNING * INTO current_campaign;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'campaign.transition',
    'campaign',
    campaign_uuid,
    jsonb_build_object(
      'status',
      next_status,
      'note',
      NULLIF(btrim(decision_note), '')
    )
  );

  IF caller_role = 'admin' AND current_campaign.creator_id <> auth.uid() THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      current_campaign.creator_id,
      'campaign_decision',
      'Fundraiser review updated',
      'Your fundraiser "' || current_campaign.title || '" is now ' ||
        replace(next_status, '_', ' ') || '.',
      '/campaigns/' || current_campaign.id::TEXT || '/manage'
    );
  END IF;

  RETURN current_campaign;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_campaign(UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_campaign(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.moderate_reported_content(
  report_uuid UUID,
  moderation_action TEXT,
  decision_reason TEXT
)
RETURNS public.moderation_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  report_record public.content_reports;
  result public.moderation_actions;
  entity_owner UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO report_record
  FROM public.content_reports
  WHERE id = report_uuid
  FOR UPDATE;

  IF report_record.id IS NULL
    OR report_record.status NOT IN ('pending', 'reviewing')
  THEN
    RAISE EXCEPTION 'Moderation report is not actionable';
  END IF;

  IF report_record.entity_type NOT IN ('post', 'ngo_review')
    OR moderation_action NOT IN ('hide', 'restore', 'dismiss')
    OR NULLIF(btrim(decision_reason), '') IS NULL
  THEN
    RAISE EXCEPTION 'Invalid moderation decision';
  END IF;

  IF report_record.entity_type = 'post' THEN
    SELECT author_id INTO entity_owner
    FROM public.posts
    WHERE id = report_record.entity_id;

    IF entity_owner IS NULL THEN
      RAISE EXCEPTION 'Reported post not found';
    END IF;

    IF moderation_action <> 'dismiss' THEN
      UPDATE public.posts
      SET hidden_at = CASE
            WHEN moderation_action = 'hide' THEN NOW()
            ELSE NULL
          END,
          hidden_reason = CASE
            WHEN moderation_action = 'hide' THEN btrim(decision_reason)
            ELSE NULL
          END
      WHERE id = report_record.entity_id;
    END IF;
  ELSE
    SELECT user_id INTO entity_owner
    FROM public.ngo_reviews
    WHERE id = report_record.entity_id;

    IF entity_owner IS NULL THEN
      RAISE EXCEPTION 'Reported review not found';
    END IF;

    IF moderation_action <> 'dismiss' THEN
      UPDATE public.ngo_reviews
      SET hidden_at = CASE
            WHEN moderation_action = 'hide' THEN NOW()
            ELSE NULL
          END,
          hidden_reason = CASE
            WHEN moderation_action = 'hide' THEN btrim(decision_reason)
            ELSE NULL
          END,
          moderated_by = auth.uid()
      WHERE id = report_record.entity_id;
    END IF;
  END IF;

  INSERT INTO public.moderation_actions (
    report_id,
    moderator_id,
    entity_type,
    entity_id,
    action,
    reason
  ) VALUES (
    report_record.id,
    auth.uid(),
    report_record.entity_type,
    report_record.entity_id,
    moderation_action,
    btrim(decision_reason)
  )
  RETURNING * INTO result;

  UPDATE public.content_reports
  SET status = CASE
        WHEN moderation_action = 'dismiss' THEN 'dismissed'
        ELSE 'resolved'
      END,
      reviewed_by = auth.uid(),
      resolution_notes = btrim(decision_reason),
      resolved_at = NOW()
  WHERE id = report_record.id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'moderation.' || moderation_action,
    report_record.entity_type,
    report_record.entity_id,
    jsonb_build_object(
      'reportId',
      report_record.id,
      'reason',
      btrim(decision_reason)
    )
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    report_record.reported_by,
    'moderation_decision',
    'Content report reviewed',
    'Your report was ' || CASE
      WHEN moderation_action = 'dismiss' THEN 'dismissed.'
      ELSE 'resolved.'
    END,
    '/community'
  );

  IF moderation_action <> 'dismiss'
    AND entity_owner IS DISTINCT FROM report_record.reported_by
  THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      entity_owner,
      'moderation_decision',
      'Published content reviewed',
      'A moderator chose to ' || moderation_action || ' your ' ||
        replace(report_record.entity_type, '_', ' ') || '.',
      CASE
        WHEN report_record.entity_type = 'post'
          THEN '/community/' || report_record.entity_id::TEXT
        ELSE '/profile/' || entity_owner::TEXT
      END
    );
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_reported_content(UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_reported_content(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_impact_story(
  post_uuid UUID,
  should_feature BOOLEAN,
  decision_reason TEXT
)
RETURNS public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_record public.posts;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO post_record
  FROM public.posts
  WHERE id = post_uuid
  FOR UPDATE;

  IF post_record.id IS NULL
    OR post_record.category <> 'story'
    OR post_record.status <> 'published'
    OR post_record.hidden_at IS NOT NULL
    OR NULLIF(btrim(decision_reason), '') IS NULL
  THEN
    RAISE EXCEPTION 'Impact story is not reviewable';
  END IF;

  UPDATE public.posts
  SET is_impact_story = TRUE,
      approved_at = COALESCE(approved_at, NOW()),
      is_featured = should_feature,
      featured_at = CASE
        WHEN should_feature THEN COALESCE(featured_at, NOW())
        ELSE NULL
      END
  WHERE id = post_record.id
  RETURNING * INTO post_record;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'impact_story.reviewed',
    'post',
    post_record.id,
    jsonb_build_object(
      'approved',
      TRUE,
      'featured',
      should_feature,
      'reason',
      btrim(decision_reason)
    )
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    post_record.author_id,
    'moderation_decision',
    'Impact story approved',
    CASE
      WHEN should_feature
        THEN 'Your impact story was approved and featured.'
      ELSE 'Your impact story was approved for the public impact feed.'
    END,
    '/community/' || post_record.id::TEXT
  );

  RETURN post_record;
END;
$$;

REVOKE ALL ON FUNCTION public.review_impact_story(UUID, BOOLEAN, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_impact_story(UUID, BOOLEAN, TEXT)
  TO authenticated;
