// Урок 8: структура проекта — слои (model → service → controller → route)
import express from "express";

// ===== model (in-memory пользователи) =====
// TODO: usersDB + userModel { list, get, create }
// ===== service (бизнес: email обязателен, с "@", уникальный) =====
// TODO: userService { list, create } — ошибки "EMAIL_REQUIRED"/"EMAIL_TAKEN"
// ===== controller (HTTP: body → service → res; ошибки → 400/409) =====
// ===== route (Router: GET /, POST /, GET /:id) =====
const app = express();
app.use(express.json());
// TODO: app.use("/api/users", usersRouter)
// TODO: 404-хвост
app.listen(3000, () => console.log("Слои: route → controller → service → model"));
// TODO: в комментарии вверху — дерево папок (src/routes, src/controllers, …) для терминала
