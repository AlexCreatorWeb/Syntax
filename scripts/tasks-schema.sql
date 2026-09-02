-- Таблица `tasks` — каталог задач Syntax (контент из src/content/tasks/*.json).
-- Создать ОДИН РАЗ в Supabase SQL Editor (как было с `lessons`).
-- RLS: anon — SELECT/INSERT/DELETE (паттерн lessons: без UPDATE → правка = DELETE+INSERT).
create table if not exists public.tasks (
  id text primary key,
  track text not null,
  category text,
  category_i18n jsonb,
  "order" int not null,
  title jsonb not null,
  prompt jsonb not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  minutes int not null,
  xp int not null,
  files jsonb not null,
  tests jsonb not null,
  setup text,
  hint jsonb,
  solution text default '',
  daily_challenge boolean default false,
  lesson_id text,
  status text default 'published',
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.tasks to anon, authenticated;

drop policy if exists "tasks anon read" on public.tasks;
create policy "tasks anon read" on public.tasks
  for select to anon using (true);

drop policy if exists "tasks anon insert" on public.tasks;
create policy "tasks anon insert" on public.tasks
  for insert to anon with check (true);

drop policy if exists "tasks anon delete" on public.tasks;
create policy "tasks anon delete" on public.tasks
  for delete to anon using (true);
