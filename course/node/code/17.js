// Урок 17: Express — первый сервер, res.json, 404
import express from "express";

const app = express();
app.use(express.json()); // body-парсер ДО маршрутов

const notes = [{ id: 1, text: "Первая" }, { id: 2, text: "Вторая" }];
let nextId = 3;

// TODO: GET /notes → 200 (с ?per=N — срез)
// TODO: GET /notes/:id → 200 / 404 (Number(req.params.id)!)
// TODO: POST /notes → 201; без "text" → 400
// TODO: DELETE /notes/:id → 204 / 404
// TODO: 404-хвост: app.use((req, res) => res.status(404).json({ error: "not found" }))

app.listen(3000, () => console.log("Express API на :3000"));
