// Урок 11: практика моделирования — блог + магазин
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const blog = client.db("blog");

// TODO: users (email, name, postsCount) / posts (title, body, authorId-ref, tags-embed,
//   likesCount, commentsCount, publishedAt) / comments (postId-ref, authorId-ref, text)
// TODO: 2 юзера, 3 поста (разные теги), 6 комментариев → $inc счётчиков (postsCount, commentsCount)
// TODO: «соберите» пост (автор + комментарии); проверьте commentsCount = факту
// TODO: поиск по тегу: find({ tags: "nosql" })
// TODO магазин: products (specs-embed) + orders (items-embed с КОПИЕЙ name/price)
//   → смените цену товара — «история» в заказе не изменилась
// TODO (комментарий): 3 решения схемы + «почему»
