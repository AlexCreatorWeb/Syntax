// Урок 9: массивы и вложенность
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const orders = client.db("course").collection("orders");
await orders.deleteMany({});
// TODO: 3 заказа { user, items: [{ name, qty, price }] (3–5 позиций), profile: { city, vip } }

// TODO: заказы из profile.city = "СПб" (dot-нотация)
// TODO: «есть позиция с qty >= 3»; «есть позиция name='X' И price < 100» ($elemMatch)
// TODO: $push (позиция), $push.$each (2 позиции), $pull (убрать по name)
// TODO: tags: $addToSet (дважды — дубля нет), $pull
// TODO: выведите итоговый документ — profile не «потерял» поля (точечные dot-обновления)
// TODO (комментарий): почему комментарии — коллекция, а теги — массив
