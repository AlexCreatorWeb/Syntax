// Урок 18: финальный проект — API «Блог» (Mongoose + Express)
import express from "express";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017");

// TODO: userSchema (email unique, name required, postsCount default 0, timestamps)
// TODO: postSchema (title required, authorId ref User, tags [String], likesCount/commentsCount,
//   published default true, timestamps; indexes: authorId, tags)
// TODO: commentSchema (postId ref, authorId ref, text required, timestamps; index postId)
// TODO: модели User/Post/Comment (mongoose.model)

const app = express();
app.use(express.json());

// TODO: POST /api/users (дубликат email → 409) | GET /api/users/:id (404)
// TODO: POST /api/posts (создать + $inc postsCount автора; нет автора → 404)
// TODO: GET /api/posts (?tag=, ?author=; проекция без body)
// TODO: GET /api/posts/:id — сборка: post + author + comments
// TODO: POST /api/posts/:id/comments (создать + $inc commentsCount; нет поста → 404)
// TODO: DELETE /api/posts/:id (404; postsCount автора -1)
// TODO: GET /api/stats — агрегация: { users, posts, comments, topTags, byMonth }
// TODO: error-middleware: ValidationError → 400, 404, unique (11000) → 409

app.listen(3000, () => console.log("API «Блог» (Mongoose) на :3000"));
