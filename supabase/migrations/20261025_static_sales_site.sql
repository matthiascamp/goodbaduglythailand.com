-- Run once in the Supabase SQL editor. The public site uses only the publishable key.
-- Create the owner in Authentication > Users, then add that user's UUID to admin_users.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_length check (length(key) between 1 and 100),
  constraint site_settings_value_length check (length(value) between 1 and 500)
);
alter table public.site_settings enable row level security;
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Owner manages site settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('paperwork_price_aud', '300'),
  ('consultation_price_aud', '79'),
  ('moving_price_aud', '199'),
  ('itinerary_price_aud', '69')
on conflict (key) do nothing;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_slug_length check (length(slug) between 1 and 120),
  constraint articles_title_length check (length(title) between 1 and 160),
  constraint articles_excerpt_length check (length(excerpt) between 1 and 320),
  constraint articles_body_length check (length(body) between 1 and 100000)
);
alter table public.articles enable row level security;
create policy "Public can read published articles" on public.articles for select to anon, authenticated using (published or public.is_admin());
create policy "Owner manages articles" on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create index if not exists articles_published_created_idx on public.articles (published, created_at desc);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  name text not null,
  email text not null,
  extension_type text not null default '',
  expiry_date text not null default '',
  location text not null default '',
  message text not null default '',
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  constraint enquiries_service_valid check (service in ('extension', 'consultation', 'moving', 'itinerary', 'other', 'plan')),
  constraint enquiries_name_length check (length(name) between 1 and 100),
  constraint enquiries_email_length check (length(email) between 3 and 200),
  constraint enquiries_extension_length check (length(extension_type) <= 200),
  constraint enquiries_expiry_length check (length(expiry_date) <= 100),
  constraint enquiries_location_length check (length(location) <= 200),
  constraint enquiries_message_length check (length(message) <= 2000),
  constraint enquiries_status_valid check (status in ('NEW', 'REPLIED', 'ARCHIVED'))
);
alter table public.enquiries enable row level security;
create policy "Visitors can send enquiries" on public.enquiries for insert to anon, authenticated
  with check (status = 'NEW' and length(name) > 0 and position('@' in email) > 1);
create policy "Owner reads and manages enquiries" on public.enquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

grant select on public.site_settings, public.articles to anon, authenticated;
grant select, insert, update, delete on public.site_settings, public.articles to authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;

-- The owner role must be assigned from the SQL editor, never from the browser:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = 'merv9280@gmail.com';
