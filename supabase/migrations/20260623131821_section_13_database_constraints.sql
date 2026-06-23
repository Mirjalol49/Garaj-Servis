do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'job_steps_customer_price_nonnegative'
  ) then
    alter table public.job_steps
    add constraint job_steps_customer_price_nonnegative check (customer_price >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'job_steps_master_cost_nonnegative'
  ) then
    alter table public.job_steps
    add constraint job_steps_master_cost_nonnegative check (master_cost >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'job_expenses_quantity_positive'
  ) then
    alter table public.job_expenses
    add constraint job_expenses_quantity_positive check (quantity > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'job_expenses_unit_cost_nonnegative'
  ) then
    alter table public.job_expenses
    add constraint job_expenses_unit_cost_nonnegative check (unit_cost >= 0);
  end if;
end $$;
