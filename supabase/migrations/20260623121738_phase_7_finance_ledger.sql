alter table public.ledger_entries
add column if not exists master_id uuid references public.masters(id) on delete restrict;

create index if not exists idx_ledger_entries_job_order on public.ledger_entries(job_order_id);
create index if not exists idx_ledger_entries_customer_company on public.ledger_entries(customer_company_id);
create index if not exists idx_ledger_entries_master on public.ledger_entries(master_id);
create index if not exists idx_ledger_entries_entry_date on public.ledger_entries(entry_date);
create index if not exists idx_job_expenses_job_order on public.job_expenses(job_order_id);

grant select, insert, update, delete on public.job_expenses to authenticated;
grant select, insert, update, delete on public.ledger_entries to authenticated;

alter table public.job_expenses enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists "Allow all authenticated operations" on public.job_expenses;
drop policy if exists "Authenticated staff can manage job expenses" on public.job_expenses;
create policy "Authenticated staff can manage job expenses"
on public.job_expenses
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.ledger_entries;
drop policy if exists "Authenticated staff can manage ledger entries" on public.ledger_entries;
create policy "Authenticated staff can manage ledger entries"
on public.ledger_entries
for all
to authenticated
using (true)
with check (true);
