# Урок 8. Агрегация: GROUP BY, HAVING, FILTER

## Цель

После урока студент сможет: группировать строки и считать агрегаты (COUNT/SUM/AVG/MIN/MAX), фильтровать группы через HAVING, использовать условные агрегаты (FILTER (WHERE ...)) и понимать NULL в агрегатах.

## Теория

Агрегатная функция сворачивает N строк в одну: COUNT (строк/значений), SUM, AVG, MIN, MAX. Без GROUP BY — по всей выборке (одна строка результата). С GROUP BY col — по каждой группе значений col: SELECT-список обязан содержать либо col из GROUP BY, либо агрегат.

Порядок «мысленной» обработки запроса: WHERE (фильтр строк) → GROUP BY (группировка) → HAVING (фильтр групп) → SELECT → ORDER BY. Ключевое: WHERE срабатывает ДО группировки (нельзя в WHERE писать COUNT > 5 — агрегатов ещё нет), HAVING — ПОСЛЕ.

COUNT: COUNT(*) — все строки группы; COUNT(col) — только НЕ-NULL значения (NULL не считается); COUNT(DISTINCT col) — уникальных значений. SUM/AVG «пропускают» NULL: AVG по [10, NULL, 20] = 15, а не ошибка. Для «заполнить NULL» — COALESCE(col, 0) внутри агрегата: SUM(COALESCE(amount, 0)).

FILTER (WHERE ...) — условный агрегат, коренная фича PG/SQL:2003: `COUNT(*) FILTER (WHERE paid)` — «считать, но только строки, где paid». Частый паттерн «сколько всего и сколько оплаченных» без само-JOIN и CASE-конструкций. Универсальная альтернатива: `SUM(CASE WHEN paid THEN 1 ELSE 0 END)` — работает везде, но FILTER чище.

Порядок WHERE/HAVING на примере: «средний чек по регионам, только регионы с 10+ заказами» — WHERE фильтрует строки ДО группировки (например, «только paid-заказы»), HAVING — группы ПОСЛЕ (HAVING count(*) >= 10). Путаешь — получаешь либо ошибку (агрегат в WHERE), либо «не тот» результат.

## Пример

```sql
CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    region TEXT NOT NULL,
    product TEXT NOT NULL,
    amount NUMERIC(10, 2),
    paid BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO sales (region, product, amount, paid) VALUES
    ('МСК', 'Кофе', 45.00, TRUE),
    ('МСК', 'Чай', 19.00, FALSE),
    ('СПБ', 'Кофе', 45.00, TRUE),
    ('СПБ', 'Сахар', NULL, TRUE),
    ('МСК', 'Кофе', 50.00, TRUE);

-- выручка по регионам:
SELECT region, count(*) AS rows, sum(amount) AS revenue, avg(amount) AS avg_amount
FROM sales GROUP BY region ORDER BY revenue DESC NULLS LAST;

-- только регионы с выручкой > 50:
SELECT region, sum(amount) FROM sales GROUP BY region HAVING sum(amount) > 50;

-- всего продаж и оплаченных (одним запросом):
SELECT region,
       count(*) AS total,
       count(*) FILTER (WHERE paid) AS paid_cnt
FROM sales GROUP BY region;
```

## Частые ошибки

WARN: Писал «WHERE count(*) > 10» — ошибка «aggregate functions are not allowed in WHERE». Фильтр групп — только HAVING (WHERE — до группировки, агрегатов ещё нет).

WARN: В SELECT без GROUP BY — агрегат + обычная колонка (SELECT region, count(*) FROM sales) — ошибка. Либо добавь GROUP BY region, либо уберешь колонку.

WARN: AVG/SUM «молча игнорируют» NULL — метрика «средний чек» на полпути заполненных данных завышена/занижена. Реши осознанно: COUNT(col) vs COUNT(*), COALESCE(col, 0) в SUM.

WARN: GROUP BY 1 (по позициям) работает, но нечитаемый; при добавлении колонки в SELECT «поломка» неочевидная. Пиши имена колонок.

WARN: «Одна строка на группу» через JOIN к агрегированной подзапросу — дубли при «много-к-одному» (JOIN «раскачивает» строки). Для «1 значение на группу» — агрегат или оконная функция (урок 12).

TIP: `GROUP BY ALL` (PG 17+) группирует по всем неагрегированным колонкам SELECT — меньше дублирующихся списков.

## Практическое задание

1. Создай `reviews (id identity PK, user TEXT NOT NULL, service TEXT NOT NULL, rating INT CHECK (rating BETWEEN 1 AND 5), helpful INT, created_at TIMESTAMPTZ DEFAULT now())`, вставь 10 строк (2 с helpful = NULL, разные rating, включая 1–2 NULL в rating).
2. Средний rating и количество по сервисам (HAVING: только сервисы с 2+ отзывами).
3. По каждому user: всего отзывов и сколько с rating >= 4 (FILTER).
4. Сумма helpful по сервисам — и объясни письменно, как NULL в helpful влияет на сумму.
5. Ответь письменно: чем `COUNT(rating)` отличается от `COUNT(*)` на твоих данных? Покажи значения.

Файл `queries.sql` — заполни TODO.
