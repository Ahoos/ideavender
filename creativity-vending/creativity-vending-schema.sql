-- 창의성 자판기 Supabase Migration
-- Supabase Dashboard > SQL Editor에서 실행하세요.

create table if not exists public.creativity_vault (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  vending_type  text not null,
  keywords      jsonb not null default '[]'::jsonb,
  user_memo     text not null default '',
  ai_draft      text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.creativity_vault
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.creativity_vault
  add column if not exists ai_draft text not null default '';

create index if not exists creativity_vault_created_at_idx
  on public.creativity_vault (created_at desc);

create index if not exists creativity_vault_type_idx
  on public.creativity_vault (vending_type);

create index if not exists creativity_vault_user_created_at_idx
  on public.creativity_vault (user_id, created_at desc);

alter table public.creativity_vault enable row level security;

drop policy if exists "creativity_vault_public_select"
  on public.creativity_vault;

drop policy if exists "creativity_vault_public_insert"
  on public.creativity_vault;

drop policy if exists "creativity_vault_owner_select"
  on public.creativity_vault;

drop policy if exists "creativity_vault_owner_insert"
  on public.creativity_vault;

drop policy if exists "creativity_vault_owner_update"
  on public.creativity_vault;

create policy "creativity_vault_owner_select"
  on public.creativity_vault
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "creativity_vault_owner_insert"
  on public.creativity_vault
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "creativity_vault_owner_update"
  on public.creativity_vault
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.creativity_vault is
  '창의성 자판기에서 생성하고 저장한 계정별 아이디어 카드 보관함';

comment on column public.creativity_vault.user_id is
  '보관함 소유자. auth.users.id와 연결되며 RLS로 계정별 분리';

comment on column public.creativity_vault.vending_type is
  '자판기 유형: plot | plot2 | reels | solution';

comment on column public.creativity_vault.keywords is
  '자판기가 뽑은 키워드 배열';

comment on column public.creativity_vault.user_memo is
  '사용자가 입력한 아이디어 메모';

comment on column public.creativity_vault.ai_draft is
  '키워드와 메모를 바탕으로 생성한 기획안 초안';
