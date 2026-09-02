// Урок 4: insertOne / insertMany
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const books = client.db("course").collection("books");

// TODO: insertMany из 5 объектов { title, pages, year } → выведите insertedCount
// TODO: insertOne с явным _id: "ISBN-2026-001" → найдите findOne({ _id: "ISBN-2026-001" })
// TODO: сгенерируйте 30 отзывов { text, rating (1..5), date } → insertMany → countDocuments
// TODO: найдите «самую свежую» (sort({ _id: -1 }).limit(1)) — почему _id = «время»? (комментарий)
// TODO (комментарий): что вернёт insertMany при дубликате _id; как обработать в API (409)
