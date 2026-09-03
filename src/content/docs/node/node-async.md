---
id: node-async
track: node
type: guide
section: patterns
order: 5
title:
  en: "Async Patterns"
  ru: "Асинхронные паттерны"
excerpt:
  en: "Promise combinators, parallel versus sequential code, bounded-concurrency pools, timeouts, retries, and cancellation in Node."
  ru: "Комбинаторы Promise, параллельный и последовательный код, пулы ограниченной конкурентности, таймауты, ретраи и отмена в Node."
version: "node 22"
updated: 2026-09-03
relatedTask: node-006
---

Node code is asynchronous by default: file reads, network calls, and timers all return Promises. The patterns below — parallel execution, bounded concurrency, timeouts, retries, cancellation — cover most of what a real server needs, and they all sit on the same four primitives.

## Promises and the combinators

`Promise.all` settles when every input has settled, but rejects on the first rejection — it is the "all or nothing" combinator. `Promise.allSettled` never rejects: it reports each input as `fulfilled` or `rejected`, which makes it the right tool for batch jobs. `Promise.race` settles with whichever input settles first, which is how timeouts are built; `Promise.any` waits for the first success.

```js
// all or nothing
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// report per item, never reject
const results = await Promise.allSettled(jobs.map(run));
const ok = results.filter((r) => r.status === "fulfilled");

// first to settle wins — the basis of timeouts
const data = await Promise.race([fetchData(), timeout(3000)]);
```

## Parallel versus sequential

The single most common performance bug in async code is a `for..of` loop with `await` inside: it runs the iterations strictly one by one, multiplying the total time. When the iterations are independent, `Promise.all` runs them at once.

```js
// sequential: 3 users x 1s = 3s
for (const id of ids) {
  const user = await fetchUser(id);
}

// parallel: 3 users at once = ~1s
const users = await Promise.all(ids.map((id) => fetchUser(id)));
```

> **WARNING**
> A `for..of` loop with `await` inside is strictly sequential. If the iterations do not depend on each other, switch to `Promise.all` — that is usually the difference between a 3-second page load and a 1-second one.

## Bounded concurrency: the pool

`Promise.all` over ten thousand URLs opens ten thousand requests and is a fast way to exhaust sockets and memory. A pool keeps at most `limit` jobs in flight: a cursor over the array plus `limit` workers, each taking the next index until the cursor runs out. Writing results by index preserves the original order.

```js
export async function poolMap(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return out;
}
```

```js
const pages = await poolMap(urls, 5, (url) => fetchPage(url));
```

> **TIP**
> Five to ten concurrent fetches is a good default for HTTP pools: high enough to keep the network busy, low enough to keep memory and retry storms under control.

## Timeouts, retries, and cancellation

A timeout is `Promise.race` against a timer that rejects. A retry loop wraps each attempt in `try/catch`, waits, and goes again — usually with a growing delay so a sick service gets a chance to recover. For work that is already in flight, `AbortController` is the standard cancellation handle: pass its `signal` to `fetch` and call `abort()` to reject it.

```js
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), ms);
  });
}

async function withRetry(fn, { tries = 3, delay = 200 } = {}) {
  let last;
  for (let i = 1; i <= tries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < tries) await new Promise((r) => setTimeout(r, delay * i));
    }
  }
  throw last;
}
```

```js
const controller = new AbortController();
const t = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch("https://api.example.com/data", {
    signal: controller.signal,
  });
  console.log(await res.json());
} finally {
  clearTimeout(t);
}
```

The four primitives — `Promise.all` / `allSettled`, the pool, race-timeout, and `AbortController` — compose: a production fetcher usually has a timeout inside a retry, both inside a pool, and an abort signal wired to the request lifecycle.

<!-- RU -->

Код в Node асинхронен по умолчанию: чтение файлов, сетевые вызовы и таймеры возвращают Promise. Паттерны ниже — параллельное исполнение, ограниченная конкурентность, таймауты, ретраи, отмена — покрывают всё, что нужно настоящему серверу, и все они стоят на одних и тех же четырёх примитивах.

## Promise и комбинаторы

`Promise.all` селится, когда расселились все входные, но reject-ит на первом падении — это комбинатор «всё или ничего». `Promise.allSettled` никогда не падает: он сообщает по каждому входу `fulfilled` или `rejected`, что делает его правильным инструментом для батч-задач. `Promise.race` селится вместе с тем входом, который расселился первым, — на этом строятся таймауты; `Promise.any` ждёт первый успех.

```js
// всё или ничего
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// отчёт по каждому, никогда не падает
const results = await Promise.allSettled(jobs.map(run));
const ok = results.filter((r) => r.status === "fulfilled");

// выигрывает первый — основа таймаутов
const data = await Promise.race([fetchData(), timeout(3000)]);
```

## Параллельно против последовательно

Самый частый перформанс-баг в async-коде — цикл `for..of` с `await` внутри: он исполняет итерации строго по одной, множа общее время. Когда итерации независимы, `Promise.all` гоняет их разом.

```js
// последовательно: 3 юзера x 1с = 3с
for (const id of ids) {
  const user = await fetchUser(id);
}

// параллельно: 3 юзера разом = ~1с
const users = await Promise.all(ids.map((id) => fetchUser(id)));
```

> **WARNING**
> Цикл `for..of` с `await` внутри строго последовательный. Если итерации не зависят друг от друга — переходите на `Promise.all`; это обычно разница между страницей на 3 секунды и на 1.

## Ограниченная конкурентность: пул

`Promise.all` по десяти тысячам URL открывает десять тысяч запросов — быстрый способ исчерпать сокеты и память. Пул держит не более `limit` задач в полёте: курсор по массиву плюс `limit` воркеров, каждый берёт следующий индекс, пока курсор не закончится. Запись результатов по индексу сохраняет исходный порядок.

```js
export async function poolMap(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return out;
}
```

```js
const pages = await poolMap(urls, 5, (url) => fetchPage(url));
```

> **TIP**
> Пять-десять одновременных fetch — разумное умолчание для HTTP-пула: достаточно, чтобы сеть загружалась, и мало, чтобы держать память и ретрай-штормы под контролем.

## Таймауты, ретраи и отмена

Таймаут — это `Promise.race` с таймером, который reject-ит. Петля ретраев оборачивает каждую попытку в `try/catch`, ждёт и пробует снова — обычно с растущей задержкой, чтобы больной сервис успел выздороветь. Для работы, уже ушедшей в полёт, стандартная ручка отмены — `AbortController`: передайте его `signal` в `fetch` и вызовите `abort()`, чтобы отклонить запрос.

```js
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), ms);
  });
}

async function withRetry(fn, { tries = 3, delay = 200 } = {}) {
  let last;
  for (let i = 1; i <= tries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < tries) await new Promise((r) => setTimeout(r, delay * i));
    }
  }
  throw last;
}
```

```js
const controller = new AbortController();
const t = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch("https://api.example.com/data", {
    signal: controller.signal,
  });
  console.log(await res.json());
} finally {
  clearTimeout(t);
}
```

Четыре примитива — `Promise.all`/`allSettled`, пул, race-таймаут и `AbortController` — композируются: production-фетчер обычно имеет таймаут внутри ретрая, оба внутри пула, и abort-сигнал, заведённый на lifecycle запроса.
