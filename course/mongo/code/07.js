// Урок 7: deleteOne / deleteMany — CRUD
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const todos = client.db("course").collection("todos");
await todos.deleteMany({});
// TODO: 5 todo { text, done, owner } (2 done: true; owner: u1/u2)

// TODO: deleteOne по _id; повторное удаление → deletedCount: 0
// TODO: deleteMany({ done: true }) — сколько удалилось
// TODO: CRUD-объект { create, list, get, update, remove(id, owner) } (remove — только свои)
// TODO: проверьте: удалить чужой todo → 0 (404); полный цикл CRUD для одного
// TODO (комментарий): soft vs hard delete — 2 примера каждого
