# Car Service Production Technical Task

Date: 2026-06-23

## 1. Assumptions

- This is an internal production app for your car-service company.
- The app must track cars, companies that own cars, repair jobs, assigned masters, job steps, parts/expenses, customer invoices, payments, and profit.
- The two outside companies should be modeled as customer companies with many cars, not as hardcoded categories. This keeps the system ready for more fleet customers later.
- The first version should optimize for accounting correctness and daily workshop control, not for public customer self-service.
- Images are needed for car intake, damage proof, repair progress, and final delivery proof.

## 2. Recommended Stack

Use:

- Next.js App Router with TypeScript
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Vercel deployment
- Tailwind CSS plus shadcn/ui
- Playwright for end-to-end tests
- Vitest for pure business logic tests

Why Next.js instead of plain React/Vite:

- You need protected dashboards, server-side authorization, and accounting logic.
- Server Actions and Route Handlers let sensitive operations run on the server.
- Supabase SSR auth works cleanly with cookie-based sessions.
- Vercel supports Next.js deployment directly.

Plain React/Vite is acceptable only if the app is a simple frontend over Supabase. For this app, that is weaker because finance calculations and permission checks should not live only in browser code.

## 3. Product Goal

Build one source of truth for the workshop:

1. Register every customer company and car.
2. Open a job order for a car.
3. Record what happened to the car, with images when needed.
4. Assign one or more masters to job steps.
5. Track customer price, master cost, parts cost, outside-service cost, and other expenses.
6. Generate perfect income, expense, receivable, payable, and profit numbers.
7. See service history per car and per company.

## 4. Core Roles

- Owner: full access, finance, reports, settings.
- Admin or service advisor: cars, job orders, images, assignments, customer updates.
- Master: sees assigned work, updates progress, adds notes/photos, cannot change finance totals except proposed labor cost if allowed.
- Accountant: payments, expenses, invoices, reports.

For MVP, implement Owner and Admin first. Add Master and Accountant permissions after the workflow is stable.

## 5. Main Entities

### 5.1 Users and access

- `profiles`
  - `id uuid primary key references auth.users`
  - `full_name text not null`
  - `role text not null check role in ('owner','admin','master','accountant')`
  - `active boolean default true`
  - `created_at timestamptz default now()`

### 5.2 Customer companies

- `customer_companies`
  - `id uuid primary key`
  - `name text not null`
  - `company_type text not null default 'fleet'`
  - `phone text`
  - `contact_person text`
  - `billing_terms text`
  - `active boolean default true`
  - `created_at timestamptz default now()`

Use this for your two companies. Do not create fixed columns like `company_1` and `company_2`.

### 5.3 Cars

- `cars`
  - `id uuid primary key`
  - `customer_company_id uuid references customer_companies(id)`
  - `plate_number text not null`
  - `vin text`
  - `make text`
  - `model text`
  - `year int`
  - `color text`
  - `current_odometer int`
  - `status text default 'active'`
  - `created_at timestamptz default now()`

Important constraints:

- Unique `plate_number`.
- Index `customer_company_id`.
- Every job order must link to a car.

### 5.4 Masters

- `masters`
  - `id uuid primary key`
  - `profile_id uuid references profiles(id)`
  - `name text not null`
  - `phone text`
  - `specialty text`
  - `active boolean default true`
  - `default_pay_type text default 'per_job'`
  - `created_at timestamptz default now()`

### 5.5 Service catalog

- `service_categories`
  - `id uuid primary key`
  - `name text not null`

- `service_catalog`
  - `id uuid primary key`
  - `category_id uuid references service_categories(id)`
  - `name text not null`
  - `default_customer_price numeric(12,2)`
  - `default_master_cost numeric(12,2)`
  - `active boolean default true`

This speeds up job entry but should not lock prices. Each job step stores its own final prices.

### 5.6 Job orders

- `job_orders`
  - `id uuid primary key`
  - `job_number text unique not null`
  - `car_id uuid not null references cars(id)`
  - `customer_company_id uuid references customer_companies(id)`
  - `status text not null default 'opened'`
  - `opened_at timestamptz default now()`
  - `closed_at timestamptz`
  - `intake_odometer int`
  - `problem_description text`
  - `internal_notes text`
  - `created_by uuid references profiles(id)`

Allowed statuses:

- `opened`
- `diagnosing`
- `waiting_approval`
- `in_progress`
- `ready`
- `delivered`
- `cancelled`

