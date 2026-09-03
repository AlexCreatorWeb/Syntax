# Урок 11. Подзапросы, CTE и LATERAL

## Цель

После урока студент сможет: выбирать между IN/EXISTS/JOIN для «фильтра по другой таблице», писать CTE (WITH) — включая рекурсивные, и понимать LATERAL для «подзапрос на каждую строку».

## Теория

«Отфильтровать строки таблицы A по данным таблицы B» — три стиля:

IN: `WHERE dept_id IN (SELECT id FROM depts WHERE active)` — «id попадает в набор». С NULL в подзапросе — осторожно (IN с NULL — «неизвестно» для совпадений).

EXISTS: `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000)` — «существует ли хотя бы одна». Корреляция (ссылка на внешнюю таблицу) естественна; EXISTS часто быстрее IN на больших таблицах (выходит на первом совпадении).

JOIN: когда нужны КОЛОНКИ из B, а не просто фильтр — JOIN. «Только фильтр» — EXISTS/IN чище (нет риска дублей).

CTE (WITH): `WITH cte AS (SELECT ...) SELECT ... FROM cte` — именованный блок, читаемость + переиспользование. НЕ материализуется автоматически: оптимизатор «встраивает» (inline), если выгодно — CTE ≠ «материализованная таблица». RECURSIVE — рекурсия по графу (дерево каталога, иерархия сотрудников):

```
WITH RECURSIVE sub (id, parent_id, depth) AS (
  SELECT id, parent_id, 0 FROM nodes WHERE id = :root
  UNION ALL
  SELECT n.id, n.parent_id, s.depth + 1 FROM nodes n JOIN sub s ON n.parent_id = s.id
) SELECT * FROM sub;
```

LATERAL — «подзапрос для КАЖДОЙ строки слева», может ссылаться на предыдущие таблицы: `FROM users u, LATERAL (SELECT * FROM orders o WHERE o.user_id = u.id ORDER BY created_at DESC LIMIT 1) last` — «последний заказ каждого».

CTE и оптимизатор: до PG 12 CTE «автоматически материализовались» (медленнее, но предсказуемо). PG 12+ — inline по умолчанию (оптимизатор решает). Если нужен именно «разовый расчёт» — `WITH cte AS MATERIALIZED (...)`; если «подставить как подзапрос» — обычный WITH. Проверить — EXPLAIN: «CTE Scan» (материализован) vs «встроен в план».

## Пример

```sql
CREATE TABLE depts (id INT PRIMARY KEY, name TEXT, active BOOLEAN);
CREATE TABLE staff (id INT PRIMARY KEY, dept_id INT REFERENCES depts(id), salary INT);

INSERT INTO depts VALUES (1, 'IT', TRUE), (2, 'HR', FALSE);
INSERT INTO staff VALUES (1, 1, 90000), (2, 1, 70000), (3, 2, 50000);

-- EXISTS: сотрудники активных департаментов
SELECT s.* FROM staff s
WHERE EXISTS (SELECT 1 FROM depts d WHERE d.id = s.dept_id AND d.active);

-- CTE: средняя зарплата по департаментам, затем выше средней
WITH avg_by_dept AS (
    SELECT dept_id, avg(salary) AS avg_sal FROM staff GROUP BY dept_id
)
SELECT s.name IS NOT NULL AS has_name, s.salary, a.avg_sal
FROM staff s JOIN avg_by_dept a ON a.dept_id = s.dept_id
WHERE s.salary > a.avg_sal;

-- LATERAL: «последняя зарплатная запись каждого» (аналог)
SELECT s.id, last.max_sal FROM staff s,
LATERAL (SELECT max(salary) AS max_sal FROM staff s2 WHERE s2.dept_id = s.dept_id) last;
```

## Частые ошибки

WARN: `IN (подзапрос с NULL)`: если подзапрос вернёт хотя бы один NULL, строки «похожие на NULL» поведут себя как unknown — результат «честно странный». Для nullable-списков — EXISTS или INTERSECT.

WARN: Дубли из JOIN, когда нужен только фильтр: `SELECT u.* FROM users u JOIN orders o ON ...` вернёт пользователя по разу на заказ. Фильтр — EXISTS; данные — JOIN + агрегация.

WARN: «CTE = материализован, быстро» — нет: оптимизатор может встроить CTE в каждый референс (крупный subquery × N мест = медленнее). Если нужна именно материализация — `WITH ... AS MATERIALIZED`.

WARN: Рекурсивный CTE без условия остановки (cycle) — бесконечность/лимит depth. Добавляй `WHERE depth < N` или cycle-detection (PG 14+: `CYCLE`-синтаксис).

TIP: LATERAL + «топ-N на группу» — канонический паттерн; альтернатива — оконная ROW_NUMBER (урок 12).

## Практическое задание

1. Создай `regions (id PK, name)`, `cities (id PK, region_id FK, population INT)`, `logs (id PK, city_id FK, level TEXT, ts TIMESTAMPTZ)`. Данные: 2 региона, 3 города, 8 логов.
2. EXISTS: города, у которых были логи level='error'.
3. CTE: средний population по регионам; города выше среднего (через CTE, не подзапросом в FROM).
4. LATERAL: для каждого региона — последний по ts лог его городов (1 строка на регион).
5. Ответь письменно: когда EXISTS лучше IN, а когда JOIN лучше обоих?

Файл `queries.sql` — заполни TODO.
