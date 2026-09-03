# Урок 15. Индексы: B-Tree, GIN, GiST и спец-формы

## Цель

После урока студент сможет: объяснять зачем индексы и их цену, выбирать тип (B-Tree/Hash/GIN/GiST), писать expression/partial/covering-индексы и понимать, когда индекс НЕ поможет.

## Теория

Индекс — «оглавление» таблицы: структура для быстрого поиска без полного сканирования. Цена: место + замедление INSERT/UPDATE/DELETE (индекс обновляется) + «соблазн» оптимизатора пойти по индексу, когда скан быстрее.

B-Tree (по умолчанию): =, <, >, BETWEEN, IS NULL, prefix LIKE 'abc%' (не '%abc'!), составные индексы (a, b, c) работают «слева направо» (a; a, b; a, b, c — но не b один). DESC-индексы: `CREATE INDEX ... ON t (ts DESC)` — для «последних N». B-Tree — «дефолтный» выбор: покрывает большинство запросов (равенство + диапазон + сортировка).

Hash: только = (и IN). Редко нужен (B-Tree покрывает равенство). Для «быстрого» равенства на «огромных» таблицах — можно, но B-Tree обычно достаточен.

GIN (Generalized Inverted Index): для «множественных значений в строке» — JSONB, массивы, полнотекст (tsvector). `CREATE INDEX ON t USING GIN (meta jsonb_path_ops)` — «найди строки, где meta->>'plan' = 'pro'».

GiST: геометрические типы (PostGIS), range-типы (tsrange: «пересечение интервалов»).

Спец-формы:
- Expression: `CREATE INDEX ON t (lower(email))` — для `WHERE lower(email) = 'x'` (без индекса функция «ломает» B-Tree).
- Partial: `CREATE INDEX ON t (user_id) WHERE status = 'active'` — индекс только на «активных» (маленький, горячий).
- Covering (INCLUDE): `CREATE INDEX ON t (user_id) INCLUDE (name, email)` — «индекс + данные», запрос закрывается индексом без обращения к таблице (Index Only Scan). INCLUDE-колонки не участвуют в поиске — только «лежат рядом».

## Пример

```sql
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO events (user_id, action, payload)
SELECT g, (ARRAY['login','buy','view'])[1 + g % 3], jsonb_build_object('plan', (ARRAY['free','pro'])[1 + g % 2])
FROM generate_series(1, 10000) g;

CREATE INDEX idx_events_user_created ON events (user_id, created_at DESC);   -- «история юзера»
CREATE INDEX idx_events_action ON events (action);
CREATE INDEX idx_events_user_active ON events (user_id) WHERE action = 'buy'; -- partial
CREATE INDEX idx_events_payload ON events USING GIN (payload jsonb_path_ops);
CREATE INDEX idx_events_user_cover ON events (user_id) INCLUDE (action);

EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM events WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
-- Index Only Scan / Index Scan — в зависимости от запроса
```

## Частые ошибки

WARN: Индекс «на всё» (каждую колонку, каждый JOIN-поле) — вставки замедляются в разы, а B-Tree на 10 колонках не поможет «смешанным» запросам. Индекс под запрос (EXPLAIN!), а не «про запас».

WARN: `WHERE created_at > now() - interval '1 day'` без индекса на created_at — Seq Scan на миллионах. А `WHERE upper(name) = 'X'` без expression-индекса — тоже Seq Scan.

WARN: Составной индекс (a, b) и запрос `WHERE b = 5` — индекс «не тот порядок» (B-Tree отсортирован по a первично). Нужен (b) отдельно или bitmap-скан.

WARN: GIN «вместо B-Tree» для скаляров — наоборот: GIN для множественных значений; для scalars — B-Tree.

TIP: `SELECT indexname, index_defn FROM pg_indexes WHERE tablename = 'events';` — список индексов таблицы; `\di+` — с размерами.

## Практическое задание

1. На `events` из примера (10k строк) сделай: составной (user_id, created_at DESC), partial (WHERE action='buy'), covering (user_id INCLUDE action).
2. `EXPLAIN (ANALYZE, BUFFERS)` запрос «10 последних событий user 42» — до и после составного индекса (Seq Scan → Index).
3. Найди события user 42 с action='buy' — убедись, что используется partial-индекс (Index Scan на idx ... active).
4. Создай GIN на payload; запрос `WHERE payload ->> 'plan' = 'pro'` — EXPLAIN (Bitmap).
5. Ответь письменно: зачем INCLUDE (covering)? Что такое Index Only Scan и когда он возможен?

Файл `queries.sql` — заполни TODO.
