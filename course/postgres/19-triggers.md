# Урок 19. Функции и триггеры (PL/pgSQL)

## Цель

После урока студент сможет: писать функции PL/pgSQL (RETURN, параметры, OUT), триггеры (BEFORE/AFTER, FOR EACH ROW) для бизнес-логики «рядом с данными», и понимать, когда логика — в триггере, а когда — в приложении.

## Теория

PL/pgSQL — процедурный язык внутри PG: функции (вызываемые) и триггеры (срабатывают «на событие»). Альтернативные языки существуют (PL/Python, PL/Perl, PL/Java), но PL/pgSQL — «из коробки» (без установки расширения) и «родной» для PG — его и используем.

Функция: CREATE FUNCTION name(args) RETURNS type AS $$ BEGIN ... END; $$ LANGUAGE plpgsql. Внутри — переменные, IF/CASE, циклы, EXECUTE SQL. RETURN / RETURN QUERY (множество строк) / RETURNING. Параметры: IN (по умолчанию), OUT, INOUT; STRICT — «если аргумент NULL — верни NULL, не запускаясь». IMMUTABLE/STABLE/VOLATILE — «метки» для оптимизатора (immutable — «всегда одно значение», stable — «не меняется внутри транзакции»).

Триггер: CREATE TRIGGER name BEFORE/AFTER INSERT/UPDATE/DELETE ON table FOR EACH ROW EXECUTE FUNCTION fn();. Функция триггера — special signature: RETURNS trigger, внутри — NEW (новая строка), OLD (старая). BEFORE — «до записи» (можно изменить NEW или вернут NULL = «не вставлять»); AFTER — «после записи» (NEW/OLD — «уже в таблице»). INSTEAD OF — для views (редко).

Типичные «законные» сценарии триггеров: updated_at = now() (BEFORE UPDATE), логирование изменений (AFTER + audit-таблица), счётчики (denormalized cache), проверка бизнес-инвариантов «на уровне БД». «Незаконные» (лучше в приложении): отправка HTTP, сложная бизнес-логика с ветвлениями, «побочные эффекты» за пределами БД.

## Пример

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_documents_updated
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO documents (title) VALUES ('v1');
UPDATE documents SET title = 'v2' WHERE id = 1;
SELECT title, updated_at FROM documents;   -- updated_at «подтянулся»

-- функция-запрос:
CREATE FUNCTION active_docs(min_len INT) RETURNS SETOF documents AS $$
BEGIN
    RETURN QUERY SELECT * FROM documents WHERE char_length(title) >= min_len;
END;
$$ LANGUAGE plpgsql;
SELECT * FROM active_docs(3);

DROP TRIGGER trg_documents_updated ON documents;
```

## Частые ошибки

WARN: Бизнес-логика «глубоко» в триггерах: приложение «не знает», что данные поменялись (side-effect). Триггеры — для «механики» (updated_at, аудит), а для «смыслов» — явный вызов функции из приложения.

WARN: BEFORE UPDATE вернул NULL «случайно» (забыл RETURN NEW) — UPDATE «пропал» (строка не обновилась, без ошибки). Всегда RETURN NEW в BEFORE-функциях.

WARN: Триггер «на каждую строку» (FOR EACH ROW) на массовой операции (UPDATE 100k) — 100k запусков. Для «одного раза на операцию» — FOR EACH STATEMENT (NEW/OLD нет, только TG_OP).

WARN: РЕКУРСИЯ: триггер на audit-таблице, который пишет в ту же таблицу (без DISABLE TRIGGER) — бесконечный цикл. Аудит-триггер — на «основной» таблице, пишет в отдельную (без триггеров).

TIP: Отладка: `RAISE NOTICE 'val=%', NEW.id;` — «печать» в клиент (видно в psql); `RAISE EXCEPTION` — «ошибка с текстом».

## Практическое задание

1. Таблица `accounts2 (id PK, balance NUMERIC(10,2) NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now())`.
2. Триггер BEFORE UPDATE — updated_at := now() (общая функция, переиспользуемая).
3. Таблица `audit_log (id PK, table_name TEXT, row_id BIGINT, action TEXT, at TIMESTAMPTZ DEFAULT now())`; AFTER INSERT/UPDATE/DELETE триггер на accounts2 пишет в audit_log.
4. Функция `top_balances(k INT)` RETURNS SETOF (топ-k по balance, RETURN QUERY).
5. Ответь письменно: когда «обновить updated_at» лучше в триггере, а когда — в ORM/коде? (подсказка: несколько клиентов, сырые SQL-запросы).

Файл `queries.sql` — заполни TODO.
