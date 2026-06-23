insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Allow authenticated job photo uploads" on storage.objects;
create policy "Allow authenticated job photo uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'job-photos');

drop policy if exists "Allow authenticated job photo reads" on storage.objects;
create policy "Allow authenticated job photo reads"
on storage.objects for select
to authenticated
using (bucket_id = 'job-photos');

drop policy if exists "Allow authenticated job photo deletes" on storage.objects;
create policy "Allow authenticated job photo deletes"
on storage.objects for delete
to authenticated
using (bucket_id = 'job-photos');
