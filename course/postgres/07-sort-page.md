# Урок 7. Сортировка и пагинация: ORDER BY, LIMIT, keyset

## Цель

После урока студент сможет: сортировать по нескольким столбцам (ASC/DESC, NULLS FIRST/LAST), делать пагинацию OFFSET/LIMIT — и понимать, когда она ломается, и как работает «быстрая» keyset-пагинация.

## Теория

ORDER BY col [ASC|DESC] [NULLS FIRST|NULLS LAST] — сортировка. Без ORDER BY порядок строк НЕ гарантирован (может меняться между запросами, после индексов/параллелизма). Несколько столбцов: `ORDER BY dept, salary DESC` — сначала dept по возрастанию, внутри — salary по убыванию.

NULL в сортировке: по умолчанию ASC — NULL «в конце» (NULLS LAST), DESC — «в начале» (NULLS FIRST). Явное указание — NULLS FIRST/LAST.

Пагинация «страницами»: LIMIT n OFFSET k — «пропусти k, возьми n». Страница 3 по 20: LIMIT 20 OFFSET 40.

Проблема OFFSET: чтобы показать 20-ю страницу, СУБД сортирует ВСЁ и пропускает 380 строк — страница «глубоко» = O(всего). Для логов/лент на миллионах строк OFFSET 1000000 — боль.

Keyset (cursor) пагинация: «дай 20 строк после последней, которую я видел», по уникальному сортируемому ключу: `WHERE (created_at, id) < ('2026-01-15T10:00Z', 4217) ORDER BY created_at DESC, id DESC LIMIT 20`. Ограничение: нужен устойчивый ключ (id/created_at), «перейти на страницу 47» напрямую нельзя (только «вперёд/назад»).

Почему keyset «быстрый»: условие `id < X` закрывается индексом (seek в нужную точку), LIMIT — «взять N и остановиться». OFFSET — «пробежать k строк и выбросить». Разница — между O(N) и O(N+k).

DESC-сортировка + LIMIT — частый паттерн «последние N»: индексируется по (col DESC) — урок 15.

«Метка» сортировки: в SQL-результате без ORDER BY порядок строк — «как СУБД сочла нужным» (план: скан таблицы, скан индекса, параллелизм). После правки данных/индекса «тот же запрос» может вернуть «тот же набор» в другом порядке. Для «стабильного вывода» — всегда явный ORDER BY (при равенстве — доп. столбец, часто PK: ORDER BY created_at DESC, id DESC).

## Пример

```sql
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    kind TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO events (user_id, kind, created_at) SELECT g, 'click', now() - (g || ' seconds')::interval
FROM generate_series(1, 50) g;

-- последние 5 событий (DESC):
SELECT * FROM events ORDER BY created_at DESC LIMIT 5;

-- OFFSET-пагинация, страница 3 по 10:
SELECT * FROM events ORDER BY id LIMIT 10 OFFSET 20;

-- keyset: «ещё 10 после id=35» (вниз по ленте):
SELECT * FROM events WHERE id < 35 ORDER BY id DESC LIMIT 10;

-- NULL в сортировке:
SELECT x, x IS NULL AS is_null FROM (VALUES (3), (NULL), (1), (NULL), (2)) v(x)
ORDER BY x ASC NULLS LAST;
```

## Частые ошибки

WARN: Не указываешь ORDER BY, а в приложении «рассчитываешь на порядок» — после оптимизации/индекса порядок «перемешался», пользователи видят дубли/потери в ленте. Порядок без ORDER BY — случайный.

WARN: OFFSET-пагинация на глубоких страницах: поиск/сортировка всё равно по всей выборке. Для лент/историй — keyset по (created_at, id) с индексом.

WARN: Keyset по одной колонке с дублями (created_at у двух строк одинаковый) — при переходе страницы часть строк «скочит»/«дублируется». Композитный ключ (created_at, id) убирает дубли.

WARN: `ORDER BY` на вычисляемом выражении (`ORDER BY upper(name)`) — без выраженного индекса сортирует в памяти.

TIP: Для «последнее состояние» (max по группе) — оконные функции (урок 12): ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) — но и тут ORDER BY решает всё.

## Практическое задание

1. Создай `posts (id identity PK, title TEXT NOT NULL, author TEXT NOT NULL, score INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now() - (random() || ' days')::interval)`, вставь 25 строк.
2. «Топ-5 по score, при равенстве — новее сначала».
3. OFFSET-страница 2 по 5 (по created_at DESC).
4. Keyset: «ещё 5 постов после поста с id = X» (выбери свой X из шага 3).
5. Ответь письменно: почему в keyset-условии нужен и `created_at`, и `id`, а не только created_at?

Файл `queries.sql` — заполни TODO.
