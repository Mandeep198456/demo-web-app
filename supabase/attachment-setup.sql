-- Run this in Supabase SQL Editor to enable image/PDF attachments.
-- It creates the storage bucket and adds attachment fields to the demo_requests table.

alter table public.demo_requests
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_path text,
  add column if not exists attachment_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'request-attachments',
  'request-attachments',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload request attachments" on storage.objects;

create policy "Anyone can upload request attachments"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'request-attachments');
