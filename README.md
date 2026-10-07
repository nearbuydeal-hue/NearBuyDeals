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
service-role key in this file. For production, configure the public HTTPS
origin before building/deploying; this value is also used for canonical
metadata, robots, and sitemap URLs.

The deployed Vercel project also needs `SUPABASE_SERVICE_ROLE_KEY` and
`CRON_SECRET` configured as server-only environment variables for the daily
listing-expiry cron. The cron endpoint is protected by `CRON_SECRET`; do not
prefix either variable with `NEXT_PUBLIC_`. Apply the expiry and availability
request migration with `supabase db push` before deploying this code.

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
Contact event counts are operational signals only: this endpoint can still be
abused to inflate counts and cannot prove a completed call or conversation.
The public listings page caps each response at 100 rows; full pagination or
search is a separate future improvement.

Availability requests are separate from contact-intent rows. Anonymous
customers can submit an email or WhatsApp contact for an approved shop's
currently sold-out item. The database limits a contact to five requests per
24-hour period and prevents duplicate requests for the same item in that
period. Request details are not public or visible to shop owners; they are
available only to authorized admins. No notification is sent automatically.

Business metrics are available to authenticated shop owners for only their own
shop and to admins as aggregates. Phone/WhatsApp contact metrics count recorded
clicks on contact links, not completed conversations. Shops may optionally
report an estimated money-saved amount in INR when marking a listing sold out;
these amounts are self-reported and not independently verified.

## Production pilot checklist

- Replace all bracketed placeholders in the Privacy Policy and Terms with
  operator-approved details. These pages are not legal advice; obtain
  jurisdiction-specific legal review before launch.
- Pharmacy availability requires local legal/regulatory review. NearbyDeals
  approval is not a regulatory authorization. Medicine sales, medicine
  payments, medicine delivery, and prescription processing are out of scope.
- Configure Supabase Auth provider rate limits and abuse controls in the
  Supabase project before accepting public signups. Authentication is handled
  by Supabase Auth; the application does not add a separate durable
  per-IP limiter.
- Notify-me requests have database-backed limits of five requests per
  contact per 24 hours and one same-listing request per contact in that
  period. Contact-click tracking has no reliable distributed per-IP rate
  limit and can be forged; do not treat those counts as audited demand.
- TODO before broader production use: add a durable shared rate limiter for
  public contact-event writes and other public actions, using trusted request
  identity from the hosting layer. Do not replace this with process-local
  memory limiting on serverless instances.
- Configure a retention and deletion schedule for account data, listings,
  contact events, and notify-me contact values. The current application does
  not enforce an automatic retention schedule.
- Next.js writes safe error digests to the hosting runtime log for
  troubleshooting. No external error-monitoring provider is configured.
