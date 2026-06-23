# Sections 13-17 Audit

This file tracks the post-phase checklist from `car-service-production-technical-task.md`.

## Section 13: Testing Checklist

Automated unit coverage:

- Revenue formula: `src/lib/finance/calculations.test.ts`
- Master payable formula: `src/lib/finance/calculations.test.ts`
- Job gross profit formula: `src/lib/finance/calculations.test.ts`
- Customer balance formula: `src/lib/finance/calculations.test.ts`
- Cashflow formula: `src/lib/finance/calculations.test.ts`

Automated database contract coverage:

- Duplicate plate blocked.
- Job must have car.
- Job step customer price and master cost cannot be negative.
- Ledger amount cannot be negative.
- Job photo storage remains private and signed-url based.

These are checked in `tests/database/schema-contract.test.ts`.

Manual/linked-project database coverage:

- Master cannot see unrelated jobs.

This requires real Supabase users, profiles, master records, and role-specific RLS test data. Run it against the linked Supabase project after applying migrations.

Automated e2e smoke coverage:

- Login page behavior.
- Unauthenticated dashboard protection.
- Unauthenticated finance CSV export protection.

These are checked in `tests/e2e/auth-smoke.spec.ts`.

Opt-in full e2e workflow coverage:

- Login.
- Create company.
- Create car.
- Open job.
- Assign/add job step.
- Add expenses.
- Record customer payment.
- Verify dashboard and finance screens.

Run with:

```bash
E2E_FULL_WORKFLOW=1 E2E_PHONE=937489141 E2E_PASSWORD=... npm run test:e2e
```

Photo upload and master payment can be expanded in the same opt-in flow after production test data includes at least one active master.

## Section 14: Deployment Checklist

Code-side items completed locally:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

GitHub branch pushed:

```text
codex/production-ready-carservis
```

Manual/account-side items still required:

- Create or confirm Supabase project.
- Create or confirm Vercel project.
- Add production domain.
- Set Supabase Auth redirect URLs.
- Add Vercel environment variables.
- Create first owner user.
- Enable database backups.
- Verify Vercel preview.
- Promote or deploy production.

## Section 15: MVP Build Order

The MVP build-order items are covered by the implemented app:

1. Auth and protected shell.
2. Companies.
3. Cars.
4. Job orders.
5. Job steps and master assignment.
6. Expenses.
7. Ledger payments.
8. Finance dashboard.
9. Images.
10. Reports/export.

## Section 16: First Version Non-Goals

The MVP intentionally does not include:

- Customer portal.
- Mobile app.
- Inventory warehouse.
- AI diagnostics.
- Telegram bot.
- Multi-branch SaaS.
- Complex tax module.

Do not add these until the core workflow is stable in production.

## Section 17: Official References Checked

References used during implementation:

- Next.js App Router local docs under `node_modules/next/dist/docs`.
- Supabase Auth, RLS, Storage, and CLI guidance.
- Vercel environment variable and deployment guidance.
- Playwright browser automation guidance.
