-- Урок 20: финальный проект «e-commerce». Запуск: psql practice (чистая база).
-- Схема: products, customers, orders, order_items, payments.
DROP TABLE IF EXISTS payments, order_items, orders, customers, products CASCADE;

-- 1) products (с JSONB-атрибутами)
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    attrs JSONB NOT NULL DEFAULT '{}'
);

-- 2) customers
CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 3) orders (customer_id FK RESTRICT)
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'shipped', 'done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) order_items (FK CASCADE, price-снимок)
CREATE TABLE order_items (
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    price NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- 5) payments (order_id UNIQUE)
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL
);

-- TODO: 6 продуктов (attrs: color/tags/weight), 4 клиента, 10 заказов
-- TODO: ~20 order_items (price = цена продукта НА МОМЕНТ — снимок), 7 платежей;
--       у 7+ заказов status='paid' (платеж => status paid)

-- TODO: (а) выручка по дням (по paid)
-- SELECT created_at::date, sum(amount) FROM payments p JOIN orders o ON o.id = p.order_id
-- WHERE o.status = 'paid' GROUP BY 1 ORDER BY 1;

-- TODO: (б) топ-5 клиентов по сумме
-- TODO: (в) средний чек: свой vs общий (окна, AVG OVER)
-- TODO: (г) новые vs возвращающиеся заказы (LAG по customer, ORDER BY created_at)

-- TODO: индексы (customer_id, created_at DESC), GIN (attrs) + EXPLAIN каждого отчёта
-- CREATE INDEX ON orders (customer_id, created_at DESC);
-- CREATE INDEX ON products USING GIN (attrs jsonb_path_ops);

-- Чек-лист: \d+ на все таблицы; EXPLAIN отчётов; ON DELETE-поведения.
