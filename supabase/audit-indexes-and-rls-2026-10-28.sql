-- TeachTrack: preserve existing read permissions while reducing RLS overhead.
-- 1) Index currently uncovered foreign keys (not an index on every column).
DO $index_fix$
DECLARE
  fk record;
  idx_name text;
  idx_columns text;
BEGIN
  FOR fk IN
    SELECT c.oid, c.conrelid, c.conname, c.conkey,
           n.nspname, t.relname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE c.contype='f' AND n.nspname='public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid=c.conrelid AND i.indisvalid
          AND i.indnkeyatts >= cardinality(c.conkey)
          AND NOT EXISTS (
            SELECT 1 FROM generate_subscripts(c.conkey,1) pos
            WHERE i.indkey[pos-1] <> c.conkey[pos]
          )
      )
  LOOP
    SELECT string_agg(format('%I',a.attname),', ' ORDER BY k.ord)
      INTO idx_columns
      FROM unnest(fk.conkey) WITH ORDINALITY k(attnum,ord)
      JOIN pg_attribute a ON a.attrelid=fk.conrelid AND a.attnum=k.attnum;

    idx_name := format('tt_fk_%s_%s',left(fk.relname,30),left(md5(fk.conname),9));
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
                   idx_name, fk.nspname, fk.relname, idx_columns);
  END LOOP;
END $index_fix$;

-- 2) Cache auth.uid() once per statement rather than evaluating it for each row.
-- ALTER POLICY keeps the original roles, permissive mode and predicates.
DO $initplan_fix$
DECLARE p record;
  new_using text;
  new_check text;
  policy_cmd text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND (coalesce(qual,'') ~ 'auth[.]uid[(][)]'
        OR coalesce(with_check,'') ~ 'auth[.]uid[(][)]')
  LOOP
    new_using := regexp_replace(p.qual,'auth[.]uid[(][)]','(select auth.uid())','g');
    new_check := regexp_replace(p.with_check,'auth[.]uid[(][)]','(select auth.uid())','g');
    policy_cmd := upper(p.cmd);
    IF policy_cmd='INSERT' THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
                     p.policyname,p.schemaname,p.tablename,new_check);
    ELSIF policy_cmd IN ('SELECT','DELETE') THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
                     p.policyname,p.schemaname,p.tablename,new_using);
    ELSE
      IF new_check IS NULL THEN
        EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
                       p.policyname,p.schemaname,p.tablename,new_using);
      ELSE
        EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
                       p.policyname,p.schemaname,p.tablename,new_using,new_check);
      END IF;
    END IF;
  END LOOP;
END $initplan_fix$;

-- 3) Remove exact duplicate read policy on profiles.
DROP POLICY IF EXISTS "profile self or leadership read" ON public.profiles;

-- 4) A broad ALL write policy also acts as a second SELECT policy.
-- Split into three DML-only policies ONLY where a dedicated SELECT policy
-- already exists and its read predicate includes every writer role.
DO $split_write$
DECLARE p record;
  check_expr text;
BEGIN
  FOR p IN
    SELECT w.schemaname,w.tablename,w.policyname,w.qual,w.with_check,w.roles,w.permissive
    FROM pg_policies w
    WHERE w.schemaname='public' AND w.cmd='ALL'
      AND EXISTS (
        SELECT 1 FROM pg_policies r
        WHERE r.schemaname=w.schemaname AND r.tablename=w.tablename
          AND r.cmd='SELECT' AND r.roles=w.roles
      )
  LOOP
    IF p.roles <> '{authenticated}' OR p.permissive <> 'PERMISSIVE' THEN
      RAISE EXCEPTION 'Review policy % on %: unsupported roles or mode',
         p.policyname,p.tablename;
    END IF;
    check_expr:=coalesce(p.with_check,p.qual);
    EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (%s)',
      p.policyname||' insert',p.schemaname,p.tablename,check_expr);
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
      p.policyname||' update',p.schemaname,p.tablename,p.qual,check_expr);
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR DELETE TO authenticated USING (%s)',
      p.policyname||' delete',p.schemaname,p.tablename,p.qual);
  END LOOP;
END $split_write$;
