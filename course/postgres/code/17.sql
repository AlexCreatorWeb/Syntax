-- Урок 17: JSONB. Запуск: psql practice
DROP TABLE IF EXISTS items;
CREATE TABLE items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'
);
INSERT INTO items (title, meta) VALUES
    ('Ноутбук',   '{"category": "tech", "price": 99000, "tags": ["портативное", "мощное"]}'),
    ('Мышь',      '{"category": "tech", "price": 2500, "tags": ["периферия"], "promo": true}'),
    ('Кресло',    '{"category": "home", "price": 25000, "tags": ["офис"]}'),
    ('Лампа',     '{"category": "home", "price": 1900, "tags": ["свет", "умный дом"], "promo": true}'),
    ('Монитор',   '{"category": "tech", "price": 45000, "tags": ["периферия"]}');

-- TODO: category='tech', сортировка по price (число)
-- SELECT title, meta ->> 'price' AS price FROM items WHERE meta ->> 'category' = 'tech' ORDER BY price::numeric DESC;

-- TODO: @> — promo=true
-- SELECT * FROM items WHERE meta @> '{"promo": true}';

-- TODO: индексы + EXPLAIN
-- CREATE INDEX idx_items_meta ON items USING GIN (meta jsonb_path_ops);
-- CREATE INDEX idx_items_cat ON items ((meta ->> 'category'));
-- EXPLAIN (ANALYZE) SELECT * FROM items WHERE meta @> '{"promo": true}';
-- EXPLAIN (ANALYZE) SELECT * FROM items WHERE meta ->> 'category' = 'tech';

-- TODO: обновление/удаление поля
-- UPDATE items SET meta = meta || '{"new": true}' WHERE id = 1;
-- UPDATE items SET meta = meta - 'new' WHERE id = 1;
