# Урок 18. Views, материализованные views и generated-колонки

## Цель

После урока студент сможет: создавать views (виртуальные «сохранные запросы»), материализованные views (кэш результата с REFRESH), generated columns (вычисляемые «на лету») — и выбирать инструмент под задачу.

## Теория

VIEW — «сохранённый SELECT»: имя, за которым лежит запрос. Каждый `SELECT FROM view` — выполняет базовый запрос «на лету» (встраивается оптимизатором). Плюсы: инкапсуляция (приложение видит «простую таблицу»), безопасность (GRANT на view, а не на базу), читаемость. Минус: «прослойка» — если базовый запрос медленный, view не «ускорит» (только «упростит»).

В view можно писать: JOIN'ы, агрегаты, оконные функции, CTE. Обновляемые views (INSERT/UPDATE «сквозь» view) — только простые (1 таблица, без агрегатов); сложные — read-only. DROP VIEW / DROP MATERIALIZED VIEW — удаление (данные базовых таблиц не трогаются).

MATERIALIZED VIEW — «результат, сохранённый на диске»: данные заморожены на момент CREATE/REFRESH. REFRESH MATERIALIZED VIEW — пересоздание (CONCURRENTLY — без блокировки чтения, нужен UNIQUE-индекс). Для «дорогих отчётов, которым 5 минут freshness хватает». Матview «занимает место» (дублирует данные) — это «цена» за скорость чтения.

GENERATED ALWAYS AS (expr) STORED / VIRTUAL — вычисляемая колонка: «хранится» (STORED) или «считается при чтении» (VIRTUAL — PG 18+; до — только STORED). Пример: `full_name GENERATED ALWAYS AS (first || ' ' || last) STORED`. Ограничение: выражение — immutable (now() нельзя). Generated-колонка «не принимается» из приложения (INSERT без неё) — только «производные» данные.

## Пример

```sql
CREATE TABLE emp (id INT PRIMARY KEY, dept TEXT, salary INT, hired DATE);
INSERT INTO emp VALUES (1, 'IT', 90000, '2022-01-01'), (2, 'IT', 70000, '2023-02-02'), (3, 'Sales', 55000, '2021-03-03');

-- обычный view: «сводка по департаментам»
CREATE VIEW dept_stats AS
SELECT dept, count(*) AS headcount, avg(salary) AS avg_sal
FROM emp GROUP BY dept;

SELECT * FROM dept_stats;
-- данные «живые»: изменение emp сразу видно

-- материализованный: «дорогой отчёт» (заморожен)
CREATE MATERIALIZED VIEW monthly_report AS
SELECT date_trunc('month', hired) AS m, dept, count(*)
FROM emp GROUP BY 1, 2;

REFRESH MATERIALIZED VIEW monthly_report;

-- generated column:
ALTER TABLE emp ADD COLUMN salary_month INT GENERATED ALWAYS AS (salary / 3) STORED;
SELECT id, salary, salary_month FROM emp;
```

## Частые ошибки

WARN: MATERIALIZED VIEW «как кэш, который сам обновляется» — нет: данные «замёрзнут» до REFRESH. Планируй REFRESH (cron/pg_cron) и думай о freshness.

WARN: REFRESH ... CONCURRENTLY без UNIQUE-индекса на матview — ошибка: «no unique or exclusion constraint». Создай индекс до первого CONCURRENTLY.

WARN: Generated column с now() / random() — ошибка: «generated column must contain only immutable expressions». Для «времени создания» — обычная колонка + DEFAULT now(). Generated-колонка «не видна» для INSERT (сервер считает сам) — это «защита» от «двойной правды».

WARN: GRANT на view «для безопасности» — убедись, что view не «раздаёт» больше, чем нужно (без WHERE — «весь стол»). Row-Level Security (RLS) — отдельная тема, но view-обёртка с фильтром — простой способ «ограниченного» доступа.

WARN: «Обновляемый» view на JOIN'е — ошибка (только простые views «принимают» INSERT/UPDATE). Для «обновления» — явный запрос к базовой таблице или функция.

TIP: `\dv` — список views (обычные + материализованные, с пометкой «m»); `\d+ view_name` — определение.

## Практическое задание

1. На `emp`: view `dept_avg` (dept, avg salary, count) — убедись, что после UPDATE emp view «обновился».
2. MATERIALIZED VIEW `hiring_by_month` (месяц, dept, count); REFRESH до/после вставки новой строки (до — «не видит», после REFRESH — видит).
3. Добавь UNIQUE-индекс на (m, dept) и REFRESH MATERIALIZED VIEW ... CONCURRENTLY.
4. Generated column `salary_band` = CASE по зарплате (low/mid/high) — STORED.
5. Ответь письменно: view vs материализованный vs «просто таблица + ETL-скрипт» — критерии выбора (freshness, стоимость, сложность).

Файл `queries.sql` — заполни TODO.
