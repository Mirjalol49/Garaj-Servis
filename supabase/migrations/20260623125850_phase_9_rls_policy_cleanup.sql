grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.customer_companies to authenticated;
grant select, insert, update, delete on public.cars to authenticated;
grant select, insert, update, delete on public.masters to authenticated;
grant select, insert, update, delete on public.service_categories to authenticated;
grant select, insert, update, delete on public.service_catalog to authenticated;
grant select, insert, update, delete on public.job_orders to authenticated;
grant select, insert, update, delete on public.job_issues to authenticated;
grant select, insert, update, delete on public.job_photos to authenticated;
grant select, insert, update, delete on public.job_steps to authenticated;
grant select, insert, update, delete on public.job_expenses to authenticated;
grant select, insert, update, delete on public.ledger_entries to authenticated;

alter table public.profiles enable row level security;
alter table public.customer_companies enable row level security;
alter table public.cars enable row level security;
alter table public.masters enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_catalog enable row level security;
alter table public.job_orders enable row level security;
alter table public.job_issues enable row level security;
alter table public.job_photos enable row level security;
alter table public.job_steps enable row level security;
alter table public.job_expenses enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists "Allow all authenticated operations" on public.profiles;
drop policy if exists "Authenticated staff can manage profiles" on public.profiles;
create policy "Authenticated staff can manage profiles"
on public.profiles for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.customer_companies;
drop policy if exists "Authenticated staff can manage customer companies" on public.customer_companies;
create policy "Authenticated staff can manage customer companies"
on public.customer_companies for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.cars;
drop policy if exists "Authenticated staff can manage cars" on public.cars;
create policy "Authenticated staff can manage cars"
on public.cars for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.masters;
drop policy if exists "Authenticated staff can manage masters" on public.masters;
create policy "Authenticated staff can manage masters"
on public.masters for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.service_categories;
drop policy if exists "Authenticated staff can manage service categories" on public.service_categories;
create policy "Authenticated staff can manage service categories"
on public.service_categories for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.service_catalog;
drop policy if exists "Authenticated staff can manage service catalog" on public.service_catalog;
create policy "Authenticated staff can manage service catalog"
on public.service_catalog for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.job_orders;
drop policy if exists "Authenticated staff can manage job orders" on public.job_orders;
create policy "Authenticated staff can manage job orders"
on public.job_orders for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.job_issues;
drop policy if exists "Authenticated staff can manage job issues" on public.job_issues;
create policy "Authenticated staff can manage job issues"
on public.job_issues for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.job_photos;
drop policy if exists "Authenticated staff can manage job photos" on public.job_photos;
create policy "Authenticated staff can manage job photos"
on public.job_photos for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.job_steps;
drop policy if exists "Authenticated staff can manage job steps" on public.job_steps;
create policy "Authenticated staff can manage job steps"
on public.job_steps for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.job_expenses;
drop policy if exists "Authenticated staff can manage job expenses" on public.job_expenses;
create policy "Authenticated staff can manage job expenses"
on public.job_expenses for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow all authenticated operations" on public.ledger_entries;
drop policy if exists "Authenticated staff can manage ledger entries" on public.ledger_entries;
create policy "Authenticated staff can manage ledger entries"
on public.ledger_entries for all to authenticated
using (true)
with check (true);

drop policy if exists "Allow authenticated upload" on storage.objects;
drop policy if exists "Allow authenticated read" on storage.objects;
