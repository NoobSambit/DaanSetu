-- Migration 037: complete owner cleanup for public community media.

DROP POLICY IF EXISTS "Users delete own community media"
  ON storage.objects;
CREATE POLICY "Users delete own community media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE TABLE IF NOT EXISTS public.action_rate_limits (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action ~ '^[a-z0-9_.-]{1,80}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1 CHECK (hits > 0),
  PRIMARY KEY (user_id, action, window_started_at)
);

ALTER TABLE public.action_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.action_rate_limits FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS action_rate_limits_cleanup_idx
  ON public.action_rate_limits (window_started_at);

CREATE OR REPLACE FUNCTION public.consume_action_rate_limit(
  action_name TEXT,
  maximum_hits INTEGER,
  window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  current_window TIMESTAMPTZ;
  current_hits INTEGER;
BEGIN
  IF caller_id IS NULL
    OR action_name !~ '^[a-z0-9_.-]{1,80}$'
    OR maximum_hits NOT BETWEEN 1 AND 1000
    OR window_seconds NOT BETWEEN 1 AND 86400
  THEN
    RAISE EXCEPTION 'Invalid action rate limit request';
  END IF;

  current_window := date_bin(
    make_interval(secs => window_seconds),
    NOW(),
    TIMESTAMPTZ '1970-01-01 00:00:00+00'
  );

  INSERT INTO public.action_rate_limits (
    user_id,
    action,
    window_started_at,
    hits
  ) VALUES (
    caller_id,
    action_name,
    current_window,
    1
  )
  ON CONFLICT (user_id, action, window_started_at) DO UPDATE
  SET hits = public.action_rate_limits.hits + 1
  RETURNING hits INTO current_hits;

  IF random() < 0.01 THEN
    DELETE FROM public.action_rate_limits
    WHERE window_started_at < NOW() - INTERVAL '2 days';
  END IF;

  RETURN current_hits <= maximum_hits;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_action_rate_limit(TEXT, INTEGER, INTEGER)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_action_rate_limit(TEXT, INTEGER, INTEGER)
  TO authenticated;
