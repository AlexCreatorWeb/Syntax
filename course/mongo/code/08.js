// Урок 8: операторы выборки
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const orders = client.db("course").collection("orders");
await orders.deleteMany({});
// TODO: 8 заказов { total, status: new|paid|shipped, city, items (число) }

// TODO: total > 5000 ($gt)
// TODO: status ∈ {paid, shipped} ($in)
// TODO: city = "Москва" И total < 3000 (неявный AND)
// TODO: $or: «дешёвые (<1000) ИЛИ status = shipped»
// TODO: $unset city у двух заказов → $exists: false (найдите их)
// TODO: $regex: city «начинается на М» (i); «содержит 'ав'»
// TODO: комбин: paid, total 2000..10000, city != "Новосибирск" — одним запросом
