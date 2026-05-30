-- Run this in Supabase SQL Editor.
-- It creates a simple public demo table for the app.

create table if not exists public.demo_requests (
  id bigint primary key generated always as identity,
  student_name text not null,
  class_name text not null,
  request text not null,
  created_at timestamptz not null default now()
);

alter table public.demo_requests enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.demo_requests to anon, authenticated;

create policy "Anyone can read demo requests"
on public.demo_requests
for select
to anon, authenticated
using (true);

create policy "Anyone can insert demo requests"
on public.demo_requests
for insert
to anon, authenticated
with check (
  length(trim(student_name)) > 0
  and length(trim(class_name)) > 0
  and length(trim(request)) > 0
);

insert into public.demo_requests (student_name, class_name, request)
values
  ('Aarav', 'Class 11', 'Need help with vectors and dot product.'),
  ('Meera', 'Class 12', 'Please upload a revision worksheet for electrostatics.')
on conflict do nothing;
