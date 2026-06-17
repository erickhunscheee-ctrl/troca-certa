create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  image_url text,
  action_url text,
  action_label text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "Active events are public" on public.events;
create policy "Active events are public"
  on public.events
  for select
  using (active = true);

create index if not exists events_active_featured_starts_at_idx
  on public.events (active, featured desc, starts_at asc);

insert into public.events (
  title,
  description,
  location,
  starts_at,
  image_url,
  action_url,
  action_label,
  featured,
  active
) values (
  'Encontro de Trocas da Copa 2026',
  'Traga suas repetidas, encontre colecionadores perto de voce e complete seu album com mais velocidade.',
  'Shopping Central - Praca de Eventos',
  now() + interval '7 days',
  null,
  '/albums',
  'Ver albuns',
  true,
  true
) on conflict do nothing;