Rule:

- When a job opens, copy `cars.customer_company_id` into `job_orders.customer_company_id` so old finance reports remain correct even if the car owner changes later.

### 5.7 Job issues and photos

- `job_issues`
  - `id uuid primary key`
  - `job_order_id uuid not null references job_orders(id) on delete cascade`
  - `title text not null`
  - `description text`
  - `severity text`

- `job_photos`
  - `id uuid primary key`
  - `job_order_id uuid not null references job_orders(id) on delete cascade`
  - `issue_id uuid references job_issues(id)`
  - `photo_type text not null`
  - `storage_path text not null`
  - `uploaded_by uuid references profiles(id)`
  - `created_at timestamptz default now()`

Photo types:

- `intake`
- `damage`
- `progress`
- `parts`
- `final`

### 5.8 Job steps / master work

- `job_steps`
  - `id uuid primary key`
  - `job_order_id uuid not null references job_orders(id) on delete cascade`
  - `service_catalog_id uuid references service_catalog(id)`
  - `assigned_master_id uuid references masters(id)`
  - `description text not null`
  - `status text not null default 'pending'`
  - `customer_price numeric(12,2) not null default 0`
  - `master_cost numeric(12,2) not null default 0`
  - `started_at timestamptz`
  - `completed_at timestamptz`
  - `created_at timestamptz default now()`

Allowed statuses:

- `pending`
- `assigned`
- `in_progress`
- `done`
- `cancelled`

Rule:

- `customer_price` is what the client pays for this step.
- `master_cost` is what you owe the master for this step.
- Never calculate master payment from a label or catalog default after saving. Store the final number on the step.

### 5.9 Expenses

- `job_expenses`
  - `id uuid primary key`
  - `job_order_id uuid not null references job_orders(id) on delete cascade`
  - `expense_type text not null`
  - `description text not null`
  - `supplier_name text`
  - `quantity numeric(12,2) default 1`
  - `unit_cost numeric(12,2) not null default 0`
  - `total_cost numeric(12,2) generated always as (quantity * unit_cost) stored`
  - `created_by uuid references profiles(id)`
  - `created_at timestamptz default now()`

Expense types:

- `part`
- `material`
- `outside_service`
- `tool`
- `other`

### 5.10 Payments and ledger

Use a ledger instead of scattered payment fields.

- `ledger_entries`
  - `id uuid primary key`
  - `job_order_id uuid references job_orders(id)`
  - `customer_company_id uuid references customer_companies(id)`
  - `entry_type text not null`
  - `direction text not null`
  - `amount numeric(12,2) not null check (amount >= 0)`
  - `payment_method text`
  - `description text`
  - `entry_date date not null default current_date`
  - `created_by uuid references profiles(id)`
  - `created_at timestamptz default now()`

Entry types:

- `customer_payment`
- `master_payment`
- `supplier_payment`
- `refund`
- `adjustment`
- `other_income`
- `other_expense`

Directions:

- `in`
- `out`

This gives reliable cashflow:

- Cash inflow = sum ledger where direction = `in`
- Cash outflow = sum ledger where direction = `out`
- Net cashflow = inflow - outflow

## 6. Finance Calculation Rules

For each job:

- Customer revenue = sum `job_steps.customer_price`
- Master labor cost = sum `job_steps.master_cost`
- Job expenses = sum `job_expenses.total_cost`
- Gross profit = customer revenue - master labor cost - job expenses
- Customer paid = sum `ledger_entries.amount` where entry_type = `customer_payment`
- Customer balance = customer revenue - customer paid
- Master paid = sum `ledger_entries.amount` where entry_type = `master_payment`
- Master payable = master labor cost - master paid

For a company:

- Company revenue = sum customer revenue for all jobs under company
- Company payments = sum customer payments under company
- Company receivable = company revenue - company payments
- Company gross profit = sum gross profit across company jobs

For workshop cashflow:

- Income = all ledger entries direction `in`
- Expenses = all ledger entries direction `out`
- Net cash = income - expenses

Important accounting rule:

- Revenue and cash are different. A job can be profitable on paper but unpaid. The dashboard must show both profit and cash.

## 7. Dashboard Screens

### 7.1 Main dashboard

Cards:

- Open jobs
- Jobs ready for delivery
- Today's income
- Today's expense
- Today's net cash
- Unpaid customer balance
- Master payable
- Gross profit this month

Tables:

