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
`SITE_URL` is the app's canonical origin used for email confirmation and
Google OAuth redirects. It must match the origin where the local app is
actually running (for example, `http://127.0.0.1:3001`). Never put a
service-role key in this file.

Configure Supabase Auth's Site URL to match `SITE_URL`, and allow
`SITE_URL/auth/callback` as a redirect URL under Authentication → URL
Configuration.

### Email and Google authentication

Email/password sign-up is available in the app. In Supabase, enable the Email
provider under Authentication → Providers → Email. Set the Site URL and
redirect URL as described above so confirmation links return to the app.
Supabase's built-in email sender is suitable for basic testing; configure a
trusted custom SMTP provider before relying on confirmation emails in
production.

Google sign-in is available from the login and shop sign-up pages. To enable
it:

1. In Google Cloud Console, create/select a project, configure the OAuth
   consent screen, and create an OAuth client ID of type **Web application**.
2. Add the Supabase Auth callback URL
   `https://<your-project-ref>.supabase.co/auth/v1/callback` as an
   **Authorized redirect URI** in the Google OAuth client.
3. In Supabase Authentication → Providers → Google, enable Google and enter
   the Google client ID and client secret.
4. In Google Cloud's OAuth consent screen, add your Google account as a test
   user if the app is still in testing mode.
5. In Supabase Authentication → URL Configuration, ensure
   `SITE_URL/auth/callback` is in **Redirect URLs**. The Google OAuth callback
   configured in Google Cloud is the Supabase URL from step 2, not the app URL.

New Google users are signed in first and then asked for their shop details;
the app creates the shop as pending review. Shop-owner onboarding depends on
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
