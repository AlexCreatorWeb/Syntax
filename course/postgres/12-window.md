# Урок 12. Оконные функции: ROW_NUMBER, RANK, OVER (PARTITION BY)

## Цель

После урока студент сможет: писать оконные функции (не сворачивая строки!), делать «топ-N на группу», ранжирование (ROW_NUMBER/RANK/DENSE_RANK), бегущие суммы (running total) и разницу от предыдущей строки (LAG/LEAD).

## Теория

Агрегаты (GROUP BY) сворачивают N строк в одну. Оконные функции (window functions) считают значение «по окну» строк, но НЕ сворачивают: каждая строка остаётся в результате, просто получает дополнительные колонки. Синтаксис: `функция() OVER (PARTITION BY ... ORDER BY ...)`.

PARTITION BY — «группа для окна» (как GROUP BY, но без сворачивания); ORDER BY внутри OVER — порядок строк внутри окна.

Ранги: ROW_NUMBER — уникальный номер 1..N (при равенстве — произвольно «кто первым»); RANK — при равенстве «пропускает» (1,2,2,4); DENSE_RANK — без пропусков (1,2,2,3). Выбор: «топ-N уникальных» — ROW_NUMBER; «посевание с «пропущенными местами»» — RANK; «группы по равенству» — DENSE_RANK.

Накопления: SUM(...) OVER (ORDER BY ts) — бегущая сумма по отсортированному окну «от начала до текущей строки»; LAG(col, 1) / LEAD(col, 1) — предыдущая/следующая строка окна; FIRST_VALUE/LAST_VALUE — края (с рамкой ROWS BETWEEN UNBOUNDED PRECEDING AND ...). LAG без значения по умолчанию вернёт NULL на «первой» строке partition'а — это «маркер» начала.

«Топ-N на группу» — канонический паттерн: ROW_NUMBER() OVER (PARTITION BY group ORDER BY metric DESC), затем внешний WHERE rn <= N (CTE/подзапрос).

«Окно» — рамка строк, по которым идёт вычисление. По умолчанию (без рамки) — «все строки partition'а». Рамка (ROWS/RANGE BETWEEN ...) — «от X до Y строк вокруг текущей»: ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING — «текущая ± 1» (для скользящих средних). Для курса достаточно «до текущей строки включительно» (ORDER BY + накопление).

## Пример

```sql
CREATE TABLE scores (id INT PRIMARY KEY, player TEXT, game_date DATE, points INT);
INSERT INTO scores VALUES
    (1, 'Аня', '2026-01-01', 100), (2, 'Аня', '2026-01-02', 120),
    (3, 'Игорь', '2026-01-01', 120), (4, 'Игорь', '2026-01-02', 90),
    (5, 'Мария', '2026-01-01', 120);

-- топ-2 игрока по сумме очков:
WITH tot AS (SELECT player, sum(points) AS total FROM scores GROUP BY player)
SELECT player, total, rank() OVER (ORDER BY total DESC) AS rnk FROM tot;

-- бегущая сумма очков Ани по дням:
SELECT game_date, points,
       sum(points) OVER (PARTITION BY player ORDER BY game_date) AS running
FROM scores WHERE player = 'Аня';

-- «топ-1 игра на игрока» (крупнейший результат):
SELECT * FROM (
    SELECT s.*, row_number() OVER (PARTITION BY player ORDER BY points DESC) AS rn
    FROM scores s
) t WHERE rn = 1;

-- LAG: прирост очков к предыдущей дате:
SELECT player, game_date, points,
       points - lag(points) OVER (PARTITION BY player ORDER BY game_date) AS delta
FROM scores ORDER BY player, game_date;
```

## Частые ошибки

WARN: ROW_NUMBER при равенстве «меток» — выбор «первой» неопределённая (меняется между запусками при равных значениях). Нужна детерминированность — добавь второй столбец в ORDER BY (например, id).

WARN: Писал `WHERE rank() <= 2` прямо в запросе, который создаёт rank — ошибка (window в WHERE невидим). Обёртка: CTE/подзапрос, где rank считается, и внешний WHERE.

WARN: LAG без ORDER BY в OVER — «предыдущая строка» в случайном порядке. Окно БЕЗ ORDER BY = «все строки окна» (LAG/LAST_VALUE — не определены).

WARN: SUM OVER (ORDER BY ...) без PARTITION — «бегущая сумма по всей таблице» (огромное окно). Для «по группе» — PARTITION BY обязателен.

TIP: «Среднее по группе, приложенное к каждой строке» — `avg(col) OVER (PARTITION BY grp)` — без JOIN'а к агрегированной таблице.

## Практическое задание

1. Создай `payments (id PK, customer TEXT, ts TIMESTAMPTZ, amount NUMERIC(10,2))`, вставь 10 строк (3 клиента, разные суммы, 2 с одинаковой суммой).
2. Ренкиng клиентов по сумме (RANK и DENSE_RANK — сравни при равенстве).
3. Бегущая сумма по каждому клиенту во времени.
4. «Крупнейший платёж каждого клиента» через ROW_NUMBER (CTE).
5. LAG: разница между платежами каждого клиента; отметь первый платёж (LAG = NULL).

Файл `queries.sql` — заполни TODO.
