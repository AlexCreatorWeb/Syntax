-- Доп. права для таблиц прогресса (2026-09).
-- Postgres проверяет GRANT ДО RLS: политики own-rows есть, но привилегий
-- у роли authenticated нет → 42501 «permission denied for table task_progress».
-- (На lessons это же лечилось в fix-lessons-rls.sql; на новых таблицах — здесь.)

grant select, insert, update, delete on public.task_progress to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;

-- Проверка: под юзером curl rest/v1/task_progress?select=* → [] (не 403).
