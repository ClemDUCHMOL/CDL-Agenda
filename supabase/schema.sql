-- ============================================================================
-- Schéma SQL — Application "Agenda de disponibilités"
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor), en une seule fois.
-- ============================================================================

-- Extension nécessaire pour gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table des paramètres (une seule ligne, id fixe = 1)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id smallint primary key default 1,
  show_weekends boolean not null default true,
  holiday_zone text not null default 'metropole'
    check (holiday_zone in ('metropole', 'alsace_moselle')),
  holiday_behavior text not null default 'normal'
    check (holiday_behavior in ('normal', 'auto_unavailable')),
  evening_start_hour smallint not null default 17
    check (evening_start_hour between 0 and 23),
  header_logo_enabled boolean not null default false,
  header_title_enabled boolean not null default false,
  header_photo_enabled boolean not null default false,
  header_qr_enabled boolean not null default false,
  title_text text not null default '',
  logo_path text,
  photo_path text,
  qr_mode text not null default 'generated'
    check (qr_mode in ('uploaded', 'generated')),
  qr_link text,
  qr_image_path text,
  updated_at timestamptz not null default now(),
  constraint settings_single_row check (id = 1)
);

insert into public.settings (id)
values (1)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Table des exceptions de créneaux
--    (regroupe à la fois les indisponibilités manuelles ET les exceptions
--     "rendre disponible" qui priment sur la règle automatique des jours
--     fériés — distinction faite via la colonne `type`)
-- ----------------------------------------------------------------------------
create table if not exists public.slot_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  slot text not null check (slot in ('morning', 'afternoon', 'evening')),
  type text not null check (type in ('unavailable', 'available_override')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, slot)
);

create index if not exists slot_exceptions_date_idx on public.slot_exceptions (date);

-- Met à jour automatiquement updated_at à chaque modification
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_slot_exceptions_updated_at on public.slot_exceptions;
create trigger trg_slot_exceptions_updated_at
  before update on public.slot_exceptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
--    - Lecture publique (aucune authentification requise) sur les deux tables.
--    - Écriture réservée aux utilisateurs authentifiés (le compte admin).
-- ----------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.slot_exceptions enable row level security;

-- Lecture publique
create policy "public_read_settings" on public.settings
  for select using (true);

create policy "public_read_slot_exceptions" on public.slot_exceptions
  for select using (true);

-- Écriture réservée aux utilisateurs authentifiés
create policy "admin_update_settings" on public.settings
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_insert_slot_exceptions" on public.slot_exceptions
  for insert with check (auth.role() = 'authenticated');

create policy "admin_update_slot_exceptions" on public.slot_exceptions
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_delete_slot_exceptions" on public.slot_exceptions
  for delete using (auth.role() = 'authenticated');

-- Aucune policy d'insertion/suppression n'est créée pour `settings` :
-- la ligne unique est créée une fois ci-dessus et ne doit jamais être
-- supprimée ni dupliquée.

-- ----------------------------------------------------------------------------
-- 4. Temps réel : publication des changements sur les deux tables
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.slot_exceptions;

-- ----------------------------------------------------------------------------
-- 5. Storage : bucket public pour le logo, la photo et le QR code importé
--    (à créer aussi manuellement depuis l'interface si cette partie échoue,
--    voir les instructions de déploiement)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers du bucket
create policy "public_read_assets" on storage.objects
  for select using (bucket_id = 'public-assets');

-- Écriture (upload/remplacement/suppression) réservée aux utilisateurs authentifiés
create policy "admin_insert_assets" on storage.objects
  for insert with check (bucket_id = 'public-assets' and auth.role() = 'authenticated');

create policy "admin_update_assets" on storage.objects
  for update using (bucket_id = 'public-assets' and auth.role() = 'authenticated')
  with check (bucket_id = 'public-assets' and auth.role() = 'authenticated');

create policy "admin_delete_assets" on storage.objects
  for delete using (bucket_id = 'public-assets' and auth.role() = 'authenticated');
