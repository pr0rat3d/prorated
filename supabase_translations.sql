-- ============================================================
-- ProRated — Translation Cache Table
-- Run this in Supabase → SQL Editor
-- Stores translations so each review is only ever translated
-- once by the Claude API, then served free forever after.
-- ============================================================

create table if not exists translation_cache (
  id              uuid primary key default gen_random_uuid(),
  hash            text not null unique,
  original_text   text not null,
  translated_text text not null,
  lang            text not null default 'es',
  created_at      timestamptz default now(),
  hit_count       integer default 1
);

alter table translation_cache enable row level security;

-- Anyone can read translations (shared cache)
create policy "Anyone can read translations"
  on translation_cache for select using (true);

-- Anyone can insert translations
create policy "Anyone can insert translations"
  on translation_cache for insert with check (true);

-- Anyone can update hit count
create policy "Anyone can update translations"
  on translation_cache for update using (true);

-- Fast lookup by hash
create index if not exists translation_cache_hash_idx
  on translation_cache(hash);

create index if not exists translation_cache_lang_idx
  on translation_cache(lang);
