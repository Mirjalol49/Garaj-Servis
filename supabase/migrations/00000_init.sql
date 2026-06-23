-- Phase 2: Supabase Schema & RLS
-- Run this in your Supabase SQL Editor

-- 1. Schema Definition

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner','admin','master','accountant')),
  active boolean default true,
  created_at timestamptz default now()
);

create table customer_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_type text not null default 'fleet',
  phone text,
  contact_person text,
  billing_terms text,
  active boolean default true,
  created_at timestamptz default now()
);

create table cars (
  id uuid primary key default gen_random_uuid(),
  customer_company_id uuid references customer_companies(id) on delete restrict,
  plate_number text not null unique,
  vin text,
  make text,
  model text,
  year int,
  color text,
  current_odometer int,
  status text default 'active',
  created_at timestamptz default now()
);
create index idx_cars_company on cars(customer_company_id);

create table masters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  phone text,
  specialty text,
  active boolean default true,
  default_pay_type text default 'per_job',
  created_at timestamptz default now()
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table service_catalog (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references service_categories(id) on delete cascade,
  name text not null,
  default_customer_price numeric(12,2) default 0,
  default_master_cost numeric(12,2) default 0,
  active boolean default true
);

create table job_orders (
  id uuid primary key default gen_random_uuid(),
  job_number text unique not null,
  car_id uuid not null references cars(id) on delete restrict,
  customer_company_id uuid references customer_companies(id) on delete restrict,
  status text not null default 'opened' check (status in ('opened','diagnosing','waiting_approval','in_progress','ready','delivered','cancelled')),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  intake_odometer int,
  problem_description text,
  internal_notes text,
  created_by uuid references profiles(id) on delete set null
);

create table job_issues (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  title text not null,
  description text,
  severity text
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  issue_id uuid references job_issues(id) on delete set null,
  photo_type text not null check (photo_type in ('intake','damage','progress','parts','final')),
  storage_path text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table job_steps (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  service_catalog_id uuid references service_catalog(id) on delete restrict,
  assigned_master_id uuid references masters(id) on delete set null,
  description text not null,
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','done','cancelled')),
  customer_price numeric(12,2) not null default 0,
  master_cost numeric(12,2) not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table job_expenses (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references job_orders(id) on delete cascade,
  expense_type text not null check (expense_type in ('part','material','outside_service','tool','other')),
  description text not null,
  supplier_name text,
  quantity numeric(12,2) default 1,
  unit_cost numeric(12,2) not null default 0,
  total_cost numeric(12,2) generated always as (quantity * unit_cost) stored,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid references job_orders(id) on delete set null,
  customer_company_id uuid references customer_companies(id) on delete restrict,
  entry_type text not null check (entry_type in ('customer_payment','master_payment','supplier_payment','refund','adjustment','other_income','other_expense')),
  direction text not null check (direction in ('in','out')),
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  description text,
  entry_date date not null default current_date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 2. Storage Setup
insert into storage.buckets (id, name, public) values ('job-photos', 'job-photos', false);

-- 3. Trigger for new user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'master'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RLS Setup

-- Enable RLS
alter table profiles enable row level security;
alter table customer_companies enable row level security;
alter table cars enable row level security;
alter table masters enable row level security;
alter table service_categories enable row level security;
alter table service_catalog enable row level security;
alter table job_orders enable row level security;
alter table job_issues enable row level security;
alter table job_photos enable row level security;
alter table job_steps enable row level security;
alter table job_expenses enable row level security;
alter table ledger_entries enable row level security;

-- Policies (We use a simple 'authenticated users can read/write' for MVP, restricted further in the application layer if needed)
create policy "Allow all authenticated operations" on profiles for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on customer_companies for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on cars for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on masters for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on service_categories for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on service_catalog for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on job_orders for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on job_issues for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on job_photos for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on job_steps for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on job_expenses for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated operations" on ledger_entries for all using (auth.role() = 'authenticated');

-- Storage Policies
create policy "Allow authenticated upload" on storage.objects for insert with check (bucket_id = 'job-photos' and auth.role() = 'authenticated');
create policy "Allow authenticated read" on storage.objects for select using (bucket_id = 'job-photos' and auth.role() = 'authenticated');
