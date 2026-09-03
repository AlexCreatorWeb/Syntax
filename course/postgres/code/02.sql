-- Урок 2: типы данных. Запуск: psql practice

-- TODO: создай таблицу складского учёта
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    qty INT NOT NULL CHECK (qty >= 0),
    cost NUMERIC(14, 3) NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TODO: вставь 3 строки (sku SKU-1..SKU-3, qty 5/12/7, cost 10.500/2.250/99.900)
INSERT INTO inventory (sku, qty, cost) VALUES ('SKU-1', 5, 10.500);

-- TODO: sku с наибольшим qty
-- (подсказка: ORDER BY qty DESC LIMIT 1)

-- TODO: вывод cost::int (целая часть) и qty::text
SELECT cost::int AS cost_int, qty::text AS qty_text FROM inventory;

-- TODO: проверь типы через \d inventory
