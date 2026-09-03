# Урок 10. JOIN: объединение таблиц на практике

## Цель

После урока студент сможет: писать INNER/LEFT/RIGHT/FULL JOIN с наглядным пониманием «что остаётся», делать self-join, не плодить дубли в LEFT JOIN и читать планы JOIN'ов (урок 16).

## Теория

JOIN «склеивает» строки двух таблиц по условию. Геометрия (строки A × строки B):

INNER JOIN — только «встречи»: строки, у которых есть партнёр по условию. Сироты обеих сторон отбрасываются.

LEFT JOIN — все строки левой таблицы + партнёры из правой (нет партнёра — NULL в правых колонках). RIGHT JOIN — зеркало (в PG обычно пишут LEFT и меняют порядок таблиц).

FULL OUTER JOIN — все строки обеих таблиц; нет пары — NULL в «пустой» стороне.

Cross join (CROSS JOIN / «без ON») — декартово произведение: N×M строк. Редко нужен осознанно (генерация сеток); случайно в WHERE вместо ON — классический «взрыв» результата. «Замысел» cross join: «все комбинации» (например, «каждый клиент × каждый месяц» для отчётов с «дырами» в данных).

Self-join — таблица с самой собой по разным псевдонимами: «сотрудники и их руководители». Обязательные псевдонимы (s1, s2) — иначе «какая таблица».

Синтаксическая форма: `FROM a [INNER] JOIN b ON condition` / `FROM a LEFT JOIN b ON condition`. INNER — слово INNER можно опустить (JOIN = INNER JOIN). Порядок таблиц в LEFT JOIN имеет значение («левая» — та, что «сохраняется целиком»).

Порядок и псевдонимы: `FROM a JOIN b ON a.id = b.a_id` — условие в ON, а не WHERE (для INNER разницы нет; для LEFT — критично: условие правой таблицы в WHERE превращает LEFT в INNER!). Псевдонимы (AS u, AS o) — короткие имена, обязательны при self-join и при одноимённых колонках (a.id vs b.id).

Анти-паттерн «JOIN через JOIN»: если тебе нужен «только фильтр» по второй таблице — EXISTS (урок 11) проще и без риска дублей. JOIN — когда нужны КОЛОНКИ второй таблицы в результате.

## Пример

```sql
CREATE TABLE users (id INT PRIMARY KEY, name TEXT);
CREATE TABLE orders (id INT PRIMARY KEY, user_id INT REFERENCES users(id), total INT);

INSERT INTO users VALUES (1, 'Аня'), (2, 'Игорь'), (3, 'Мария');
INSERT INTO orders VALUES (10, 1, 100), (11, 1, 50), (12, 3, 200);

-- все заказы с именами (INNER): Игорь пропадет (заказов нет)
SELECT u.name, o.id, o.total FROM orders o JOIN users u ON u.id = o.user_id;

-- все пользователи + их заказы (нет заказов — NULL):
SELECT u.name, o.id AS order_id, coalesce(o.total, 0) AS total
FROM users u LEFT JOIN orders o ON o.user_id = u.id ORDER BY u.id;

-- self-join: «кто кого опережает по сумме»
SELECT a.name AS first, b.name AS second
FROM users a JOIN users b ON a.name < b.name;

-- LEFT + условие правой таблицы в WHERE = де-факто INNER (ловушка):
SELECT u.name FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE o.total > 100;
-- сравни с: ... ON o.user_id = u.id AND o.total > 100
```

## Частые ошибки

WARN: Условие правой таблицы в WHERE у LEFT JOIN (WHERE o.total > 100) — строки без заказов отфильтровываются: LEFT стал INNER. Фикс — в ON (... AND o.total > 100).

WARN: «Дубли из JOIN»: одна таблица с 3 заказами × таблица с 2 тегами = 6 строк вместо 3. Агрегируй (GROUP BY) или собирай списки (ARRAY_AGG / JSONB_AGG) до JOIN.

WARN: Забыл ON и получил CROSS JOIN — миллион строк, сервер «повес». Если результат внезапно N×M — смотри условие соединения.

WARN: JOIN по nullable-колонке — строки с NULL «не встречаются» (NULL = NULL — unknown). Для «опциональной связи» — FULL JOIN или LEFT + IS NULL.

TIP: `EXPLAIN SELECT ...` (урок 16) показывает, каким планом выполняется JOIN (Hash Join / Nested Loop / Merge) — читай ещё до индексов.

## Практическое задание

1. Создай `products (id PK, name TEXT, category TEXT)`, `stock (warehouse TEXT, product_id FK, qty INT)`. Вставь: 4 товара (2 без остатков), остатки в 2 складах.
2. INNER: товары с остатками (имя + склад + qty).
3. LEFT: ВСЕ товары; у тех, что без остатков — qty = 0 через COALESCE.
4. FULL OUTER по «товары × склады»: где товар есть, а на складе нет — и наоборот (используй IS NULL для детекта стороны).
5. Self-join: пары товаров одной категории, где у первого name < name второго.

Файл `queries.sql` — заполни TODO.
