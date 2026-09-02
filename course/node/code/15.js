// Урок 15: URL, query, JSON API — GET/POST, body
import http from "http";

function sendJson(res, code, obj) { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const notes = [{ id: 1, text: "Первая" }, { id: 2, text: "Вторая" }];
let nextId = 3;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const { pathname } = u;
  // TODO: GET /notes → 200 (список)
  // TODO: GET /notes/:id → 200 / 404
  // TODO: POST /notes → 201; body без "text" или пустой → 400; JSON.parse в try/catch → 400
  // TODO: GET /notes/search?q=… → поиск по подстроке (регистр не важен)
  // TODO: DELETE /notes/:id → 204 / 404
});
server.listen(3000, () => console.log("JSON API (URL + body) на :3000"));
