// Урок 14: http с нуля — createServer, req/res, статус-коды
import http from "http";

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const path = req.url.split("?")[0];
  // TODO: GET / → 200 { app: "node-course", version: "1.0.0" }
  // TODO: GET /health → 204 (без тела)
  // TODO: GET /time → 200 { now: ISO }
  // TODO: POST /register → 201 { id: 1 }; GET /register → 405
  // TODO: GET /old → 302 (Location: /)
  // TODO: остальное → 404 JSON { error }
});
server.listen(3000, () => console.log("HTTP-сервер (без фреймворка) на :3000"));
