create table if not exists public.site_content (
    content_key text primary key,
    content_value text not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.admin_users where id = auth.uid()
    );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content"
on public.site_content for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view their access" on public.admin_users;
create policy "Admins can view their access"
on public.admin_users for select
to authenticated
using (id = auth.uid());

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view site images" on storage.objects;
create policy "Public can view site images"
on storage.objects for select
to public
using (bucket_id = 'site-images');

drop policy if exists "Admins can upload site images" on storage.objects;
create policy "Admins can upload site images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "Admins can update site images" on storage.objects;
create policy "Admins can update site images"
on storage.objects for update
to authenticated
using (bucket_id = 'site-images' and public.is_admin())
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "Admins can delete site images" on storage.objects;
create policy "Admins can delete site images"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-images' and public.is_admin());
