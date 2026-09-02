# Урок 9. path: join, resolve, relative, parse

## Цель

После урока студент сможет: собирать безопасные пути через `path.join`/`path.resolve`, использовать `path.dirname`/`basename`/`extname`/`parse`, вычислять относительные пути (`relative`), понимать разницу разделителей и «.`» в путях и не собирать строки через `+` руками.

## Теория

### Зачем path

Путь — строка с **правилами**: разделитель (`/` на POSIX, `\` на Windows), `.` (текущий каталог), `..` (родитель), абсолютный/относительный. Собирать их руками (`"/files/" + name + ".txt"`) — классический источник багов (двойные слэши, `..`-выходы). Модуль **`path`** — единственный способ оперировать путями.

### Основные функции

```js
import path from "path";

path.join("a", "b", "c.js");        // "a/b/c.js" — склеить сегменты
path.resolve("a", "..", "b");       // "/abs/a/../b" → "/abs/b" — в абсолютный (от cwd)
path.dirname("/a/b/c.js");          // "/a/b" — каталог
path.basename("/a/b/c.js");         // "c.js" — имя
path.basename("/a/b/c.js", ".js");  // "c" — имя без расширения
path.extname("/a/b/c.tar.gz");      // ".gz" — последнее расширение
path.parse("/a/b/c.js");            // { root:"/", dir:"/a/b", base:"c.js", ext:".js", name:"c" }
path.relative("/a/b", "/a/b/c/d");  // "c/d" — относительный путь
path.isAbsolute("/x");              // true
path.isAbsolute("x/y");             // false
```

- **`join`** — «быстро склеить» (нормализует: `a//b` → `a/b`), результат **относительный**, если все аргументы относительные.
- **`resolve`** — идёт **справа налево**, пока не получит абсолютный путь; остаток слева — от `process.cwd()`. `resolve("/a", "b", "..", "c")` → `/a/c`.
- **`relative(from, to)`** — как добраться из `from` в `to` (нужно для ссылок, логов, `fs`-операций).

### Безопасность: `..` и «выход за каталог»

Если часть пути приходит **извне** (запрос, имя файла), `..` может вынести путь наружу: `join("/files", "../../etc/passwd")` → `/etc/passwd`. Защита: `resolve` оба пути и проверьте, что результат **начинается** с корневого каталога:

```js
const safe = resolve(baseDir, fileName);
if (!safe.startsWith(baseDir + sep)) throw new Error("Путь вне каталога");
```

TIP: `path.posix` vs `path.win32` — те же функции, но с конкретными разделителями (в песочнице и на Linux — `path` = `path.posix`). В кросс-платформенном коде используйте `path.sep`/`path.join`, а не хардкод `/`.

NOTE: в песочнице `path` — POSIX-реализация (как на Linux/маке). В терминале на Windows разделитель `\`, но API тот же.

## Пример

`server.js`:

```js
import path from "path";

// 1) Склейка
const file = path.join("uploads", "avatars", "user-42.png");
console.log("join:", file);

// 2) Разбор
const p = path.parse("/home/api/data/reports/2026-09.json");
console.log("parse:", p.dir, "|", p.name, p.ext);
console.log("basename без ext:", path.basename(p.base, p.ext));

// 3) resolve: «где будет файл» от cwd
const abs = path.resolve("config", "settings.json");
console.log("resolve:", abs);

// 4) relative: «от корня проекта до файла»
console.log("relative:", path.relative("/srv/app", "/srv/app/uploads/a.png"));

// 5) Защита от ..-выхода (имя из запроса)
function safePath(baseDir, name) {
  const safe = path.resolve(baseDir, name);
  if (safe !== baseDir && !safe.startsWith(baseDir + path.sep)) {
    throw new Error("Путь вне каталога: " + name);
  }
  return safe;
}
console.log("ok:", safePath("/srv/files", "a/b.txt"));
try {
  safePath("/srv/files", "../../etc/passwd");
} catch (e) {
  console.log("поймали:", e.message);
}
```

## Частые ошибки

WARN: собираете пути строками: `"/files/" + name + "/index.html"`. Двойные слэши, пустые сегменты, `..`-выходы — всегда используйте `path.join`/`path.resolve`.

WARN: путаете `join` и `resolve`: `join("/a", "../b")` → `"b"` (нормализация без cwd), `resolve("/a", "../b")` → `"/b"` (абсолютный, от корня). Для «абсолютного пути к ресурсу» — `resolve`.

WARN: доверяете имени файла из запроса без проверки `..`: `path.join(uploadDir, req.params.file)` → чтение `/etc/passwd`. Валидация: resolve + startsWith(base).

WARN: хардкодите `/` в кросс-платформенном коде (`"a" + "/" + "b"`). На Windows — `\`. `path.join` знает разделитель сам.

## Практическое задание

1. Напишите функцию `buildReportPath(year, month, id)`: `path.join("reports", String(year), String(month).padStart(2, "0"), id + ".json")`. Выведите для (2026, 9, 42).
2. Напишите `fileNameOnly(p)`: возвращает `{ name, ext, dir }` через `path.parse`.
3. Реализуйте `isInside(base, target)` (оба абсолютные): true, если `target` внутри `base` (через `relative`: не начинается с `..` и не абсолютный).
4. Проверьте `isInside("/srv/app", "/srv/app/uploads/a.png")` → true, `("/srv/app", "/srv/app2/x")` → false, `("/srv/app", "/etc/passwd")` → false.
5. Напишите `shorten(p)`: если путь длиннее 40 символов — «`…` + последние 35» (через `path.basename` для читаемости). Выведите для длинного пути.
