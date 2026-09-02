# Урок 12. Buffer и кодировки (utf8, base64, hex)

## Цель

После урока студент сможет: объяснять, что Buffer — это «сырые байты» (в отличие от строки), создавать Buffer (`from`,.alloc`), конвертировать между строкой и байтами в кодировках `utf8`/`base64`/`hex`, работать с подынками (`subarray`, `slice`), сравнивать/склеивать (`equals`, `concat`) и понимать, где байты живут «под» строками (файлы, сеть, протоколы).

## Теория

### Строка vs байты

JS-строка — последимость **символов** (UTF-16). Но файлы, сеть, изображения — **байты**. **Buffer** — фиксированный блок байтов (обёртка над `Uint8Array`). Когда вы «читаете файл как `utf8`» — Node **декодирует** байты в строку; «без encoding» — возвращает Buffer (сырые байты).

### Создание

```js
const b1 = Buffer.from("привет");              // из строки (utf8 по умолчанию)
const b2 = Buffer.from([0x48, 0x69]);          // из массива байтов
const b3 = Buffer.from("aGVsbG8=", "base64");  // из base64-строки
const b4 = Buffer.from("486962", "hex");       // из hex
const b5 = Buffer.alloc(4);                    // 4 нуля (инициализировано)
const b6 = Buffer.byteLength("привет");        // сколько байт займёт строка (utf8)
```

### Кодировки и конвертация

`buffer.toString(encoding)` / `Buffer.from(str, encoding)`. Основные:

- `utf8` — текст (по умолчанию);
- `base64` — «байты как строка» (для JSON/HTTP, картинки в data-URI);
- `hex` — два символа на байт (логи, отладка).

```js
const b = Buffer.from("Hi!");
b.toString("utf8");    // "Hi!"
b.toString("base64");  // "SGEh"
b.toString("hex");     // "486921"
Buffer.from("SGEh", "base64").toString(); // "Hi!" — обратно
```

Мультибайтность: `Buffer.byteLength("é")` → 2 (UTF-8), `Buffer.byteLength("я")` → 2, эмодзи `Buffer.byteLength("😀")` → 4. Резать **строку** по байтам без учёта кодировки — «крашеете» символы.

### Операции над байтами

```js
b.length;                  // размер в байтах
b[0];                      // байт по индексу (0–255)
b.subarray(1, 3);          // вид на подынток (без копирования!)
Buffer.concat([b1, b2]);   // склеить (создаёт новый)
b1.equals(b2);             // побайтовое сравнение
b.indexOf(Buffer.from("i")); // поиск подынка
```

`subarray` — **view** (не копия): изменение оригинала видно в «субмассиве». Для «скопировать кусок» — `subarray(...).buffer.slice` или `Buffer.from(sub)`.

TIP: для «сколько весит строка» — `Buffer.byteLength(str, "utf8")` (важно для лимитов полей БД, заголовков HTTP). Для «байты → человек» (размер файла) — делите на 1024/1048576.

NOTE: в песочнице Buffer — полная реализация (те же байты, что в Node). `Buffer` доступен как глобальный (в Node и в песочнице — один и тот же API).

## Пример

`server.js`:

```js
// 1) Создание и кодировки
const b = Buffer.from("Node и байты");
console.log("utf8 байт:", b.length, "| byteLength:", Buffer.byteLength("Node и байты"));
console.log("base64:", b.toString("base64"));
console.log("hex:", b.toString("hex"));

// 2) Обратная конвертация
const back = Buffer.from(b.toString("base64"), "base64");
console.log("base64 → utf8 совпадает:", back.equals(b));

// 3) subarray (view) + concat
const raw = Buffer.from([1, 2, 3, 4, 5, 6]);
const part = raw.subarray(1, 4);
console.log("subarray(1,4):", part.toString("hex"));
const merged = Buffer.concat([Buffer.from("AB"), Buffer.from("CD")]);
console.log("concat:", merged.toString());

// 4) «Протокол»: заголовок (1 байт длина) + тело
function packMessage(str) {
  const body = Buffer.from(str, "utf8");
  const header = Buffer.from([body.length]); // упрощение: длина < 256
  return Buffer.concat([header, body]);
}
function unpackMessage(buf) {
  const len = buf[0];
  return buf.subarray(1, 1 + len).toString("utf8");
}
const wire = packMessage("привет");
console.log("В «кабель»:", wire.toString("hex"), "→ распаковка:", unpackMessage(wire));

// 5) byteLength для «лимитов»
const limit = 64;
const msg = "сообщение для проверки лимита";
console.log("В лимит", limit, "байт?", Buffer.byteLength(msg) <= limit);
```

## Частые ошибки

WARN: сравниваете Buffer через `===` (сравнение ссылок). Содержимое — `a.equals(b)`.

WARN: режете строку «по байтам» (`str.slice` по byteLength) — ломаете мультибайтные символы (кириллица, эмодзи). Резайте **Buffer** (`subarray`) и декодируйте.

WARN: `Buffer.alloc(n)` vs `Buffer(n)` (устаревший): `Buffer(n)` — **не инициализированные** байты (мусор/данные из старых строк). Всегда `Buffer.alloc`/`Buffer.from`.

WARN: забываете кодировку в `Buffer.from(str)` для «не-utf8» источников (base64/hex) — «крашеете» данные. Явно: `Buffer.from(s, "base64")`.

## Практическое задание

1. Напишите `toHexTable(str)`: Buffer → массив hex-пар байтов (каждый байт как `XX`). Выведите для "Syntax".
2. Напишите `encodeBase64FileContent(str)` и `decodeBase64FileContent(b64)` — обратимая пара. Проверьте: декод(кодиров(«привет, мир!»)) === «привет, мир!».
3. Реализуйте `chunkedEncode(str, size)`: разбить Buffer на чанки по `size` байтов (последний может быть короче), вернуть массив base64-строк.
4. Напишите `messageSize(str)`: 1 байт заголовок (длина) + тело (utf8). Проверьте: для строки >255 байт — бросить ошибку «too long».
5. Посчитайте `Buffer.byteLength` для: "a", "я", "é", "😀" — объясните (комментарием) каждый результат.
