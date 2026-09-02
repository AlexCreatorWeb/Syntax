// Урок 12: индексы
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const events = client.db("course").collection("events");
await events.deleteMany({});
// TODO: 300 событий { type (5 значений), userId (20), ts: Date }

// TODO: createIndex({ type: 1 }); составной { userId: 1, ts: -1 }; listIndexes
// TODO: explain("executionStats") для find({ type: "click" }) — найдите stage (терминал: IXSCAN)
// TODO: unique-индекс по eventId; вставьте дубль → ошибка (catch, codeName)
// TODO: dropIndex("type_1") → explain снова — что изменилось (COLLSCAN)
// TODO (комментарий): 2 поля, которые НЕ индексируете, и почему
