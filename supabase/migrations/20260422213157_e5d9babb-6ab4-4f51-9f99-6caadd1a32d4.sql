
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'branch_manager', 'branch_staff', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending_payment', 'pending', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled');

-- =========================================================
-- BRANCHES
-- =========================================================
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  address text NOT NULL,
  phone text,
  lat numeric,
  lng numeric,
  opens_at time DEFAULT '08:00',
  closes_at time DEFAULT '21:00',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches are public" ON public.branches FOR SELECT USING (true);

INSERT INTO public.branches (name, slug, address, phone, lat, lng) VALUES
  ('Simba Supermarket Remera',     'remera',     'Remera, Gasabo, Kigali',     '+250 788 000 001', -1.9580, 30.1250),
  ('Simba Supermarket Kimironko',  'kimironko',  'Kimironko, Gasabo, Kigali',  '+250 788 000 002', -1.9357, 30.1247),
  ('Simba Supermarket Kacyiru',    'kacyiru',    'Kacyiru, Gasabo, Kigali',    '+250 788 000 003', -1.9430, 30.0850),
  ('Simba Supermarket Nyamirambo', 'nyamirambo', 'Nyamirambo, Nyarugenge, Kigali', '+250 788 000 004', -1.9780, 30.0410),
  ('Simba Supermarket Gikondo',    'gikondo',    'Gikondo, Kicukiro, Kigali',  '+250 788 000 005', -1.9870, 30.0870),
  ('Simba Supermarket Kanombe',    'kanombe',    'Kanombe, Kicukiro, Kigali',  '+250 788 000 006', -1.9690, 30.1390),
  ('Simba Supermarket Kinyinya',   'kinyinya',   'Kinyinya, Gasabo, Kigali',   '+250 788 000 007', -1.9180, 30.1080),
  ('Simba Supermarket Kibagabaga', 'kibagabaga', 'Kibagabaga, Gasabo, Kigali', '+250 788 000 008', -1.9230, 30.1180),
  ('Simba Supermarket Nyanza',     'nyanza',     'Nyanza-Kicukiro, Kigali',    '+250 788 000 009', -2.0050, 30.1020);

-- =========================================================
-- USER ROLES (separate table — never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, branch_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_branch_role(_user_id uuid, _role public.app_role, _branch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND branch_id = _branch_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_branch_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT branch_id FROM public.user_roles
  WHERE user_id = _user_id AND role IN ('branch_manager','branch_staff') LIMIT 1
$$;

-- Bootstrap: first user becomes admin automatically
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  -- Everyone is also a customer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_bootstrap
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

CREATE POLICY "Anyone can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can grant roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can revoke roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- BRANCH INVENTORY (per-branch stock)
-- =========================================================
CREATE TABLE public.branch_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, product_id)
);

CREATE INDEX idx_branch_inventory_branch ON public.branch_inventory(branch_id);
CREATE INDEX idx_branch_inventory_product ON public.branch_inventory(product_id);

ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory is public" ON public.branch_inventory FOR SELECT USING (true);
CREATE POLICY "Branch staff can insert inventory at their branch" ON public.branch_inventory
  FOR INSERT TO authenticated WITH CHECK (
    public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
    OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Branch staff can update inventory at their branch" ON public.branch_inventory
  FOR UPDATE TO authenticated USING (
    public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
    OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- ORDERS — extend for pick-up / branches / deposit / staff workflow
-- =========================================================
ALTER TABLE public.orders ADD COLUMN branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.orders ADD COLUMN pickup_time timestamptz;
ALTER TABLE public.orders ADD COLUMN deposit_amount numeric NOT NULL DEFAULT 500;
ALTER TABLE public.orders ADD COLUMN deposit_paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN ready_at timestamptz;
ALTER TABLE public.orders ADD COLUMN picked_up_at timestamptz;

-- Allow staff/manager at the branch to read & update orders
CREATE POLICY "Branch staff can read branch orders" ON public.orders
  FOR SELECT TO authenticated USING (
    branch_id IS NOT NULL AND (
      public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
      OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Branch staff can update branch orders" ON public.orders
  FOR UPDATE TO authenticated USING (
    branch_id IS NOT NULL AND (
      public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
      OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- =========================================================
-- BRANCH REVIEWS
-- =========================================================
CREATE TABLE public.branch_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, order_id)
);

ALTER TABLE public.branch_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" ON public.branch_reviews FOR SELECT USING (true);
CREATE POLICY "Customers create their own reviews" ON public.branch_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers update their own reviews" ON public.branch_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Customers delete their own reviews" ON public.branch_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- CUSTOMER FLAGS (branch staff -> customer no-shows)
-- =========================================================
CREATE TABLE public.customer_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  flagged_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'no_show',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can create flags at their branch" ON public.customer_flags
  FOR INSERT TO authenticated WITH CHECK (
    public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
    OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Staff can view flags at their branch" ON public.customer_flags
  FOR SELECT TO authenticated USING (
    public.has_branch_role(auth.uid(), 'branch_staff', branch_id)
    OR public.has_branch_role(auth.uid(), 'branch_manager', branch_id)
    OR public.has_role(auth.uid(), 'admin')
    OR customer_id = auth.uid()
  );

-- =========================================================
-- PRODUCT TRANSLATIONS (cached, filled by AI batch later)
-- =========================================================
CREATE TABLE public.products_i18n (
  product_id integer NOT NULL,
  lang text NOT NULL CHECK (lang IN ('FR','RW')),
  name text NOT NULL,
  category text,
  unit text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, lang)
);

ALTER TABLE public.products_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Translations are public" ON public.products_i18n FOR SELECT USING (true);
CREATE POLICY "Admins manage translations" ON public.products_i18n
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- HELPER: seed initial inventory (random stock 0-50) for all branches
-- This is used by an admin-triggered server function later.
-- =========================================================
CREATE OR REPLACE FUNCTION public.seed_branch_inventory(_product_ids integer[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  INSERT INTO public.branch_inventory (branch_id, product_id, stock, in_stock)
  SELECT b.id, p.product_id, (10 + floor(random()*40))::int, true
  FROM public.branches b
  CROSS JOIN unnest(_product_ids) AS p(product_id)
  ON CONFLICT (branch_id, product_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
