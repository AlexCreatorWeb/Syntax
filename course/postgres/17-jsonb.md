# Урок 17. JSONB: операторы, индексы, когда уместен

## Цель

После урока студент сможет: хранить и читать JSONB (операторы ->, ->>, #>), искать по вложенным полям, индексировать (GIN, jsonb_path_ops) и осознанно выбирать между «колонкой» и «JSONB».

## Теория

JSON — текстовый формат; JSONB — бинарное представление: поля пересортированы, дубли убраны, «быстрее» для чтения/поиска (цена — вставка дороже). Хранит любой валидный JSON: объекты, массивы, скаляры.

Операторы:
- `col->'key'` — JSON-значение (JSONB).
- `col->>'key'` — текст (TEXT) — для сравнений/фильтров.
- `col->'a'->'b'` / `col#>'{a,b}'` — вложенные пути.
- `col->'arr'->>0` — элементы массива по индексу.
- `col @> '{"k": v}'` — «содержит» (subset): meta содержит объект {"plan":"pro"} (в точности, с типами).
- `col ? 'key'` — «есть ли ключ».
- `jsonb_build_object('k', v)` / `jsonb_array_elements()` — генерация/разбор.
- `col - 'key'` — «убрать ключ» (обновление поля: `meta = meta || '{"x": 1}'::jsonb` — «слить»).

Индексы: B-Tree на выражении (`CREATE INDEX ON t ((meta->>'email'))`) — для точного поля; GIN (`USING GIN (meta)` — для @>, ?; `jsonb_path_ops` — компактный, только @>) — для «содержания».

Когда JSONB уместен: «гибкая» форма (атрибуты товаров, события, конфигурации), где схема «неизвестна заранее» и запросы — по нескольким ключевым полям. Когда — нормальная колонка: поле участвует в FK/JOIN'ах, в частых сортировках, в строгих ограничениях (CHECK). Правило: «если по этому полю JOIN/сортировка/ограничение — колонка; если «просто данные» и редкие точечные запросы — JSONB».

## Пример

```sql
CREATE TABLE products3 (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    attrs JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO products3 (name, attrs) VALUES
    ('Кружка', '{"color": "red", "size": 330, "tags": ["керамика", "подарок"]}'),
    ('Тарелка', '{"color": "white", "size": 250, "tags": ["керамика"]},
    ('Носки', '{"size": 42, "tags": ["текстиль"], "promo": true}');

-- точное поле:
SELECT * FROM products3 WHERE attrs ->> 'color' = 'red';
-- вложенное:
SELECT * FROM products3 WHERE attrs #> '{tags}' ? 'керамика';  -- или array_contains
-- «содержит»:
SELECT * FROM products3 WHERE attrs @> '{"size": 330}';
-- обновление поля:
UPDATE products3 SET attrs = attrs || '{"new": true}' WHERE id = 1;
-- «убрать» ключ:
UPDATE products3 SET attrs = attrs - 'new' WHERE id = 1;

CREATE INDEX idx_p3_attrs ON products3 USING GIN (attrs jsonb_path_ops);
CREATE INDEX idx_p3_color ON products3 ((attrs ->> 'color'));
EXPLAIN (ANALYZE) SELECT * FROM products3 WHERE attrs @> '{"size": 330}';
```

## Частые ошибки

WARN: Сравнивал `attrs->'size' = 330` (JSONB с INT) vs `attrs->>'size' = '330'` (TEXT) — типы! `->>` возвращает текст: `= 330` приведёт строку к числу (работает), но `attrs->'size' = '330'` (JSONB vs текст) — ошибка/сюрприз. Единый стиль: для фильтра — `->>`, для JSON-значений — `->`.

WARN: JSONB «вместо таблицы» для сущностей с JOIN'ами: «найти все заказы с планом pro и показать пользователя» — FK через JSONB не работает. Гибкое поле — для атрибутов, а не для связей.

WARN: GIN без jsonb_path_ops на «больших» документах — индекс раздут (индексирует все пути); для @>-запросов — jsonb_path_ops.

WARN: `UPDATE ... SET attrs = attrs || ...` без `WHERE` — «перезаписал» миллион строк (каждая = новый JSONB-объект, WAL раздувается).

TIP: Валидация JSONB-формы — CHECK с `jsonb_path_query`: `CONSTRAINT attrs_has_color CHECK (attrs ? 'color')` (PG 16+: `CHECK (jsonb_path_exists(attrs, '$.color'))`).

## Практическое задание

1. Создай `items (id PK, title TEXT, meta JSONB)`, вставь 5 строк (у 3 — meta->>'category'='tech', у 2 — 'home'; у 1 — tags-массив).
2. Запрос: все из category='tech', отсортированные по meta->>'price' (число!).
3. Запрос через @>: «найти те, что имеют promo=true».
4. GIN (jsonb_path_ops) + B-Tree expression на (meta->>'category'); EXPLAIN оба запроса — какой индекс сработал.
5. Ответь письменно: в каком случае JSONB хуже, чем 2-3 обычные колонки? Приведи пример запроса, который «споткнётся».

Файл `queries.sql` — заполни TODO.