- Active jobs by status
- Cars waiting longest
- Top unpaid companies
- Masters with pending assigned steps

### 7.2 Cars

Features:

- Add car
- Search by plate number
- Filter by customer company
- Car profile
- Full service history
- Total spent by car
- Last service date
- Current open job if exists

### 7.3 Customer companies

Features:

- Add/edit company
- See all cars under company
- See all open jobs
- See total unpaid balance
- See monthly revenue and profit
- Export company statement

### 7.4 Job orders

Features:

- Create job by selecting car
- Add problem description
- Upload intake/damage images
- Add issues
- Add job steps
- Assign master per step
- Set customer price and master cost per step
- Add parts and other expenses
- Change status
- Close job
- Print/share invoice

### 7.5 Masters

Features:

- Master list
- Assigned work
- Work done
- Master payable
- Master payment history

### 7.6 Finance

Tabs:

- Cashflow
- Job profitability
- Company receivables
- Master payables
- Expenses
- Ledger

Must include date filters and export.

## 8. Workflow

### 8.1 Add company

1. Owner/admin creates `customer_companies`.
2. Add contact person and billing terms.
3. Verify company appears in company filter.

### 8.2 Add car

1. Owner/admin chooses customer company.
2. Enters plate number, make, model, year, odometer.
3. System prevents duplicate plate number.
4. Car appears in dashboard and car list.

### 8.3 Open job

1. User clicks New Job.
2. Selects car by plate number.
3. System fills company automatically.
4. User enters odometer and problem description.
5. User uploads intake/damage images if needed.
6. System creates job number.

### 8.4 Assign work

1. User adds one or more job steps.
2. For each step, choose service, master, customer price, master cost.
3. Master sees assigned work.
4. Step moves through statuses until done.

### 8.5 Add expenses

1. User adds parts/material/outside-service expense.
2. Expense links to job order.
3. Job profit recalculates.

### 8.6 Receive payment

1. Accountant records customer payment in ledger.
2. Payment links to job and company.
3. Customer balance updates.
4. Cashflow updates.

### 8.7 Pay master

1. Accountant records master payment in ledger.
2. Payment links to job if possible.
3. Master payable updates.
4. Cashflow updates.

## 9. Supabase Security Plan

Use Supabase Auth and RLS.

Minimum RLS rules:

- Only authenticated active profiles can access app tables.
- Owner/admin can read and write all operational tables.
- Master can read only assigned job steps and related car/job summary.
- Accountant can read operational tables and write ledger entries.
- Storage uploads must require authenticated users and must be restricted to the job image bucket.

Do not:

- Put service-role keys in browser code.
- Use user-editable metadata for authorization.
- Depend only on frontend route hiding for permissions.

## 10. Storage Plan

Create private bucket:

- `job-photos`

Path format:

- `jobs/{job_order_id}/{photo_type}/{uuid}.jpg`

Rules:

- Only authenticated staff can upload.
- Only authorized staff can view.
- Use signed URLs for private images.
- Compress images before upload if possible.

## 11. Suggested Project Structure

```txt
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      cars/
      companies/
      jobs/
      masters/
      finance/
      settings/
    api/
      storage/sign-upload/
      reports/company-statement/
  components/
    ui/
    layout/
    forms/
    tables/
  features/
    cars/
    companies/
    jobs/
    masters/
    finance/
  lib/
    supabase/
    auth/
    money.ts
    permissions.ts
  server/
    actions/
    queries/
  tests/
```

## 12. Implementation Phases

### Phase 0: Product decisions

Success criteria:

- Confirm stack.
- Confirm exact roles.
- Confirm whether app is internal-only or multi-workshop SaaS.
- Confirm company fields needed for billing.
- Confirm currency and tax behavior.

Tasks:

1. Write final scope.
2. Draw core workflow.
3. Freeze MVP screens.
4. Decide whether invoices need PDF from day one.

### Phase 1: Project setup

Success criteria:

- App runs locally.
- Supabase project connected.
- Auth works.
- Vercel preview deploy works.

Tasks:

1. Create Next.js app with TypeScript, Tailwind, App Router.
2. Install Supabase packages.
3. Add shadcn/ui.
4. Add env files.
5. Create Supabase project.
6. Configure Auth redirect URLs for local and Vercel.
7. Deploy empty protected shell to Vercel.

### Phase 2: Database migration

Success criteria:

