
-- 1. Trigger to auto-create roles on signup (admin if first user, otherwise customer)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- 2. Profiles table so we can list users by email in the admin UI
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
CREATE TRIGGER on_auth_user_profile_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Unique index on branch_inventory so seeding is idempotent
CREATE UNIQUE INDEX IF NOT EXISTS branch_inventory_branch_product_unique
  ON public.branch_inventory(branch_id, product_id);

-- 4. Allow staff/manager/admin to DELETE inventory rows (remove product from branch)
DROP POLICY IF EXISTS "Branch staff can delete inventory at their branch" ON public.branch_inventory;
CREATE POLICY "Branch staff can delete inventory at their branch" ON public.branch_inventory
  FOR DELETE TO authenticated
  USING (
    has_branch_role(auth.uid(), 'branch_staff', branch_id)
    OR has_branch_role(auth.uid(), 'branch_manager', branch_id)
    OR has_role(auth.uid(), 'admin')
  );

-- 5. Function to add or update an inventory row at a branch
CREATE OR REPLACE FUNCTION public.upsert_branch_inventory(
  _branch_id uuid,
  _product_id integer,
  _stock integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT (
    has_branch_role(auth.uid(), 'branch_manager', _branch_id)
    OR has_branch_role(auth.uid(), 'branch_staff', _branch_id)
    OR has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO public.branch_inventory (branch_id, product_id, stock, in_stock)
  VALUES (_branch_id, _product_id, GREATEST(_stock, 0), _stock > 0)
  ON CONFLICT (branch_id, product_id)
  DO UPDATE SET stock = EXCLUDED.stock, in_stock = EXCLUDED.stock > 0, updated_at = now()
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
