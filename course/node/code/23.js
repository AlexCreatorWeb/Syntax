// Урок 23: ORM/ODM — Prisma-паттерны (имитация на in-memory)
import express from "express";

// TODO: «Prisma-имитация»: объект prisma { user: { findMany({where}), create({data}), update, delete },
//   post: { findMany({where}), create({data, include}) } } поверх in-memory массивов
//   (в терминале: import { PrismaClient } from "@prisma/client" + schema.prisma)
// TODO: GET /api/users (с ?q= — contains по email)
// TODO: POST /api/posts ({ title, authorId }; include: { author: true }) → 201
// TODO: GET /api/posts (фильтр ?published=true/false)
// TODO: GET /api/users/:id/posts (findMany { where: { authorId } })
// TODO: withTransaction([ops]) — применить все или откатить при ошибке
// TODO: в комментарии — Mongoose-схема Article (title required, tags [String], timestamps)

const app = express();
app.use(express.json());
app.listen(3000, () => console.log("ORM-паттерны на :3000"));
