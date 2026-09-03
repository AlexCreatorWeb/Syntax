---
id: pg-datatypes
track: postgres
type: reference
section: reference
order: 1
title:
  en: "Data Types Reference"
  ru: "Справочник по типам данных"
excerpt:
  en: "A dense map of PostgreSQL 17 types: what each one stores, when to pick NUMERIC over DOUBLE, TEXT over VARCHAR, TIMESTAMPTZ over TIMESTAMP, and how JSONB fits in."
  ru: "Плотная карта типов PostgreSQL 17: что хранит каждый, когда брать NUMERIC вместо DOUBLE, TEXT вместо VARCHAR, TIMESTAMPTZ вместо TIMESTAMP и как вписывается JSONB."
version: "postgres 17"
updated: 2026-09-03
---

A compact map of the types you will actually use in PostgreSQL 17: what each one stores, a typical value, and the traps. Keep this page open while designing a schema or reading the output of \d in psql.

## Core types

| Type | What it stores | Example value | Notes |
| ------ | ---------------- | --------------- | ------- |
| SMALLINT | Integer, -2^15 to 2^15-1 | 32767 | Compact; rarely the right id |
| INTEGER | Integer, about ±2.1e9 | 1000000 | Default for ids and counters |
| BIGINT | Integer, about ±9.2e18 | 9007199254740993 | Use for ids when the scale is unclear |
| NUMERIC(p, s) | Exact decimal number | 19.99 | Money, quantities, percentages |
| REAL / DOUBLE PRECISION | Floating-point number | 3.14 | Sensors, geometry; never money |
| BOOLEAN | true or false | true | Never encode as 0 / 1 |
| TEXT | Text of any length | 'hello, world' | In Postgres as fast as any VARCHAR |
| VARCHAR(n) | Text up to n characters | 'abc' | Only when the length limit must be a constraint |
| DATE | Calendar day | 2026-09-03 | No time, no timezone |
| TIMESTAMP | Date and time, no timezone | 2026-09-03 12:15:00 | Only when a timezone is provably irrelevant |
| TIMESTAMPTZ | Moment in time with timezone | 2026-09-03 12:15:00+02 | The default choice for "when" |
| INTERVAL | Span of time | 1 day 4 hours | created_at + interval '30 days' |
| UUID | 128-bit identifier | a0eebc99-9e6b-4a7f-8f6b-1c2d3e4f5a6b | Distributed ids; wider than BIGINT |
| JSONB | JSON document, binary layout | {"size": "m"} | Semi-structured data, indexable |
| BYTEA | Binary data | \x0102 | File blobs, certificates |
| INET / CIDR | Network address or subnet | 192.168.0.1/24 | IP filters, subnets |

The full catalog also includes arrays, ranges, geometric types, bit strings and domains; in the first project you will meet the table above for about 95 percent of the columns.

## Numbers: which one to pick

| Job | Type | Why |
| ----- | ------ | ----- |
| Money and prices | NUMERIC(12, 2) | Exact; no binary-rounding surprises |
| Row ids, counters | BIGINT GENERATED ALWAYS AS IDENTITY | Automatic numbering, no client round trip |
| Distributed ids (many writers) | UUID with gen_random_uuid() | Generated anywhere without a server call |
| Percentages, ratios | NUMERIC(5, 2) | Exact arithmetic |
| Sensor readings, geometry | DOUBLE PRECISION | Fast approximation is the contract |
| Small bounded counters | SMALLINT | Compact in indexes and on disk |

The recurring mistake is storing money in DOUBLE PRECISION: 0.1 + 0.2 comes out 0.30000000000000004, and a report that sums the column quietly drifts. NUMERIC is slower in arithmetic, but exact — and exactness is the property you pay for.

For ids, BIGINT with an identity column is the boring, fast, correct default. Reach for UUID only when rows are created on many machines and a central sequence would be a bottleneck; the trade is a wider column and a wider index.

## Text, time and JSONB

| Job | Tool |
| ----- | ------ |
| Case-insensitive search | ILIKE '%key%' |
| Regex matching | column ~ 'pattern' |
| "When did it happen" | TIMESTAMPTZ, compared with now() |
| "How long ago" | now() - created_at, an INTERVAL |
| Structured extras with a changing shape | JSONB |
| Searching inside JSONB | column ->> 'key', the @> operator, a GIN index |

TEXT and VARCHAR have the same storage and the same speed in Postgres; VARCHAR(n) only adds a per-value length check, so take TEXT by default and add the constraint only when the limit is a business rule.

JSONB is JSON in binary: fields can be read with -> and ->>, the @> operator answers "does the document contain", and a GIN index accelerates both. The rule of thumb: a stable, small set of fields — real columns with real types; a changing shape that different clients fill differently — JSONB, with a comment on the table documenting the expected keys.

> **TIP**
> When in doubt, take TEXT and TIMESTAMPTZ: they have no meaningful downside in Postgres and they answer ninety percent of "what do I write in the CREATE TABLE" questions.

