# Production Hardening Checklist

Use this before a production Vercel deploy.

## Required Vercel Environment Variables

Set these in Vercel for Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not add Supabase service-role keys to the browser or to any `NEXT_PUBLIC_` variable.

Recommended CLI flow:

```bash
vercel env ls production
vercel env pull .env.local --yes
npm run build
```

## Supabase Advisors

Run advisors before production deploy:

```bash
npx supabase db --help
npx supabase db advisors
```

If the CLI cannot connect to the project from this machine, run the same security and performance advisors from the Supabase Dashboard.

## RLS Review

Confirm these tables have RLS enabled:

```text
profiles
customer_companies
cars
masters
service_categories
service_catalog
job_orders
job_issues
job_photos
job_steps
job_expenses
ledger_entries
```

Current MVP policy is authenticated staff access. Before adding external customer or master portals, replace broad authenticated policies with role- and ownership-aware policies.

Confirm storage:

```text
job-photos bucket is private
authenticated upload/read/delete policies exist
all viewing uses signed URLs
```

## Domain

In Vercel:

1. Open Project Settings.
2. Add the custom domain.
3. Follow the DNS record Vercel gives you.
4. Wait for SSL to show as valid.
5. Test `/login`, `/dashboard`, `/jobs`, and `/finance` on the custom domain.

## Monitoring

Minimum setup:

```text
Vercel deployment notifications enabled
Vercel runtime logs checked after deploy
Supabase Auth logs checked after first production login
Supabase Database logs checked after creating a job and ledger entry
```

Recommended next step is adding Sentry or another error monitor for client and server exceptions.

## Backups And Exports

Supabase managed backups should be enabled for the project plan.

Manual export checks:

```text
/finance/export?report=ledger
/finance/export?report=job-profitability
/finance/export?report=company-receivables
/finance/export?report=master-payables
```

Download these CSVs after the first production data entry and confirm the numbers match the Finance page.

## Release Verification

Run locally before pushing/deploying:

```bash
npm run test:finance
npm run test:e2e
npx tsc --noEmit --pretty false
npm run build
```
