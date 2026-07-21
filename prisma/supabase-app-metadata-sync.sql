-- ============================================================
-- Supabase App Metadata Sync - Dar es Salaam Road Safety
-- ============================================================
-- Hii script inahakikisha kuwa kila user anapopata role update
-- (kutoka kwenye UserProfile table), role yake inasawazishwa
-- moja kwa moja kwenye auth.users.raw_app_meta_data.
--
-- Hii inafanya kazi kama Firebase Custom Claims — middleware
-- inaweza kusoma role moja kwa moja kutoka kwa Supabase Auth
-- bila kuuliza DB tena.
--
-- IMPORTANT: Jina la column ni raw_app_meta_data (sio raw_app_metadata)
-- ============================================================

-- 1. Function: sync profile role to auth.users.raw_app_meta_data
CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supabase_uid uuid;
BEGIN
  -- Get the supabaseUid from the UserProfile
  v_supabase_uid := NEW."supabaseUid"::uuid;

  -- If supabaseUid is set, update the auth.users raw_app_meta_data
  IF v_supabase_uid IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
        raw_app_meta_data || jsonb_build_object('role', NEW.role)
    WHERE id = v_supabase_uid;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger: runs AFTER insert or update on UserProfile
DROP TRIGGER IF EXISTS trg_sync_role_to_app_metadata ON public."UserProfile";
CREATE TRIGGER trg_sync_role_to_app_metadata
  AFTER INSERT OR UPDATE OF role, "supabaseUid"
  ON public."UserProfile"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_app_metadata();

-- ============================================================
-- 3. Backfill: Sync existing users who have profiles but no
--    app_meta_data.role set yet.
-- ============================================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT up."supabaseUid", up.role
    FROM public."UserProfile" up
    WHERE up."supabaseUid" IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
        raw_app_meta_data || jsonb_build_object('role', rec.role)
    WHERE id = rec."supabaseUid"::uuid
      AND (
        raw_app_meta_data IS NULL
        OR raw_app_meta_data->>'role' IS NULL
        OR raw_app_meta_data->>'role' != rec.role
      );
  END LOOP;
END;
$$;

-- ============================================================
-- 4. Set app_meta_data for the super admin email
-- ============================================================
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
WHERE email = 'roadsafetydar@gmail.com'
  AND (
    raw_app_meta_data IS NULL
    OR raw_app_meta_data->>'role' IS NULL
    OR raw_app_meta_data->>'role' != 'admin'
  );

-- ============================================================
-- 5. RLS Policies: Protect UserProfile data based on role
--    NOTE: PostgreSQL does NOT support "CREATE POLICY IF NOT EXISTS"
--    So we use DROP + CREATE pattern instead.
-- ============================================================

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public."UserProfile";
CREATE POLICY "Users can view own profile"
  ON public."UserProfile"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "supabaseUid"::uuid);

-- Allow admins (tanroads/superuser) to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public."UserProfile";
CREATE POLICY "Admins can view all profiles"
  ON public."UserProfile"
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'tanroads')
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND (u."isSuperuser" = true)
    )
  );

-- Only admins can update profiles
DROP POLICY IF EXISTS "Only admins can update profiles" ON public."UserProfile";
CREATE POLICY "Only admins can update profiles"
  ON public."UserProfile"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'tanroads')
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND (u."isSuperuser" = true)
    )
  );

-- ============================================================
-- 6. Helper function to manually sync a user's role to app_meta_data
--    Call this from the API or Supabase dashboard when needed:
--    SELECT public.manually_sync_role('user-uuid-here', 'admin');
-- ============================================================
CREATE OR REPLACE FUNCTION public.manually_sync_role(p_supabase_uid uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', p_role)
  WHERE id = p_supabase_uid;
END;
$$;

-- ============================================================
-- DONE! Script imekamilika.
-- ============================================================
-- Baada ya kukimbisha hii script:
--   1. Ingia kwenye app kwa roadsafetydar@gmail.com
--   2. Bofya avatar yako juu kulia
--   3. Bofya "🔄 Fix My Role"
--   4. Utaona badge ya ADMIN na access ya /authority na /editor
-- ============================================================