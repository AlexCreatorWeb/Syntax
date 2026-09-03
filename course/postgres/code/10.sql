-- Урок 10: JOIN. Запуск: psql practice
DROP TABLE IF EXISTS stock, products CASCADE;

CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE stock (
    warehouse TEXT NOT NULL,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INT NOT NULL DEFAULT 0,
    PRIMARY KEY (warehouse, product_id)
);

INSERT INTO products (name, category) VALUES
    ('Кофе', 'напитки'), ('Чай', 'напитки'), ('Кружка', 'посуда'), ('Ложка', 'посуда');
INSERT INTO stock (warehouse, product_id, qty) VALUES
    ('А', 1, 10), ('А', 2, 5), ('Б', 1, 3), ('Б', 4, 8);

-- TODO: INNER — товары с остатками (name, warehouse, qty)

-- TODO: LEFT — все товары, qty = coalesce(..., 0)

-- TODO: FULL OUTER products × stock: пометь, с какой стороны «нет пары»

-- TODO: self-join — пары в одной категории (a.name < b.name)
