# Урок 6. WHERE и операторы: фильтрация и NULL

## Цель

После урока студент сможет: фильтровать строки (сравнения, IN, BETWEEN, LIKE/ILIKE, IS NULL/IS NOT NULL, IS DISTINCT FROM), понимать трёхзначную логику SQL с NULL и не терять строки в WHERE.

## Теория

WHERE — фильтр «какие строки вернуть»: `SELECT * FROM t WHERE условие`. Условия комбинируются через AND/OR/NOT (AND сильнее OR — сомнительные места бери в скобки).

Операторы сравнения: =, <, >, <=, >=, != (или <>). IN (список или подзапрос), BETWEEN a AND b (включительно!), IS [NOT] NULL.

LIKE — шаблон: `%` (любая последовательность), `_` (любой один символ). Чувствителен к регистру: `'А%' LIKE 'a%'` — false. ILIKE — без учёта регистра. ESCAPE — смена «спецсимвола» (по умолчанию \): `LIKE '%\\$%' ESCAPE '\\'` — «литеральный $». Для сложных полнотекстовых задач — pg_trgm / tsvector (позже).

NULL — «неизвестно», не «пустая строка» и не 0. Ключевое правило: любое сравнение с NULL (NULL = 5, NULL > 3, NULL != 5) даёт UNKNOWN — а UNKNOWN в WHERE ведёт себя как FALSE: строка не проходит фильтр. Поэтому «найти пустые» — только `IS NULL` / `IS NOT NULL` (и `IN (...)` не ловит NULL!).

IS DISTINCT FROM — сравнение, понимающее NULL: `a IS DISTINCT FROM b` — true, если значения разные ИЛИ ровно одно из них NULL. Полезно для «обновлений» и сравнений с опциональными полями.

Трёхзначная логика в табличке: true/false/unknown. AND/OR с unknown: `true AND unknown = unknown`, `false AND unknown = false`, `true OR unknown = true`, `false OR unknown = unknown`. В WHERE «проходит» только true — поэтому unknown (с NULL) всегда «выпадает» из результата. Понимание этой таблицы — половина всех «почему не находит» в SQL.

## Пример

```sql
CREATE TABLE products2 (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    price_cents INT,
    category TEXT
);

INSERT INTO products2 VALUES
    (1, 'Кофе', 4500, 'напитки'),
    (2, 'Чай', 1900, 'напитки'),
    (3, 'Кружка', 900, 'посуда'),
    (4, 'Сахар', NULL, 'продукты'),
    (5, 'Чай зелёный', 2100, 'напитки');

SELECT * FROM products2 WHERE price_cents BETWEEN 2000 AND 4500;
SELECT * FROM products2 WHERE category IN ('напитки', 'посуда');
SELECT * FROM products2 WHERE name ILIKE '%чай%';          -- «Чай», «Чай зелёный»
SELECT * FROM products2 WHERE price_cents IS NULL;          -- Сахар
SELECT * FROM products2 WHERE price_cents != 4500;          -- Сахар НЕ в результате! (NULL)
SELECT * FROM products2 WHERE price_cents IS DISTINCT FROM 4500; -- теперь и Сахар
```

## Частые ошибки

WARN: `WHERE col = ''` вместо `IS NULL` — «пустые» значения в SQL почти всегда NULL, и сравнение с пустой строкой их не найдёт. И наоборот: при импорте «пустые ячейки» могут оказаться '' — нормализуй данные (NULLIFY(''::text, ''::text)).

WARN: Забыл, что NULL «пропадает» из фильтров: `!= 5` не вернёт строку с NULL, `IN (1,2,3)` не вернёт NULL. Для «всё, кроме 5, включая неизвестные» — `col <> 5 OR col IS NULL`.

WARN: LIKE с '%' в начале шаблона (`%abc`) — индексы B-Tree не помогают (сканирование по всему столбцу). Для «поиск по слову» — ILIKE с pg_trgm/GIN или полнотекст.

WARN: Смешал AND/OR без скобок: `WHERE a = 1 OR b = 2 AND c = 3` — это `a = 1 OR (b = 2 AND c = 3)` (AND сильнее). Если «имелось в виду» другое — результат «честно не тот», без ошибки.

WARN: NOT NULL путают с «пустая строка»: NOT NULL запрещает только NULL; '' — валидное значение.

TIP: Отладка «почему не вернуло» — выводи условия по частям: `SELECT col, (col > 5) AS c1, (category IN (...)) AS c2 FROM t` и смотри, где появляется NULL.

## Практическое задание

1. Создай `employees (id identity PK, name TEXT NOT NULL, dept TEXT, salary INT, hired DATE)` и вставь 6 строк (у 1–2 salary = NULL, у 1 dept = NULL).
2. Запрос: все, кроме dept «IT» (включая строки с NULL в dept — подумай, как).
3. Запрос: имена, содержащие «ан» без учёта регистра.
4. Запрос: salary IS DISTINCT FROM 30000 — и объясни письменно, чем результат отличается от `salary <> 30000`.
5. Ответь письменно: почему `WHERE salary = salary` не находит строки с NULL?

Файл `queries.sql` — заполни TODO.
