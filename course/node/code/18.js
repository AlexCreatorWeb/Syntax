// Урок 18: Router — params, query, вложенные маршруты
import express from "express";

const app = express();
app.use(express.json());

// TODO: productsRouter (express.Router()):
//   GET / — список (?min=&max= — фильтр по цене)
//   GET /:id — 200 / 404
//   POST / — 201; валидация name + price (число) → 400
//   DELETE /:id — 204 / 404
//   + внутренний middleware-логгер (router.use((req,res,next) => { console.log(…); next(); }))
// TODO: ordersRouter: GET / (список), POST / ({ productId, qty }; нет товара → 404)
// TODO: сборка: apiRouter.use("/products", …), apiRouter.use("/orders", …), app.use("/api", apiRouter)
// TODO: 404-хвост

app.listen(3000, () => console.log("API с Router на :3000"));
