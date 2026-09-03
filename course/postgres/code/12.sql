-- Урок 12: оконные функции. Запуск: psql practice
DROP TABLE IF EXISTS payments;

CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer TEXT NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);

INSERT INTO payments (customer, ts, amount) VALUES
    ('Аня',   now() - interval '9 days', 100.00),
    ('Аня',   now() - interval '6 days', 250.50),
    ('Аня',   now() - interval '1 day',  100.00),
    ('Игорь', now() - interval '8 days', 300.00),
    ('Игорь', now() - interval '2 days', 300.00),
    ('Мария', now() - interval '7 days', 50.25),
    ('Мария', now() - interval '3 days', 120.00),
    ('Мария', now() - interval '1 day',  120.00),
    ('Олег',  now() - interval '4 days', 999.99),
    ('Олег',  now() - interval '1 day',  999.99);

-- TODO: ранги клиентов по сумме (RANK и DENSE_RANK — сравни при равенствах)
-- TODO: бегущая сумма по клиенту (PARTITION BY customer ORDER BY ts)
-- TODO: крупнейший платёж каждого клиента (ROW_NUMBER + CTE, rn = 1)
-- TODO: LAG — разница с предыдущим платежом клиента
