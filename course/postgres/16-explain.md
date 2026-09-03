# Урок 16. EXPLAIN (ANALYZE, BUFFERS): чтение планов

## Цель

После урока студент сможет: читать план запроса (Seq Scan / Index Scan / Nested Loop / Hash Join), отличать «оценку» от «реальности» (ANALYZE), понимать BUFFERS/cost и оптимизировать медленный запрос по плану.

## Теория

EXPLAIN — план выполнения (как СУБД собирается делать запрос). Варианты:
- `EXPLAIN` — только план (оценки, без выполнения).
- `EXPLAIN (ANALYZE)` — выполняет и показывает РЕАЛЬНЫЕ времена/строки (cost — оценка, actual time — факт).
- `BUFFERS` — чтение/запись страниц (shared hit — из кэша; shared read — с диска).
- `WAL`, `TIMING` и другие флаги — для тонкой диагностики.

Узлы плана (сверху вниз = «что происходит последним/первым»):
- Seq Scan — полное сканирование таблицы (не «злой»: на маленькой таблице — оптимально).
- Index Scan / Index Only Scan — по индексу; Index Only — «данные в самом индексе» (INCLUDE/covering).
- Bitmap Index/Heap Scan — «много точек» по индексу (собирает страницы пачками).
- Nested Loop — «внешняя строка × внутренняя (по индексу)»: хорош при малой внешней + быстром внутреннем.
- Hash Join — «построить хэш правой, сканировать левую»: массовые JOIN'ы.
- Merge Join — «оба отсортированы, идём построчно»: когда сортировка уже есть.

Читаем: `cost=10.00..1234.56` (старт..итог, относительные единицы), `rows=1000` (оценка), `actual time=...` (факт), `loops=1` (сколько раз узел выполнялся — для Nested Loop). Красные флаги: «оценка 10000, факт 10» (статистика устарела — ANALYZE), «Seq Scan на 10 млн строк для 10 результатов», «Hash на 50 млн строк для 1 условия», «loops=100000 во внутренней части Nested Loop».

Порядок чтения: с низа плана вверх — «что делается первым» (сканы) → «что происходит дальше» (join/aggregation) → «что возвращается» (top). Время узла — «своё» (без детей), поэтому «общее время» = корневой узел.

## Пример

```sql
-- без EXPLAIN (оценки):
EXPLAIN SELECT count(*) FROM events WHERE user_id = 42;

-- с фактами и буферами:
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.name, count(o.id)
FROM users u JOIN orders o ON o.user_id = u.id
WHERE o.total > 1000
GROUP BY u.name;

-- «внутренности»: сколько строк реально прошло
EXPLAIN (ANALYZE, TIMING OFF)
SELECT * FROM events WHERE payload ->> 'plan' = 'pro';

-- «что видит оптимизатор»: стоимость плана
SET enable_hashjoin = off;   -- «сломать» hash join — увидеть альтернативу
EXPLAIN SELECT 1 FROM a JOIN b ON a.id = b.a_id;
SET enable_hashjoin = on;

-- статистика: «пересчитать» после изменений
ANALYZE events;
```

## Частые ошибки

WARN: Сравнивал cost «между запросами» как абсолютные секунды — cost относительный (зависит от настройки cost_per_io и т.п.). Для «сколько реально» — EXPLAIN (ANALYZE) → actual time.

WARN: EXPLAIN без ANALYZE на «пустой» таблице — «быстро», но в проде (с данными) — «медленно». Проверяй на реальном объёме (или хотя бы на копии с реалистичными данными).

WARN: Статистика устарела (много INSERT/DELETE) — оптимизатор «слеп»: оценка 10, факт 100000. `ANALYZE таблица` — лечит (автоанализ есть, но после большой партии — вручную).

WARN: «Всегда нужен индекс» — на маленькой/средней таблице Seq Scan быстрее (одна последовательная читка против N случайных). Смотри actual time, а не «тип скана».

TIP: `\timing` + `pg_stat_statements` (расширение) — топ медленных запросов в проде: `SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20`.

## Практическое задание

1. На `events` (10k): EXPLAIN (ANALYZE, BUFFERS) «3 последних user 7» — найди Index Scan.
2. Сделай запрос, гдеSeq Scan оптимален (SELECT count(*) FROM events) — и объясни письменно, почему «не надо» индекс.
3. JOIN users × orders (создай: users 1k, orders 100k): EXPLAIN план (Hash Join). Затем `SET enable_hashjoin=off` — сравни cost.
4. Вставь 50k строк в events, НЕ делая ANALYZE; EXPLAIN «count по user_id» — заметь «кривую» оценку; затем ANALYZE — повторись.
5. Ответь письменно: что значит `loops=3000` в узле Nested Loop? Почему это «плохо» для внутренней части?

Файл `queries.sql` — заполни TODO.
