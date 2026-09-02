// Урок 17: Mongoose — валидация, defaults, timestamps, virtuals
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017");

// TODO: схема Product: name (required, minlength 2), price (Number, min 1),
//   category (enum ["tech","food","home"], default "tech"), inStock (Boolean, default true),
//   опции { timestamps: true }
// TODO: virtual priceLabel ("N ₽"); schema.set("toJSON", { virtuals: true })
// TODO: static topByPrice(limit) → find({}).sort({ price: -1 }).limit(limit)
// TODO: проверьте валидацию: price: 0 (min), category: "sport" (enum), name: "" (required)
// TODO: создайте 3 товара; выведите createdAt/updatedAt; save() → updatedAt изменился
// TODO (комментарий): почему unique на email — индекс, а не «проверка в коде»
