---
id: pg-transactions
track: postgres
type: guide
section: advanced
order: 6
title:
  en: "Transactions & Concurrency"
  ru: "Транзакции и конкурентность"
excerpt:
  en: "BEGIN, COMMIT and ROLLBACK in practice: atomic money movement, savepoints, the four isolation levels, and how row locks, NOWAIT and SKIP LOCKED shape concurrent workloads."
  ru: "BEGIN, COMMIT и ROLLBACK на практике: атомарное движение денег, savepoint'ы, четыре уровня изоляции и то, как row-локи, NOWAIT и SKIP LOCKED формируют конкурентные нагрузки."
version: "postgres 17"
updated: 2026-09-03
---

A transaction is a group of statements that are all-or-nothing: either every change in it is applied, or it is as if nothing happened. This page covers the basic BEGIN / COMMIT / ROLLBACK cycle, the atomic money pattern, the four isolation levels, and the lock and deadlock situations you will actually meet in a production database.

## The basic cycle: BEGIN, COMMIT, ROLLBACK

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;
```

Between BEGIN and COMMIT the changes are visible only to your own connection. If the script crashes, the connection drops, or you decide something went wrong, ROLLBACK rewinds everything to the state at the moment of BEGIN. In autocommit mode — psql's default — each statement is its own transaction, so an atomic pair of UPDATEs has to be wrapped in BEGIN ... COMMIT explicitly.

SAVEPOINT splits a long transaction into named sections. ROLLBACK TO a savepoint rewinds only the part after the marker, and everything before it stays:

```sql
BEGIN;

SAVEPOINT before_risky;

-- the risky operation goes here

ROLLBACK TO before_risky;

-- everything before the savepoint is still there
COMMIT;
```

Use savepoints when a batch job processes items one by one and one bad item should not undo the ninety good ones: the savepoint is created before each item, rolled back around the failure, and the transaction commits at the end.

## Atomic money movement

Moving money between two accounts is the textbook case: two UPDATEs, one logical operation. Inside a transaction the pair is atomic — there is no moment when the money is "in flight" and the sum of the balances does not add up.

The same pattern covers "an order with a stock decrement": decrement the stock, write the order, COMMIT — both or neither. If the operation should fail loudly when there is not enough stock, make the UPDATE conditional and check how many rows it touched:

```sql
BEGIN;

UPDATE stock
SET qty = qty - 1
WHERE product_id = 7 AND qty > 0;

-- if zero rows were updated, there is no stock: ROLLBACK
COMMIT;
```

In drivers the row count is the rowCount field of the result — zero rows updated means the condition was not met, and the transaction should roll back instead of committing an order for a product that does not exist.

## Isolation levels

Two transactions touching the same rows can interfere with each other. The SQL standard defines four isolation levels — the higher, the fewer anomalies, but also the more waiting on locks:

| Level | What it guarantees | When you use it |
| ------- | -------------------- | ----------------- |
| READ COMMITTED | You only see committed data, no dirty reads | The Postgres default, good for most apps |
| REPEATABLE READ | Your data snapshot does not change during the transaction | Reports where consistency matters |
| SERIALIZABLE | As if the transactions ran one after another | Critical money logic |
| READ UNCOMMITTED | Everything, including uncommitted data | Behaves like READ COMMITTED in Postgres |

Postgres defaults to READ COMMITTED, and for the vast majority of applications that is exactly the right level. Under the hood the engine uses MVCC — multiple versions of each row coexist, so a writer does not block a reader and vice versa, and every reader sees a consistent snapshot of committed data. SERIALIZABLE is the tool for rare, critical cases: when two transactions conflict, the engine rolls back one of them with a serialization_failure error, and the application simply retries the transaction.

## Locks and deadlocks

Inside a transaction, an UPDATE or DELETE on a row puts a lock on it: other transactions can still read the old version, but they cannot change the same row until your COMMIT or ROLLBACK. The locks are row-level, not table-level — this is why Postgres scales to many concurrent writers without a global queue.

A deadlock happens when transaction A holds a lock on row 1 and asks for row 2, while transaction B holds row 2 and asks for row 1. Both wait forever — until the engine detects the cycle and rolls back one of the transactions with the error "deadlock detected". The standard cure is to acquire locks in a stable order everywhere in the application: always by id ascending, for example, so two transactions can never circle each other.

When you want to fail immediately instead of waiting, add NOWAIT to the row-locking clause of SELECT; when you want to skip rows that are already locked — the classic worker that claims tasks — use SKIP LOCKED:

```sql
SELECT id, payload
FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 5
FOR UPDATE SKIP LOCKED;
```

Each worker gets five different pending jobs without ever blocking on a colleague, and the FOR UPDATE part locks them so nobody else picks the same rows.

## Common mistakes

> **WARNING**
> A long transaction holds its locks longer than necessary: a two-hour BEGIN ... COMMIT with a coffee break in the middle blocks other writers and fills the table with dead versions that VACUUM cannot yet clean. Keep transactions short — read outside, write inside.

> **WARNING**
> ROLLBACK TO a savepoint inside a retry loop hides the root cause: if an operation fails fifty times in a row, you get fifty silent rollbacks instead of one loud error. Log every ROLLBACK TO with its reason.

> **TIP**
> In a script, check the state with a SELECT before COMMIT — rolling back inside the transaction is always cheaper than fixing a wrong commit afterwards.

<!-- RU -->

Транзакция — группа выражений, которые либо целиком применяются, либо происходят как будто ничего не было. Эта страница разбирает базовый цикл BEGIN / COMMIT / ROLLBACK, атомарный паттерн движения денег, четыре уровня изоляции и ситуации с локами и deadlock'ами, которые реально встречаются в продакшн-базе.

## Базовый цикл: BEGIN, COMMIT, ROLLBACK

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;
```

