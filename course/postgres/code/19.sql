-- Урок 19: функции и триггеры. Запуск: psql practice
DROP TABLE IF EXISTS audit_log, accounts2 CASCADE;
DROP FUNCTION IF EXISTS set_updated_at, top_balances CASCADE;

CREATE TABLE accounts2 (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO accounts2 (balance) VALUES (100), (250.50), (0);

-- TODO: функция set_updated_at (BEFORE UPDATE, RETURN NEW)
-- TODO: триггер trg_accounts2_updated

-- TODO: audit_log + AFTER INSERT/UPDATE/DELETE -> запись (table_name, row_id, action)
CREATE TABLE audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name TEXT NOT NULL,
    row_id BIGINT,
    action TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TODO: функция top_balances(k INT) RETURNS SETOF accounts2
-- (RETURN QUERY SELECT ... ORDER BY balance DESC LIMIT k)

-- Проверки:
UPDATE accounts2 SET balance = balance + 1 WHERE id = 1;  -- updated_at + audit
SELECT * FROM top_balances(2);
SELECT * FROM audit_log ORDER BY id;
