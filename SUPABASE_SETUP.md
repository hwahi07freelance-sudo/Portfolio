# Supabase Setup (Projects)

This portfolio can load projects from Supabase (and falls back to `projects.json` if Supabase isn’t configured).

## 1) Create the table

In Supabase SQL Editor, run:

```sql
create table if not exists public.projects (
  id int primary key,
  title text not null,
  description text,
  skills text[] not null default '{}',
  image text,
  link text,
  featured boolean not null default false,
  is_verified boolean not null default false,
  rating numeric,
  review_count int,
  reviews jsonb,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Allow anyone to read projects (safe for a portfolio).
drop policy if exists "public read projects" on public.projects;
create policy "public read projects"
on public.projects
for select
using (true);
```

## 1c) Availability status (optional)

If you want the CMS “Toggle Status” to work without PHP, create this table:

```sql
create table if not exists public.site_status (
  id int primary key,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_status enable row level security;

drop policy if exists "public read site status" on public.site_status;
create policy "public read site status"
on public.site_status
for select
using (true);

drop policy if exists "authenticated write site status" on public.site_status;
create policy "authenticated write site status"
on public.site_status
for all
to authenticated
using (true)
with check (true);

insert into public.site_status (id, available)
values (1, true)
on conflict (id) do nothing;
```

## 1b) Allow CMS writes (recommended: authenticated only)

If you want your **CMS page** to add/edit/delete projects in Supabase, the CMS must be able to write.

Recommended (safer): allow writes only for logged-in Supabase users:

```sql
drop policy if exists "authenticated write projects" on public.projects;
create policy "authenticated write projects"
on public.projects
for all
to authenticated
using (true)
with check (true);
```

Then create a Supabase user you’ll use only for the CMS:
Authentication -> Users -> Add user (email + password).

## 2) Add your Supabase keys to the site

Edit:
- [supabase-config.js](C:/Users/LENOVO/Desktop/Portfolio/js/supabase-config.js)

Set:

```js
window.SUPABASE_URL = "https://xxxxx.supabase.co";
window.SUPABASE_ANON_KEY = "your_anon_public_key";
```

These are in Supabase:
Project Settings -> API -> Project URL / anon public key

Important:
- Never paste a `sb_secret_...` key into the frontend. That is a server secret and must be rotated if exposed.

## 4) (Optional) Supabase Storage for images (works on Vercel)

If you want CMS image uploads to work on Vercel (no PHP), use Supabase Storage.

1. Storage -> Create bucket: `portfolio-images`
2. Make it Public (or keep private and use signed URLs).

For a public bucket, allow authenticated uploads:

```sql
-- Storage policies (bucket must exist)
drop policy if exists "authenticated upload portfolio images" on storage.objects;
create policy "authenticated upload portfolio images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-images');

drop policy if exists "authenticated update portfolio images" on storage.objects;
create policy "authenticated update portfolio images"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-images');
```

## 3) Put your project rows into Supabase

Quick options:

1. Add rows in Table Editor (simple and fine for a small portfolio).
2. Import a CSV into the `projects` table.

Notes:
- `skills` is a Postgres `text[]` (array)
- `reviews` is `jsonb` (optional)
- `image` can be a normal URL or a path like `images/your-image.png`
