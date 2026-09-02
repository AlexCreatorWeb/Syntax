// Урок 5: find — фильтры, проекция, sort, limit/skip
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const employees = client.db("course").collection("employees");
await employees.deleteMany({});
// 10 сотрудников: { name, role, salary, dept, hired: Date } (разные dept: dev/design/qa/ops)
// TODO: вставьте 10 документов (insertMany)

// TODO: всех из dept: "dev"
// TODO: проекция { name: 1, salary: 1 } — убедитесь, что role нет (Object.keys)
// TODO: топ-3 по зарплате (sort salary: -1, limit 3)
// TODO: «сначала dev, потом по зарплате» (sort({ dept: 1, salary: -1 }))
// TODO: пагинация по 3 (страницы 1–3): limit/skip
// TODO: функция page(coll, { sort, size, page }) → «страница»; проверьте
