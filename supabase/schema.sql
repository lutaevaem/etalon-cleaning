-- Supabase schema for Etalon cleaning site
-- Run this in Supabase SQL Editor.

create table if not exists public.site_content (
  key text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key,
  object text,
  area text,
  frequency text,
  details text,
  contact text not null,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Optional: useful indexes for admin/search later.
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_contact_idx on public.leads (contact);

-- Storage bucket for site images.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

-- Public read policy for images.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read site-media'
  ) then
    create policy "Public read site-media"
    on storage.objects for select
    using (bucket_id = 'site-media');
  end if;
end $$;
