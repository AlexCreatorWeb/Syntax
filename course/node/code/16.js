// Урок 16: мини-фреймворк — middleware (req, res, next) + роутинг :param
import http from "http";

// TODO: функция createApp() → объект app с методами:
//   use(pattern, fn) — middleware (для всех)
//   get(path, fn), post(path, fn) — маршруты
//   handle(req, res) — конвейер: сначала use-функции (next = следующий), затем маршрут
//   listen(port, cb) — http.createServer + listen
// TODO: функция matchPattern(pattern, path) → { params } или null
//   (":id" в pattern → любой сегмент, сохранить в params)
// TODO: функция sendJson(res, code, obj)

// Использование (раскомментируйте после реализации):
// const app = createApp();
// app.use("/", (req, res, next) => { console.log("LOG:", req.method, req.url); next(); });
// app.get("/items/:id", (req, res) => sendJson(res, 200, { id: req.params.id }));
// app.listen(3000, () => console.log("Мини-фреймворк на :3000"));