Между BEGIN и COMMIT изменения видны только вашему собственному соединению. Если скрипт падает, соединение рвётся, или вы решаете, что что-то пошло не так, ROLLBACK откатывает всё к состоянию на момент BEGIN. В режиме autocommit — дефолт psql — каждое выражение — своя транзакция, поэтому атомарная пара UPDATE должна оборачиваться в BEGIN ... COMMIT явно.

SAVEPOINT делит длинную транзакцию на именованные секции. ROLLBACK TO savepoint откатывает только часть после маркера, а всё, что было до, остаётся:

```sql
BEGIN;

SAVEPOINT before_risky;

-- рискованная операция здесь

ROLLBACK TO before_risky;

-- всё до savepoint на месте
COMMIT;
```

Используйте savepoint'ы, когда батч-задача обрабатывает элементы по одному, и один плохой элемент не должен отменять девяносто хороших: savepoint создаётся перед каждым элементом, откатывается вокруг сбоя, и транзакция коммитится в конце.

## Атомарное движение денег

Перевод денег между двумя счетами — учебный случай: два UPDATE, одна логическая операция. Внутри транзакции пара атомарна — нет момента, когда деньги «в полёте» и сумма балансов не сходится.

Тот же паттерн покрывает «заказ со списанием со склада»: списать со склада, записать заказ, COMMIT — оба или ничего. Если операция должна громко падать, когда склада не хватает, сделайте UPDATE условным и проверьте, сколько строк он затронул:

```sql
BEGIN;

UPDATE stock
SET qty = qty - 1
WHERE product_id = 7 AND qty > 0;

-- если обновлено ноль строк — склада нет: ROLLBACK
COMMIT;
```

В драйверах число строк — это поле rowCount в результате: ноль обновлённых строк значит, что условие не выполнилось, и транзакцию нужно откатить, а не коммитить заказ на товар, которого нет.

## Уровни изоляции

Две транзакции, трогаящие одни и те же строки, могут мешать друг другу. SQL-стандарт определяет четыре уровня изоляции — чем выше, тем меньше аномалий, но и тем больше ожидания на локах:

| Уровень | Что гарантирует | Когда используется |
| ------- | -------------------- | ----------------- |
| READ COMMITTED | Видна только закоммиченная данные, без dirty reads | Дефолт Postgres, годится большинству приложений |
| REPEATABLE READ | Снимок данных не меняется во время транзакции | Отчёты, где важна консистентность |
| SERIALIZABLE | Как будто транзакции шли одна за другой | Критичная логика с деньгами |
| READ UNCOMMITTED | Всё, включая незакоммиченное | В Postgres ведёт себя как READ COMMITTED |

Postgres по умолчанию работает на READ COMMITTED, и для подавляющего большинства приложений это ровно правильный уровень. Под капотом движок использует MVCC — в каждой строке сосуществуют несколько версий, поэтому writer не блокирует reader и наоборот, и каждый читатель видит консистентный снимок закоммиченных данных. SERIALIZABLE — инструмент для редких, критичных случаев: при конфликте движок откатывает одну из транзакций с ошибкой serialization_failure, и приложение просто повторяет транзакцию.

## Локи и deadlock'и

Внутри транзакции UPDATE или DELETE по строке ставит на неё лок: другие транзакции могут читать старую версию, но менять ту же строку не могут, пока не произойдёт ваш COMMIT или ROLLBACK. Локи — на уровне строк, а не таблиц, — именно поэтому Postgres масштабируется на многих конкурентных writers без глобальной очереди.

Deadlock происходит, когда транзакция A держит лок на строке 1 и запрашивает строку 2, а транзакция B держит строку 2 и запрашивает строку 1. Обе ждут вечно — пока движок не обнаружит цикл и не откатит одну из транзакций с ошибкой «deadlock detected». Стандартное лечение — брать локи в стабильном порядке везде в приложении: например, всегда по возрастанию id, чтобы две транзакции не могли «обойти друг друга по кругу».

Когда хочется падать сразу, а не ждать, добавьте NOWAIT в row-locking-клаузулу SELECT; когда хочется пропустить уже залокенные строки — классический worker, снимающий задачи, — используйте SKIP LOCKED:

```sql
SELECT id, payload
FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 5
FOR UPDATE SKIP LOCKED;
```

Каждый worker получает пять разных pending-задач и никогда не блокируется на коллеге, а часть FOR UPDATE залокенывает их, чтобы никто не снял те же строки.

## Частые ошибки

> **WARNING**
> Длинная транзакция держит свои локи дольше, чем нужно: двухчасовой BEGIN ... COMMIT с перерывом на кофе блокирует других writers и наполняет таблицу мёртвыми версиями, которые VACUUM пока не может убрать. Держите транзакции короткими — читать снаружи, писать внутри.

> **WARNING**
> ROLLBACK TO savepoint внутри retry-цикла прячет корневую причину: если операция падает пятьдесят раз подряд, вы получаете пятьдесят молчаливых откатов вместо одной громкой ошибки. Логируйте каждый ROLLBACK TO с причиной.

> **TIP**
> В скрипте проверяйте состояние SELECT'ом перед COMMIT — откатиться внутри транзакции всегда дешевле, чем потом чинить неверный commit.
