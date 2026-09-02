// Урок 3: базы и коллекции — иерархия, создание, списки
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();

// TODO: база "course" — коллекции "students" и "courses" (неявно, записями)
// TODO: в "courses" — 3 документа { title, lessons (число), level: "beginner"|"middle" }
// TODO: в "students" — 2 документа { name, course (строка-название) }
// TODO: выведите: список коллекций "course" (listCollections), countDocuments каждой,
//   имена всех баз (listDatabases)
// TODO (комментарий): почему Posts и posts — разные коллекции; 2 правила именования
