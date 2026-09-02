// Урок 15: сложные агрегации — $unwind, $lookup, $addFields
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const db = client.db("analytics");
const books = db.collection("books");
const reviews = db.collection("reviews");
await books.deleteMany({}); await reviews.deleteMany({});
// TODO: 10 книг { title, author (4 автора), year } + ~30 отзывов { bookId, rating (1..5) }

// TODO: «средний рейтинг по книгам»: $lookup reviews → $group по книге → $avg → $sort desc → $limit 3
// TODO: «топ авторов по сумме рейтингов их книг» (lookup книг → lookup reviews → group по автору)
// TODO: «книги с рейтингом > 4» ($lookup + $match ПОСЛЕ по подмешанному)
// TODO: «число книг по годам» ($group _id: "$year")
// TODO: $addFields: поле «имеет отзывы» (bool) после lookup
