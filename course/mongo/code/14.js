// Урок 14: Aggregation — конвейер, $match, $project, $group
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const sales = client.db("analytics").collection("sales");
await sales.deleteMany({});
// TODO: 20 продаж { product (4), qty, price, ts (разные месяцы) }

// TODO: «выручка по продуктам» — $group _id:"$product", revenue: { $sum: { $multiply: ["$qty", "$price"] } } → топ-3 ($sort, $limit)
// TODO: «средний чек» по продуктам ($avg по price)
// TODO: «по месяцам» (_id: { m: { $month: "$ts" } }, сумма выручки)
// TODO: $project: revenue ($multiply) + upper ($toUpper) — первые 3
// TODO: сводка (одна группа, _id: null): сумма выручки, $sum:1 заказов, $max/$min чека