<!-- RU -->

Компактная карта типов, которые вы реально будете использовать в PostgreSQL 17: что хранит каждый, типичное значение и ловушки. Держите эту страницу открытой при проектировании схемы или при чтении вывода \d в psql.

## Базовые типы

| Тип | Что хранит | Пример значения | Примечания |
| ------ | ---------------- | --------------- | ------- |
| SMALLINT | Целое, от -2^15 до 2^15-1 | 32767 | Компактный; редко правильный id |
| INTEGER | Целое, примерно ±2.1e9 | 1000000 | Дефолт для id и счётчиков |
| BIGINT | Целое, примерно ±9.2e18 | 9007199254740993 | Для id, когда масштаб неочевиден |
| NUMERIC(p, s) | Точное десятичное число | 19.99 | Деньги, количества, проценты |
| REAL / DOUBLE PRECISION | Число с плавающей точкой | 3.14 | Датчики, геометрия; никогда деньги |
| BOOLEAN | true или false | true | Никогда не кодируйте как 0 / 1 |
| TEXT | Текст любой длины | 'hello, world' | В Postgres так же быстр, как любой VARCHAR |
| VARCHAR(n) | Текст до n символов | 'abc' | Только когда лимит длины — business-правило |
| DATE | Календарный день | 2026-09-03 | Без времени, без таймзоны |
| TIMESTAMP | Дата и время, без таймзоны | 2026-09-03 12:15:00 | Только когда таймзона доказуемо безразлична |
| TIMESTAMPTZ | Мгновение времени с таймзоной | 2026-09-03 12:15:00+02 | Выбор по умолчанию для «когда» |
| INTERVAL | Интервал времени | 1 day 4 hours | created_at + interval '30 days' |
| UUID | 128-битный идентификатор | a0eebc99-9e6b-4a7f-8f6b-1c2d3e4f5a6b | Распределённые id; шире BIGINT |
| JSONB | JSON-документ, бинарная запись | {"size": "m"} | Полуструктурированные данные, индексируется |
| BYTEA | Бинарные данные | \x0102 | Файлы, сертификаты |
| INET / CIDR | Сетевой адрес или подсеть | 192.168.0.1/24 | IP-фильтры, подсети |

Полный каталог включает ещё массивы, ranges, геометрические типы, битовые строки и domains; в первом проекте таблица выше покрывает примерно 95 процентов колонок.

## Числа: какой тип выбрать

| Задача | Тип | Почему |
| ----- | ------ | ----- |
| Деньги и цены | NUMERIC(12, 2) | Точно; без сюрпризов с двоичным округлением |
| Row id, счётчики | BIGINT GENERATED ALWAYS AS IDENTITY | Автономумерация, без round trip на клиенте |
| Распределённые id (много writers) | UUID с gen_random_uuid() | Генерация в любом месте без звонка на сервер |
| Проценты, отношения | NUMERIC(5, 2) | Точная арифметика |
| Показания датчиков, геометрия | DOUBLE PRECISION | Быстрое приближение — и есть контракт |
| Малые ограниченные счётчики | SMALLINT | Компактен в индексах и на диске |

Типичная ошибка — хранить деньги в DOUBLE PRECISION: 0.1 + 0.2 даёт 0.30000000000000004, и отчёт, суммирующий колонку, незаметно плывёт. NUMERIC медленнее в арифметике, но точен — и точность та свойство, за которое вы платите.

Для id BIGINT с identity-колонкой — скучной, быстрой и правильной дефолт. Берите UUID, только когда строки создаются на многих машинах и центральная последовательность стала бы узким местом; плата — более широкая колонка и более широкий индекс.

## Текст, время и JSONB

| Задача | Инструмент |
| ----- | ------ |
| Поиск без учёта регистра | ILIKE '%key%' |
| Регулярное выражение | column ~ 'pattern' |
| «Когда произошло» | TIMESTAMPTZ, сравнение с now() |
| «Сколько времени назад» | now() - created_at, это INTERVAL |
| Структурные доп. поля со zmieniaющейся формой | JSONB |
| Поиск внутри JSONB | column ->> 'key', оператор @>, GIN-индекс |

TEXT и VARCHAR в Postgres имеют одно и то же хранение и одну и ту же скорость; VARCHAR(n) лишь добавляет проверку длины на каждое значение, поэтому по умолчанию берите TEXT и добавляйте ограничение, только когда лимит — business-правило.

JSONB — это JSON в бинарной записи: поля читаются через -> и ->>, оператор @> отвечает «содержит ли документ», а GIN-индекс ускоряет оба. Правило: стабильный небольшой набор полей — настоящие колонки с настоящими типами; zmieniaющаяся форма, которую разные клиенты заполняют по-разному — JSONB, с комментарием к таблице, документирующим ожидаемые ключи.

> **TIP**
> Когда сомневаетесь, берите TEXT и TIMESTAMPTZ: в Postgres у них нет заметных минусов, и они отвечают на девяносто процентов вопросов «что писать в CREATE TABLE».
