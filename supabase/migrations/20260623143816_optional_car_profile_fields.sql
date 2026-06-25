alter table public.cars
  alter column plate_number drop not null,
  add column if not exists car_name text,
  add column if not exists owner_phone text,
  add column if not exists notes text,
  add column if not exists profile_image_path text;

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', false)
on conflict (id) do nothing;

drop policy if exists "Allow authenticated car photo uploads" on storage.objects;
create policy "Allow authenticated car photo uploads"
on storage.objects for insert to authenticated
with check (bucket_id = 'car-photos');

drop policy if exists "Allow authenticated car photo reads" on storage.objects;
create policy "Allow authenticated car photo reads"
on storage.objects for select to authenticated
using (bucket_id = 'car-photos');

drop policy if exists "Allow authenticated car photo deletes" on storage.objects;
create policy "Allow authenticated car photo deletes"
on storage.objects for delete to authenticated
using (bucket_id = 'car-photos');
