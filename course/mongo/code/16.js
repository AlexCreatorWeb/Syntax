// Урок 16: Mongoose — connect, Schema, Model, CRUD
import mongoose from "mongoose";

// TODO: mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017"); выведите readyState
// TODO: схема Task: title (String, required), done (Boolean, default false),
//   due (Date), tags ([String], default []), createdAt (Date, default Date.now)
// TODO: const Task = mongoose.model("Task", schema)
// TODO: create 3 задач (одна с due) → выведите дефолты
// TODO: find({ done: false }); findById; find({ tags: "urgent" })
// TODO: doc.done = true; await doc.save() — сохранилось?; Task.updateOne({ $set: { due: … } })
// TODO: countDocuments; deleteOne; финальный countDocuments
// TODO (комментарий): 3 преимущества Mongoose над сырым драйвером
