-- Our Scrapbook: tables, access rules and photo storage.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run again.
--
-- Access model: only accounts listed in public.members can read or write anything.
-- (Sign-ups are off, but this keeps the scrapbook private even if they were turned on.)
-- The seed script (npm run db:seed) adds both of you to members.

-- ---------- who's allowed ----------
create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.members where user_id = (select auth.uid()));
$$;
revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

drop policy if exists "members can see members" on public.members;
create policy "members can see members" on public.members
  for select to authenticated using (public.is_member());

-- ---------- the scrapbook ----------
-- Each row holds one folder / memory / card as JSON, exactly the shapes in src/lib/types.ts
-- and src/lib/card-schema.ts, so the app and the database never drift apart.
create table if not exists public.folders (
  id text primary key,                       -- folder slug
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
create table if not exists public.memories (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);
create table if not exists public.cards (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['folders', 'memories', 'cards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('drop policy if exists "members only" on public.%I', t);
    execute format('create policy "members only" on public.%I for all to authenticated using (public.is_member()) with check (public.is_member())', t);
    -- "Automatically expose new tables" is off, so grant access explicitly: signed-in users (checked by the policy above) and the seed script.
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;

grant select on public.members to authenticated;
grant select, insert, update, delete on public.members to service_role;
revoke all on public.members from anon;

-- ---------- photos & card art ----------
-- Private bucket: images are only reachable through short-lived signed links handed to members.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scrapbook', 'scrapbook', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members read scrapbook images" on storage.objects;
create policy "members read scrapbook images" on storage.objects
  for select to authenticated using (bucket_id = 'scrapbook' and public.is_member());
drop policy if exists "members add scrapbook images" on storage.objects;
create policy "members add scrapbook images" on storage.objects
  for insert to authenticated with check (bucket_id = 'scrapbook' and public.is_member());
drop policy if exists "members replace scrapbook images" on storage.objects;
create policy "members replace scrapbook images" on storage.objects
  for update to authenticated using (bucket_id = 'scrapbook' and public.is_member()) with check (bucket_id = 'scrapbook' and public.is_member());
drop policy if exists "members remove scrapbook images" on storage.objects;
create policy "members remove scrapbook images" on storage.objects
  for delete to authenticated using (bucket_id = 'scrapbook' and public.is_member());
