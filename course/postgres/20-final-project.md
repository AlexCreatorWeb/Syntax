# Урок 20. Финальный проект: e-commerce «с нуля до отчётов»

## Цель

После урока студент сможет: спроектировать связанную схему (каталог, заказы, платежи), наполнить её, добавить индексы и написать «реальные» отчёты (JOIN, агрегаты, окна, JSONB) — собрать всё, что было в курсе, в одном проекте.

## Теория

Проект — магазин: продукты (с JSONB-атрибутами), клиенты, заказы (1:N: клиент → заказы → позиции), платежи (1:1 к заказу). Пройдём путь: схема → данные → базовые запросы → «сложные» отчёты → индексы/EXPLAIN.

Ключевые решения (обсуждай их письменно — это и есть «проектирование»):
- PK: BIGINT identity (внутренние) — UUID не нужен (нет внешнего ID).
- Связи: orders.customer_id FK (ON DELETE RESTRICT — «не удаляй клиента с заказами»), order_items.order_id FK (CASCADE — «удалили заказ — удалились позиции»).
- Деньги: NUMERIC(12,2); «когда» — TIMESTAMPTZ.
- JSONB: атрибуты товара (color, weight, tags) — гибкая форма.
- Индексы: под отчёты (customer_id, created_at DESC; items.order_id; payments.order_id UNIQUE).

Отчёты курса в одном месте: «выручка по дням» (агрегат), «топ-5 клиентов» (окна), «средний чек vs свой» (окна + PARTITION), «новый клиент vs возвращающийся» (LAG), поиск по атрибутам (JSONB + GIN).

## Пример

Фрагмент схемы (полная — в `queries.sql`):

```sql
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    attrs JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped', 'done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    price NUMERIC(12, 2) NOT NULL,     -- «цена на момент заказа» (снимок)
    PRIMARY KEY (order_id, product_id)
);
```

Отчёт «топ-5 клиентов по сумме» (окна):

```sql
WITH totals AS (
    SELECT o.customer_name, sum(i.qty * i.price) AS spent
    FROM orders o JOIN order_items i ON i.order_id = o.id
    GROUP BY 1
)
SELECT customer_name, spent FROM totals ORDER BY spent DESC LIMIT 5;
```

## Частые ошибки

WARN: «Текущая цена» из products в отчётах по историческим заказам — цена меняется, история «плывёт». Снимок цены в order_items (price на момент заказа) — канонический паттерн.

WARN: FK «в обе стороны» (orders.customer_id и customers.last_order_id) — дублирование состояния, «рассинхрон» при UPDATE. Связь — в одной стороне; «последний заказ» — вычисляемый (запрос/триггер).

WARN: Нормализовал «до синяя кровь» (10 таблиц на 2 поля) — JOIN'ы «везде», а данные «мелкие». Для «атрибутов» — JSONB/одна колонка; для «сущностей» — таблицы.

WARN: Забыл CHECK (qty > 0, price >= 0) — «отрицательная цена» в проде. Ограничения — в схеме, а не «в доверии к коду».

TIP: Финальный чек-лист проекта: (1) \d+ на каждую таблицу (ограничения на месте), (2) EXPLAIN на 3 главных отчёта (нет Seq Scan на больших), (3) «что будет, если удалить» — ON DELETE поведение осмыслено, (4) деньги NUMERIC, время TIMESTAMPTZ.

## Практическое задание (проект)

1. Создай схему: products, customers (id, name, email UNIQUE), orders (customer_id FK RESTRICT), order_items (FK CASCADE, price-снимок), payments (order_id UNIQUE FK, method, amount).
2. Наполни: 6 продуктов (с attrs: color/tags/weight), 4 клиента, 10 заказов, ~20 позиций, платежи у 7.
3. Отчёты: (а) выручка по дням (по paid-заказам); (б) топ-5 клиентов по сумме; (в) средний чек по клиенту + «свой чек vs средний по всем» (окна); (г) «новые vs возвращающиеся» заказы (LAG по customer).
4. Индексы: (customer_id, created_at DESC), items.order_id, products GIN (attrs). EXPLAIN каждый отчёт — найди Seq Scan и реши: индекс или «так и надо».
5. Ответь письменно: 3 решения схемы + почему (FK-поведения, JSONB, price-снимок).

Файл `queries.sql` — каркас проекта с TODO.
