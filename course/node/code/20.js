// Урок 20: структура приложения — routes / controllers / services
import express from "express";

// ===== model (in-memory задачи) =====
// TODO: tasksDB + taskModel { list, get, create, update, remove }
// ===== service (бизнес: title обязателен ≤100; priority: low|medium|high) =====
// TODO: tasksService { list, one, create, setDone, stats } — ошибки "TITLE_REQUIRED"/"BAD_PRIORITY"
// ===== controller (HTTP: try/catch → 400/404; asyncHandler) =====
// ===== route (Router: GET /, GET /stats, GET /:id, POST /, PATCH /:id) =====
const app = express();
app.use(express.json());
// TODO: app.use("/api/tasks", tasksRouter) + 404 + error-middleware
app.listen(3000, () => console.log("Приложение по слоям на :3000"));
// TODO: в комментарии — дерево папок (терминал) для этого кода
