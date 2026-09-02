# Урок 11. fs-стримы: createReadStream, createWriteStream, pipe

## Цель

После урока студент сможет: объяснять, что такое стрим (поток данных чанками) и зачем он (крупные файлы без «всё в память»), создавать читающие/пишущие стримы (`createReadStream`/`createWriteStream`), соединять их через `pipe`, обрабатывать события стрима (`data`, `end`, `error`) и пересылать файл в HTTP-ответ.

## Теория

### Почему стримы

`fs.readFile` грузит **весь** файл в память. Файл на 2 ГБ — 2 ГБ в RAM. **Стрим** передаёт данные **чанками** (по умолчанию 64 КБ): память ограничена размером чанка, а не файла.

Четыре типа стримов:

- **Readable** — «откуда читаем» (файл, тело HTTP-запроса);
- **Writable** — «куда пишем» (файл, HTTP-ответ);
- **Duplex** — и то, и другое (TCP-сокет);
- **Transform** — Duplex + превращает данные на лету (сжатие, декодирование).

### pipe — сердце стримов

`readable.pipe(writable)` — автоматически перекачивает чанки: ускоряется/замедляется («backpressure»), обрабатывает `end`/`error`. Классика:

```js
import { createReadStream, createWriteStream } from "fs";
createReadStream("/app/big.bin").pipe(createWriteStream("/app/copy.bin"));
```

Копирование файла **произвольного** размера — 3 строки, O(1) по памяти.

### События Readable

Стрим — это EventEmitter (урок 13): `data` (чанк), `end` (конец), `error` (сбой). Режимы: **piped** (есть `pipe` — данные идут сами) и **flowing** (подписались на `data` — идут). Для «прочитать по чанкам и обработать» — `for await (const chunk of stream)` (стримы async-итерируемы):

```js
const rs = createReadStream("/app/data.json");
for await (const chunk of rs) {
  totalBytes += chunk.length;
}
```

TIP: `pipe` возвращает **dest** (пишущий стрим) — цепочки: `a.pipe(t).pipe(b)` (через Transform). Для логирования ошибок — подписывайтесь на `error` у **обоих** концов.

NOTE: в песочнице платформы стримы реализованы в памяти (чанки — как в реальном Node); `pipe`, события и `for await` работают идентично.

## Пример

`server.js`:

```js
import fs from "fs";
import { createReadStream, createWriteStream, promises as fsp } from "fs";

async function main() {
  // Готовим «большой» файл (в песочнице — в памяти)
  const big = Array.from({ length: 1000 }, (_, i) => "строка " + i + "\n").join("");
  await fsp.writeFile("/app/big.txt", big);

  // 1) Копирование через pipe (O(1) по памяти)
  await new Promise((resolve, reject) => {
    createReadStream("/app/big.txt").pipe(createWriteStream("/app/copy.txt"))
      .on("finish", resolve)
      .on("error", reject);
  });
  console.log("Скопировано через pipe");

  // 2) for await: посчитать байты по чанкам
  let bytes = 0;
  for await (const chunk of createReadStream("/app/big.txt")) {
    bytes += chunk.length;
  }
  console.log("Байтов (сумма чанков):", bytes);

  // 3) События: data/end/error
  const events = [];
  const rs = createReadStream("/app/big.txt");
  rs.on("data", () => events.push("data"));
  rs.on("end", () => events.push("end"));
  rs.on("error", (e) => events.push("error:" + e.code));
  await new Promise((r) => rs.on("end", r));
  console.log("Событий data:", events.filter((e) => e === "data").length, "| конец:", events[events.length - 1]);

  // 4) «Пересылка файла в HTTP-ответ» (паттерн, который делает res.sendFile)
  function streamToCollector(file) {
    return new Promise((resolve, reject) => {
      const parts = [];
      createReadStream(file)
        .on("data", (c) => parts.push(c))
        .on("end", () => resolve(Buffer.concat(parts)))
        .on("error", reject);
    });
  }
  const out = await streamToCollector("/app/copy.txt");
  console.log("«Ответ» собран:", out.length, "байт, совпадает:", out.toString() === big);
}

main().catch((e) => console.error("Ошибка:", e.message));
```

## Частые ошибки

WARN: читаете большой файл `readFileSync`/`readFile` «целиком». Для файлов больше нескольких МБ — стрим (`createReadStream` + `pipe`/`for await`).

WARN: забываете обработать `error` на стриме — сбой «молча» теряется (unhandled error). `pipe` сам не логирует: подписывайтесь на `error` у источника и приёмника.

WARN: вызываете `rs.pause()`/`resume()` в piped-режиме «для контроля» — `pipe` сам управляет backpressure. Руками — только в flowing-режиме.

WARN: ожидаете, что `pipe` вернёт Promise. Это **dest-стрим** (события `finish`/`error`). Для await-стиля — обёртка (как в примере) или `fs.copyFile` (готовая утилита для копирования).

## Практическое задание

1. Создайте файл `/app/logs/app.log` с 500 строками (циклом, `appendFile`).
2. Напишите `copyViaPipe(src, dest)` (Promise-обёртку над `pipe`, резолвится на `finish`). Скопируйте в `/app/logs/backup.log` и сравните размеры (`stat`).
3. Напишите `countLines(file)`: `for await` по `createReadStream`, посчитать строки (учитывайте `\n`).
4. Напишите `extractLines(file, from, to)`: стримом прочитать, собрать только строки с номерами `from..to`, записать в новый файл через `createWriteStream`.
5. Реализуйте `sumBytes(files)`: параллельно (Promise.all) пройтись стримами по списку файлов и вернуть общий размер.
