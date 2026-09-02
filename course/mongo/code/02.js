// Урок 2: документы, BSON, ObjectId
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const books = client.db("course").collection("books");

// TODO: вставьте 3 книги с РАЗНЫМИ наборами полей:
//   одна с author: { name, country } (объект), другая с genres: [..] (массив), все с createdAt: new Date()
// TODO: ObjectId.isValid для: нового id, "665f1f77bcf86cd799439011", "abc", 5
// TODO: найдите первую книгу по _id (ObjectId) и по его СТРОКЕ (оба способа)
// TODO: выведите createdAt всех книг — убедитесь, что это Date
// TODO (комментарий): 4 BSON-типа, которых нет в JSON, и зачем каждому
