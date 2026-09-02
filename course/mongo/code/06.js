// Урок 6: updateOne / updateMany — $set vs замена, upsert
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const products = client.db("course").collection("products");
await products.deleteMany({});
// TODO: 3 продукта { name, price, stock }

// TODO: updateOne + $set: у первого price +10%; $inc: stock: -1 → выведите документ
// TODO: $unset: удалите stock у второго
// TODO: upsert-счётчик pageviews по path: /home (5 раз), /about (2 раза) → выведите обе записи
// TODO: «ловушка»: вставьте { x: 1, y: 2 }, обновите updateOne(…, { x: 99 }) БЕЗ $set
//   → выведите (y пропал?) и почините через $set
// TODO (комментарий): почему matchedCount: 0 → 404 в API
