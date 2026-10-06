# NearbyDeals engineering rules

1. Never commit secrets.
2. Never use `NEXT_PUBLIC_` for private keys.
3. Use public/anon keys plus RLS for normal Supabase features.
4. Keep Supabase service-role keys server-only.
5. Every database table must have RLS.
6. Every database table must have explicit RLS policies.
7. All database schema changes must use `supabase/migrations/*.sql`.
8. Validate untrusted server input with Zod.
9. Build mobile-first.
10. Use TypeScript strictly.
11. Prefer Server Components.
12. Do not add unnecessary dependencies.
13. Do not modify unrelated working code.
14. Inspect existing code before changing it.
15. Never implement payment or delivery features unless explicitly requested.
16. Pharmacy functionality must follow the project's legal restrictions: no medicine sales, payments, delivery, or prescription processing until local legal requirements have been reviewed.
17. Run `npm run lint` after implementation.
18. Run `npm run build` after implementation.
19. Fix all lint/build errors.
20. Review changes for secrets before committing.
21. Commit with a clear commit message.
22. Push successful changes to GitHub.
23. End every task with a summary of what changed and what must be manually tested.
