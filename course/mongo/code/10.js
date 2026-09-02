// Урок 10: Embed vs Reference
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const db = client.db("course");

// TODO EMBED: orders с items: [{ name, qty, price }] (ограниченное) — 1 заказ, 3 позиции
//   → чтение: ОДИН запрос (выведите total + позиции)
// TODO REFERENCE: posts + comments (postId-ref) — 1 пост, 3 комментария
//   → чтение: ДВА запроса (пост + comments.find({ postId }))
// TODO: «сборка» по ссылкам: 3 поста → comments.find({ postId: { $in: ids } })
// TODO (комментарий): для каждой связи — embed или reference и ПОЧЕМУ (по правилу)
// TODO (комментарий): что будет, если встроить «бесконечные» комментарии в пост (16 МБ + дубли)
