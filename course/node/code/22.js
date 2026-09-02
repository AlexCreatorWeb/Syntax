// Урок 22: MongoDB — драйвер, CRUD, ObjectId
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const articles = client.db("app").collection("articles");
const app = express();
app.use(express.json());
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// TODO: GET /api/articles → find (фильтр ?tag= через { "tags": tag }), sort, limit, toArray
// TODO: POST /api/articles → insertOne { title, tags: [] }; валидация title → 400; 201 с _id-строкой
// TODO: GET /api/articles/:id → findOne (new ObjectId!); 404
// TODO: PATCH /api/articles/:id → updateOne { $set: { title } }; если addTag — $push
// TODO: добавьте "вложенные" комментарии: article.comments (массив); GET /api/articles/:id/comments
// TODO: 404-хвост + error-middleware

app.listen(3000, () => console.log("MongoDB API на :3000"));
