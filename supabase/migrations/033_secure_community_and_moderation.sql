-- Migration 033: verified community publishing, safe interactions, and moderation.

CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
      AND auth.users.email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_verified() TO authenticated;

DROP POLICY IF EXISTS "Verified users can create posts" ON public.posts;
CREATE POLICY "Verified users publish posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status = 'published'
    AND hidden_at IS NULL
    AND approved_at IS NULL
    AND featured_at IS NULL
    AND is_featured = FALSE
    AND public.is_email_verified()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = posts.author_role
    )
  );

CREATE OR REPLACE FUNCTION public.protect_post_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', TRUE) IS DISTINCT FROM 'service_role'
    AND NOT public.is_admin() AND (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
    OR NEW.is_impact_story IS DISTINCT FROM OLD.is_impact_story
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.featured_at IS DISTINCT FROM OLD.featured_at
    OR NEW.hidden_at IS DISTINCT FROM OLD.hidden_at
    OR NEW.hidden_reason IS DISTINCT FROM OLD.hidden_reason
  ) THEN
    RAISE EXCEPTION 'Post publication and moderation fields are admin-managed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_post_moderation_fields ON public.posts;
CREATE TRIGGER protect_post_moderation_fields
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.protect_post_moderation_fields();

DROP POLICY IF EXISTS "Authenticated users can like posts"
  ON public.post_likes;
CREATE POLICY "Visible post interactions"
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_email_verified()
    AND EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_likes.post_id
        AND posts.status = 'published'
        AND posts.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Public reads visible post likes"
  ON public.post_likes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_likes.post_id
        AND posts.status = 'published'
        AND posts.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Authenticated users can comment on posts"
  ON public.post_comments;
CREATE POLICY "Verified users comment on visible posts"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_email_verified()
    AND length(btrim(content)) BETWEEN 1 AND 2000
    AND EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_comments.post_id
        AND posts.status = 'published'
        AND posts.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Anyone can view post comments" ON public.post_comments;
CREATE POLICY "Public reads visible post comments"
  ON public.post_comments FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_comments.post_id
        AND posts.status = 'published'
        AND posts.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can bookmark posts" ON public.post_bookmarks;
CREATE POLICY "Verified users bookmark visible posts"
  ON public.post_bookmarks FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_email_verified()
    AND EXISTS (
      SELECT 1
      FROM public.posts
      WHERE posts.id = post_bookmarks.post_id
        AND posts.status = 'published'
        AND posts.hidden_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Verified users follow existing entities"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND public.is_email_verified()
    AND (
      (
        following_type = 'user'
        AND following_id <> auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.users WHERE users.id = following_id
        )
      )
      OR (
        following_type = 'ngo'
        AND EXISTS (
          SELECT 1
          FROM public.ngos
          WHERE ngos.id = following_id
            AND ngos.profile_status = 'published'
        )
      )
      OR (
        following_type = 'corporate'
        AND EXISTS (
          SELECT 1
          FROM public.corporate_profiles
          WHERE corporate_profiles.id = following_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "System can create notifications"
  ON public.notifications;
REVOKE INSERT ON public.notifications FROM authenticated;

CREATE OR REPLACE FUNCTION public.notify_post_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_record RECORD;
  actor_name TEXT;
BEGIN
  SELECT posts.author_id, posts.title
  INTO post_record
  FROM public.posts
  WHERE posts.id = NEW.post_id;

  IF post_record.author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT users.name INTO actor_name
  FROM public.users
  WHERE users.id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    post_record.author_id,
    CASE
      WHEN TG_TABLE_NAME = 'post_likes' THEN 'post_liked'
      ELSE 'post_commented'
    END,
    CASE
      WHEN TG_TABLE_NAME = 'post_likes' THEN 'Your post received a like'
      ELSE 'Your post received a comment'
    END,
    COALESCE(actor_name, 'A community member')
      || CASE
        WHEN TG_TABLE_NAME = 'post_likes' THEN ' liked "'
        ELSE ' commented on "'
      END
      || post_record.title || '"',
    '/community/' || NEW.post_id::TEXT
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_post_like ON public.post_likes;
CREATE TRIGGER notify_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_post_interaction();

DROP TRIGGER IF EXISTS notify_post_comment ON public.post_comments;
CREATE TRIGGER notify_post_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_interaction();

DELETE FROM public.content_reports AS duplicate
USING public.content_reports AS original
WHERE duplicate.reported_by = original.reported_by
  AND duplicate.entity_type = original.entity_type
  AND duplicate.entity_id = original.entity_id
  AND (
    duplicate.created_at > original.created_at
    OR (
      duplicate.created_at = original.created_at
      AND duplicate.id > original.id
    )
  );

ALTER TABLE public.content_reports
  DROP CONSTRAINT IF EXISTS content_reports_one_per_reporter_entity,
  ADD CONSTRAINT content_reports_one_per_reporter_entity
    UNIQUE (reported_by, entity_type, entity_id);

DROP POLICY IF EXISTS "Users report content" ON public.content_reports;
CREATE POLICY "Verified users report visible content"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND status = 'pending'
    AND public.is_email_verified()
  );

CREATE INDEX IF NOT EXISTS posts_visible_feed
  ON public.posts (created_at DESC)
  WHERE status = 'published' AND hidden_at IS NULL;

REVOKE ALL ON FUNCTION public.notify_post_interaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_post_moderation_fields() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_review_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', TRUE) IS DISTINCT FROM 'service_role'
    AND NOT public.is_admin() AND (
      NEW.hidden_at IS DISTINCT FROM OLD.hidden_at
      OR NEW.hidden_reason IS DISTINCT FROM OLD.hidden_reason
      OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
    )
  THEN
    RAISE EXCEPTION 'Moderation fields are admin-managed';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_review_moderation_fields() FROM PUBLIC;
