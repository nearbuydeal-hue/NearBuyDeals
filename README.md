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
