-- Фикс «под юзером не отображаются уроки» (2026-09).
-- Причина (подтверждена JWT-запросом): lessons доступен только роли anon.
-- GRANT SELECT ON public.lessons TO authenticated отсутствует (PostgREST 42501:
-- «Grant the required privileges to the current role») → авторизованный
-- студент получает 403 → фронт скрывает секцию уроков (кэш/статичный fallback).
--
-- Примени в SQL Editor (идемпотентно; включает и прогресс-схему).

-- 1) Права + политика: уроки читает и авторизованный (контент общий)
grant select on public.lessons to authenticated;

create policy "lessons_select_authenticated" on public.lessons
  for select to authenticated using (true);

-- 2) Прогресс студента (та же схема, что в scripts/progress-schema.sql)
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  xp int not null default 0,
  completed_at timestamptz not null default now(),
  unique (user_id, task_id)
);

alter table public.lesson_progress enable row level security;
alter table public.task_progress enable row level security;

create policy "lesson_progress_own" on public.lesson_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_progress_own" on public.task_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id);
create index if not exists task_progress_user_idx on public.task_progress (user_id);

-- После применения: refresh страницы под юзером — секция «Lessons» и
-- roadmap-таймлайн вернутся (16 уроков HTML / 22 CSS / …).
