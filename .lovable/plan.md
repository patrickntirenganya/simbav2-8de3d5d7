# Fix: Grant Admin Access to Your Account

## The problem

There are no preset admin credentials in this system. The design is: **the first person to sign up automatically becomes admin**, via a database trigger called `bootstrap_first_admin`.

But your account (`patrickntirenganya110@gmail.com`) was created via Google sign-in **before** that trigger existed in the database. As a result, your user has **zero roles** assigned — no `admin`, not even `customer` — which is why the `/admin` page denies you access.

There is no password for me to give you. Your existing Google login is correct; the missing piece is the role row in the database.

## The fix (one small migration)

Run a one-time SQL migration that does two things:

1. Insert the `admin` role for your existing user id (`7809cb6c-c314-42d9-8f63-9fdafb003498`).
2. Insert the `customer` role for the same user (so you also see the normal shopping experience as expected).

Both inserts use `ON CONFLICT DO NOTHING` so they're safe to re-run.

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('7809cb6c-c314-42d9-8f63-9fdafb003498', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('7809cb6c-c314-42d9-8f63-9fdafb003498', 'customer')
ON CONFLICT DO NOTHING;
```

## Also: make sure this never happens again

I'll verify the `bootstrap_first_admin` trigger is actually attached to `auth.users` (the schema dump shows the function exists but lists no triggers, which is suspicious). If it's not wired up, I'll attach it so future first-signups on a fresh install behave correctly:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();
```

(Same check for `handle_new_user_profile` — it should also be a trigger on `auth.users` so profiles get auto-created on signup.)

## After the migration

1. Refresh the app (or sign out and sign back in with Google so the role is re-read).
2. Open `/admin` — you'll have full admin access: grant roles to other users by email, run the product translation job, seed branch inventory, etc.
3. Your same Google account (`patrickntirenganya110@gmail.com`) is now both admin and customer.

## What I will NOT do

- I won't create a second "admin" account with a password — your Google login is your admin login.
- I won't change any data other than inserting two role rows for your user.
