// Урок 13: производительность
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const metrics = client.db("perf").collection("metrics");
await metrics.deleteMany({});
// TODO: 1000 метрик { service (5), ts: Date, latency: число }

// TODO: distinct("service"); countDocuments по каждому сервису; estimatedDocumentCount()
// TODO: индекс { service: 1, ts: -1 }; запрос «service = X, ts > сейчас-1ч» — количество
// TODO: «топ-10 по latency»: sort({ latency: -1 }).limit(10), проекция { service: 1, latency: 1, _id: 0 }
// TODO: курсорная пагинация (2 страницы по 50, по ts) — не пересекаются
// TODO (комментарий): что медленнее — countDocuments({service:"a"}) или estimatedDocumentCount()
