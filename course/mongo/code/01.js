// Урок 1: NoSQL и MongoDB — подключение, БД/коллекция, первая запись
import { MongoClient } from "mongodb";

// TODO: подключитесь к process.env.MONGO_URL (фолбэк "mongodb://localhost:27017")
// TODO: client.db("course"), коллекция "students"
// TODO: insertOne { name: "Студент 1", course: "Mongo", skills: ["js"] } → выведите insertedId
// TODO: выведите countDocuments({}) и find() (JSON.stringify)
// TODO (комментарий): эквивалентные mongosh-команды (use course / db.students.insertOne / db.students.find)