- All MVP tables exist.
- RLS enabled.
- Seed data includes two customer companies, sample cars, masters, and service catalog.
- Database types generated for TypeScript.

Tasks:

1. Create Supabase migrations.
2. Add constraints and indexes.
3. Add RLS policies.
4. Add seed script.
5. Generate TypeScript types.
6. Run local test queries for each role.

### Phase 3: Auth and shell

Success criteria:

- Login works.
- Unauthorized users cannot access dashboard.
- Sidebar navigation shows correct screens.

Tasks:

1. Implement login/logout.
2. Create protected dashboard layout.
3. Load current profile server-side.
4. Add role guard helpers.
5. Add empty states for all main pages.

### Phase 4: Companies and cars

Success criteria:

- You can create a company.
- You can add many cars under a company.
- You can search by plate number.
- Car service history page exists.

Tasks:

1. Build companies CRUD.
2. Build cars CRUD.
3. Add duplicate plate validation.
4. Build company detail page.
5. Build car detail page.

### Phase 5: Job orders

Success criteria:

- You can open a job for a car.
- Company is auto-filled from the car.
- You can add issues, steps, masters, prices, and status.

Tasks:

1. Build New Job flow.
2. Build job detail screen.
3. Add job steps table.
4. Add master assignment.
5. Add status changes.
6. Add job number generation.

### Phase 6: Images

Success criteria:

- Intake/damage/progress/final photos upload correctly.
- Images are private.
- Job detail page shows image gallery.

Tasks:

1. Create `job-photos` bucket.
2. Add storage policies.
3. Build image upload UI.
4. Save `job_photos` rows after upload.
5. Use signed URLs for viewing.

### Phase 7: Expenses and ledger

Success criteria:

- Job expenses affect profit.
- Customer payments affect receivables.
- Master payments affect payables.
- Cashflow matches ledger totals.

Tasks:

1. Build job expenses form.
2. Build ledger entry form.
3. Add customer payment flow.
4. Add master payment flow.
5. Add finance calculation functions.
6. Write tests for all money formulas.

### Phase 8: Reports

Success criteria:

- Owner can see exact income, expense, cashflow, profit, receivables, and payables.
- Company statement can be exported.

Tasks:

1. Main dashboard metrics.
2. Finance cashflow page.
3. Job profitability report.
4. Company receivables report.
5. Master payables report.
6. CSV export.
7. Optional PDF invoice/statement.

### Phase 9: Production hardening

Success criteria:

- Build passes.
- Tests pass.
- RLS tested.
- Vercel production deploy works.
- Basic backup and monitoring are configured.

Tasks:

1. Add Playwright tests for critical flows.
2. Add Vitest tests for finance functions.
3. Run Supabase advisors.
4. Review RLS manually.
5. Configure Vercel environment variables.
6. Configure custom domain.
7. Add error monitoring.
8. Document backup/export process.

## 13. Testing Checklist

Unit tests:

- Revenue formula.
- Master payable formula.
- Job gross profit formula.
- Customer balance formula.
- Cashflow formula.

Database tests:

- Duplicate plate blocked.
- Job must have car.
- Job step cannot have negative prices.
- Ledger amount cannot be negative.
- Master cannot see unrelated jobs.

End-to-end tests:

- Login.
- Create company.
- Create car.
- Open job.
- Upload image.
- Assign master.
- Add expenses.
- Record customer payment.
- Record master payment.
- Verify dashboard numbers.

## 14. Deployment Checklist

Manual/account-side tasks:

1. Create Supabase project.
2. Create Vercel project.
3. Add production domain.
4. Set Supabase Auth redirect URLs.
5. Add environment variables to Vercel.
6. Create first owner user.
7. Enable database backups according to plan.

Code-side tasks:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npx playwright test`
5. `npm run build`
6. Push to GitHub.
7. Verify Vercel preview.
8. Promote or deploy production.

## 15. MVP Build Order

Build in this exact order:

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

Reason:

- Cars without jobs are only a database.
- Jobs without finance are not useful.
- Images are important, but finance correctness is more important for the first production version.

## 16. First Version Non-Goals

Do not build these in MVP:

- Customer portal.
- Mobile app.
- Inventory warehouse.
- AI diagnostics.
- Telegram bot.
- Multi-branch SaaS.
- Complex tax module.

Mention them later only after the core workflow is correct.

## 17. Official References Checked

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Auth with Next.js: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR client setup: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Vercel deployments: https://vercel.com/docs/deployments
