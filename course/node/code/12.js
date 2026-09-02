// Урок 12: Buffer и кодировки — utf8/base64/hex, subarray, concat
const b = Buffer.from("Syntax");
// TODO: выведите b.length, b.toString("base64"), b.toString("hex")
// TODO: функция encodeBase64(str) и decodeBase64(b64) — обратимая пара
// TODO: функция chunkedEncode(str, size) → Buffer → чанки по size байт → массив base64-строк
// TODO: функция messageSize(str) → 1 байт заголовок (длина) + тело utf8; > 255 → throw "too long"
// TODO: выведите Buffer.byteLength для "a", "я", "é", "😀" — объясните каждый результат
console.log("hex:", b.toString("hex"));
