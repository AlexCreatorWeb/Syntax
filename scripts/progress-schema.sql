-- Прогресс студента в Supabase (2026-09).
-- Две таблицы, обе «под существующую таблицу lessons»:
--   lesson_progress.lesson_id → lessons.id (uuid) — «урок курса выполнен»
--   task_progress.task_id     → id задачи из каталога (text: "js-001", "html-003", …)
--                               — «задача решена» (XP фиксируется в момент выполнения)
-- РLS: строки видит/пишет только владелец (auth.uid()); anon — пусто.
-- Frontend (src/lib/db-progress.js): при входе DB → localStorage (merge),
-- при каждом выполнении — upsert строки (fire-and-forget); гостевые бакеты
-- выгружаются в БД при первом входе (наследование, как с XP).

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  xp int not null default 0,
  completed_at timestamptz not null default now(),
  unique (user_id, task_id)
);

alter table lesson_progress enable row level security;
alter table task_progress enable row level security;

create policy "lesson_progress_own" on lesson_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_progress_own" on task_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Индексы под типовые запросы (прогресс пользователя, курс-прогресс по tech)
create index if not exists lesson_progress_user_idx on lesson_progress (user_id);
create index if not exists task_progress_user_idx on task_progress (user_id);

-- Проверка (в SQL Editor Supabase):
--   select count(*) from lesson_progress;   -- строки появятся после первого
--   select count(*) from task_progress;     -- выполнения авторизованным студентом
