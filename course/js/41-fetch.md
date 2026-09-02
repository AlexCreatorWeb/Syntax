# Урок 41. Fetch: запросы к API

## Цель
После урока студент сможет: «выполнить** «запрос** «fetch «(GET/POST**, «заголовки** «и** «тело**); ««понять** «Response** «(ok, status, «методы** «json/text**); ««обработать** «ошибки** «(«сетевые** «и** «HTTP**); ««запросить** ««публичный** «API** «(JSONPlaceholder) «в** «редакторе**.

## Теория
### fetch: ««проброс** «запроса** «→** «Promise «Response**
**fetch(url, options)** — ««выполнить** «HTTP-запрос** «и** ««вернуть** «Promise «с** «Response** «(«когда** ««головы** ««получены** «(тело** ««ещё** ««не** ««скачано** «(stream**). «Не** ««бросает** «ошибка** «при** «HTTP 4xx/5xx** («только** ««сетевые** «сбои** «—» ««проверьте** «res.ok** «всегда**).

```js
const res = await fetch("https://api.example.com/users/1");
if (!res.ok) throw new Error(`HTTP ${res.status}`); // 404/500 «—» «ошибка**
const user = await res.json(); // «тело** «JSON** (Promise)
```
**Response**:
- **res.ok** — true «если** «status 200–299**;
- **res.status** — «число** «(200, 404, 500**);
- **res.headers** — ««головы** (get("content-type"));
- **res.json()** — «Promise** «с** ««разобранным** «JSON**;
- **res.text()** — «Promise** «с** «текстом**;
- **res.blob()** — ««файл** «(картинка**, «аудио**).

### «Параметры**: «метод**, «заголовки**, «тело**
```js
// POST «с** «JSON-телом**:
await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "A", email: "a@b.c" }),
});
// GET «с** ««параметрами** «(«строка** «запроса**):
await fetch(`/api/items?page=1&size=10`);
```
«POST/PUT** «с** «JSON** «—» «обязателен** «Content-Type: application/json «и** «body** «—» «строка** «(JSON.stringify** «(урок** 27**).

### «Ошибки**: ««сетевые** «и** «HTTP**
- ««Сетевые** «(офлайн**, «CORS**, ««таймаут**) → «fetch ««бросает** «(TypeError: Failed to fetch) — «try/catch**;
- «HTTP 4xx/5xx** → «res.ok === false** («не** «бросает**) — «проверьте** «и** «throw** «(««свои** «ошибка** «с** «status**).

«Паттерн**:
```js
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

### «Публичный** «API** «для** ««практики**
**https://jsonplaceholder.typicode.com** — ««демо** «API** «(posts, «users, «todos), «CORS** «открыт** («работает** «с** ««браузера** «и** ««редактора**):
```js
const posts = await getJSON("https://jsonplaceholder.typicode.com/posts");
console.log(posts.length); // 100
const post1 = await getJSON("https://jsonplaceholder.typicode.com/posts/1");
```

TIP: ««всегда** «проверяйте** res.ok «и** ««ловите** ««сетевые** «ошибки** «try/catch** «(«два** ««рода** «ошибок**: HTTP «и** «сеть**). ««Инлайн** «helper** «(getJSON** «—» ««сухой** «паттерн** «для** ««всех** «GET**).

NOTE: «fetch** ««не** ««отправляет** «cookies** «по** ««умолчанию** «к** ««другому** «домену** (CORS**); «для** «API** «с** ««аутентификацией** «—» «headers: { Authorization: "Bearer …" } «и** «credentials: "include" «(CORS** ««должен** ««разрешить**). ««Публичные** «API** «(JSONPlaceholder**) «—» «CORS** «открыт** («работает** «сразу**).

## Пример
```js
const API = "https://jsonplaceholder.typicode.com";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// «GET** «список**:
(async () => {
  try {
    const posts = await getJSON(`${API}/posts`);
    console.log("«постов**:", posts.length); // 100
    console.log("«первый**:", posts[0].title);
  } catch (err) {
    console.error("«сбой**:", err.message);
  }
})();

// «GET** «один**:
getJSON(`${API}/posts/1`).then((p) => console.log("«пост** 1:", p.title));

// «POST** «(создание** «—» ««демо** «(вернёт** ««созданный** «объект** «с** id: 101**):
fetch(`${API}/posts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "новый", body: "текст", userId: 1 }),
})
  .then((r) => r.json())
  .then((p) => console.log("«создан**:", p.id)); // 101
```
Разбор: fetch → «Response** (ok/status) «→** «тело** (json()). ««Сетевые** «ошибки** — «try/catch**, HTTP — «res.ok**. «POST** «с** «JSON-телом**.

## Частые ошибки
WARN: «забыли** «проверить** res.ok «(404 «—» ««пустой** «json() «(««молча** ««упадёт** «или** «null**); «всегда** «if (!res.ok) throw.
WARN: «ждёте** «ошибка** «из** «fetch «при** «404/500** — «нет**: ««бросает** «только** ««сетевые** «сбои**; HTTP — «res.ok === false** («проверьте** «вручную**).
WARN: POST «с** «JSON** «без** «Content-Type: application/json — «сервер** ««не** ««разберёт** «тело** (««пусто**); ««заголовок** ««обязателен**.
WARN: «body** «—** «объект** «(не «строка**) — «TypeError** («fetch** ««ожидает** «строку/FormData/Blob**); JSON.stringify.
WARN: ««параллельные** «fetch** «без** «Promise.all «(«последовательные** «await**) — ««медленнее** «(«сумма** ««времени**); «Promise.all «для** ««независимых** «(урок** 40**).

## Практическое задание
1. В скелете задания «реализуйте** «getJSON(url) «(fetch + ok + «json**).
2. «Запросите** `${API}/posts` — «выведите** ««кол-во** «и** ««первый** «title**.
3. «Запросите** `${API}/posts/1` — «выведите** «title «и** userId.
4. «Сделайте** «POST** «(новый** «пост** «с** «title/body/userId** «—» «выведите** «id** ««созданного** «(101**).
5. Бонус: ««сравните** ««время** «(console.time** «последовательных** «двух** «GET** «vs** «Promise.all** «(урок** 40**).
