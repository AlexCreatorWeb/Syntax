# Урок 9. Связи: первичные, внешние ключи и формы 1:1, 1:N, N:M

## Цель

После урока студент сможет: проектировать связанные таблицы (PK/FK), выбирать форму связи (1:1, 1:N, N:M) под задачу, настраивать поведение при удалении (ON DELETE CASCADE/SET NULL) и читать ошибки внешних ключей.

## Теория

Реляционная модель строится на связях. Первичный ключ (PK) — «это кто» в таблице. Внешний ключ (FK) — колонка (набор колонок), ссылающаяся на PK другой таблицы: «на кого я ссылаюсь». Интегральная целостность: FK не может указать на несуществующую строку.

1:1 (один-к-один): профиль пользователя, детали заказа. Реализация: FK в «детальной» таблице + UNIQUE на нём (тогда связь точно 1:1, а не 1:N).

1:N (один-ко-многим) — самая частая: user → orders, order → order_items. FK лежит в «множественной» стороне (у заказов — user_id). Один user — много заказов; один заказ — ровно один user.

N:M (много-ко-многим): user ↔ roles, post ↔ tags. Реализация — связующая (pivot/junction) таблица с ДВУМЯ FK: user_roles (user_id, role_id), PK из пары. Метаданные (granted_at) — тоже в pivot.

«Где лежит FK» — золотое правило: в «множественной» стороне (таблице, у которой «много» связей). У одного заказа один автор (FK author_id в books); у одного автора много книг (не нужен «обратный» FK). Разметил FK «не в той» таблице — получил 1:1 вместо 1:N и дубли/пустоты в данных.

Поведение при удалении/смене FK-родителя:
- ON DELETE RESTRICT (по умолчанию): «родителя не удалить, пока есть дети».
- ON DELETE CASCADE: удалить родителя — удалились дети (копится «мусор», если не задумывался).
- ON DELETE SET NULL: у детей FK становится NULL (колонка должна быть nullable).
- ON UPDATE — то же для смены PK (почти всегда не трогаем, если PK — identity/UUID).

Выбор — по смыслу сущности: «удалить автора — удалить и книги?» (CASCADE), «удалить клиента — заказы остаются, поле owner обнуляется?» (SET NULL), «удалить продукт с заказами?» (RESTRICT — «сначала разберись с заказами»).

## Пример

```sql
CREATE TABLE authors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE books (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    isbn TEXT UNIQUE
);

CREATE TABLE book_tags (          -- N:M books <-> tags
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (book_id, tag)
);

INSERT INTO authors (name) VALUES ('Толкин', 'Льюис');
INSERT INTO books (author_id, title) VALUES (1, 'Хоббит'), (1, 'Властелин колец');
INSERT INTO books (author_id, title) VALUES (99, 'Дубль');   -- ошибка: FK
INSERT INTO book_tags VALUES (1, 'фэнтези'), (1, 'приключения'), (2, 'фэнтези');

DELETE FROM authors WHERE id = 1;   -- CASCADE: исчезнут и книги
```

## Частые ошибки

WARN: ON DELETE CASCADE «повсюду» — удалил пользователя, а вместе с ним заказы, платежи, логи. Реши по сущности: заказы обычно SET NULL (или сохраняются), а комментарии — CASCADE.

WARN: N:M через «массив ID» в таблице (tags TEXT[]) или «список в JSONB» — связь работает до первого запроса «все книги по тегу» (без индекса — полное сканирование). Pivot-таблица + индексы — норм.

WARN: 1:1 без UNIQUE на FK — через год «профиль» вдруг у двух юзеров (схема молча позволяет 1:N).

WARN: FK на «смягчённый» тип (INT на PK BIGINT) — неявные приведения ломают проверку/индексы. Типы FK и PK — одинаковые.

TIP: `\d books` — секция «Foreign keys» показывает ON DELETE-поведение сразу. Имя ограничения по умолчанию: books_author_id_fkey — в тексте ошибок.

## Практическое задание

1. Создай `students (id PK, full_name TEXT NOT NULL)`, `courses (id PK, title TEXT NOT NULL UNIQUE)`, `enrollments (student_id FK, course_id FK, enrolled_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (student_id, course_id))` (N:M).
2. Вставь 3 студентов, 3 курса, 4 записи.
3. Попробуй удалить студента, у которого есть записи (RESTRICT) — зафиксируй ошибку; добавь ON DELETE CASCADE через ALTER (DROP CONSTRAINT ... ADD CONSTRAINT) и повтори.
4. Запрос: студенты, записанные на 2+ курса (GROUP BY + HAVING).
5. Ответь письменно: когда 1:1 лучше хранить в ОДНОЙ таблице, а когда — в двух?

Файл `queries.sql` — заполни TODO.
