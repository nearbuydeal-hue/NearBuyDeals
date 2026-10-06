# NearbyDeals

NearbyDeals helps people discover available products from local shops and
contact those shops directly.

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Project status

Month 1 Beta preparation.

## Database migrations

Supabase schema changes belong in `supabase/migrations/`. After creating a
Supabase project, authenticate and link this repository, then apply the
migrations with the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For the Next.js app, copy `.env.example` to `.env.local` and set `SITE_URL`,
`SUPABASE_URL`, and `SUPABASE_ANON_KEY` from the Supabase project settings.
`SITE_URL` is the app's canonical origin used for email confirmation
redirects. Never put a service-role key in this file.
Configure Supabase Auth's Site URL to match `SITE_URL`, and allow
`SITE_URL/auth/callback` as a redirect URL. Shop-owner onboarding depends on
the initial schema and onboarding migrations being applied before the app can
read or write account data.

Before applying the onboarding migration to a database that already contains
shops, confirm each owner has at most one shop:

```sql
SELECT owner_id, count(*)
FROM public.shops
GROUP BY owner_id
HAVING count(*) > 1;
```

The onboarding migration enforces one shop per owner to match the dashboard
and self-service signup flow.

Do not put database passwords or service-role keys in source code. The initial
admin must be provisioned by a trusted project operator after the migration
and profile trigger are installed; ordinary users cannot assign roles to
themselves. Use the operator's Supabase SQL Editor to identify the intended
user in `auth.users`, then promote that exact profile:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<intended-auth-user-uuid>'::uuid
RETURNING id, role;
```

Verify the returned row and role before closing the SQL Editor. This is
privileged data provisioning, not a substitute for committing schema changes
as migrations.

To verify row-level security after applying the migration, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'shops',
    'listings',
    'notify_requests',
    'shop_contacts'
  )
ORDER BY tablename;
```

To inspect the policies installed on those tables, run:

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'shops',
    'listings',
    'notify_requests',
    'shop_contacts'
  )
ORDER BY tablename, policyname;
```

Contact-intent rows deliberately store no customer identity or contact
details. Anonymous clients can insert an event only for an approved shop (and,
when supplied, an active listing); they cannot read, change, or delete events.
This insert-only endpoint can still be abused to inflate counts, so add
server-side validation and rate limiting before using these events for
decisions.
