-- Hybrid Traders Academy beta: shared student accounts + lesson catalogue
-- Run this in Supabase Dashboard -> SQL Editor for your own project.
-- Do NOT put a Supabase service_role key in website HTML.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  video_url text not null,
  category text not null default 'My Methodology',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_published_sort_idx
  on public.lessons (published, sort_order, created_at desc);

-- Create a profile for each newly registered account. New accounts are students by default.
create or replace function public.handle_new_academy_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_academy on auth.users;
create trigger on_auth_user_created_academy
  after insert on auth.users
  for each row execute procedure public.handle_new_academy_user();

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;

-- Students can read their own profile. Admins can manage profiles.
drop policy if exists "read own profile or admin" on public.profiles;
create policy "read own profile or admin" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin updates profiles" on public.profiles
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Signed-in students can see published lessons; admins can see all lessons.
drop policy if exists "students read published lessons" on public.lessons;
create policy "students read published lessons" on public.lessons
for select to authenticated
using (
  published = true
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "admins insert lessons" on public.lessons;
create policy "admins insert lessons" on public.lessons
for insert to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "admins update lessons" on public.lessons;
create policy "admins update lessons" on public.lessons
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists "admins delete lessons" on public.lessons;
create policy "admins delete lessons" on public.lessons
for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- IMPORTANT: After you register your own account in Supabase Auth, promote only your account
-- by running the following query with your actual account email:
-- update public.profiles p
-- set role = 'admin'
-- from auth.users u
-- where p.id = u.id and u.email = 'YOUR-LOGIN-EMAIL-HERE';
