# Урок 17. Mongoose: валидация, defaults, timestamps, virtuals

## Цель

После урока студент сможет: настраивать **валидацию** (required, мин/макс, enum, кастомные), **дефолты** (значения по умолчанию), **timestamps** (автоматические `createdAt`/`updatedAt`), **virtuals** (вычисляемые поля в ответе) и **статик-методы** модели — собирать «боевую» production-схему.

## Теория

### Валидация

Правила в схеме — проверяются при `create`/`save` (сбой → `ValidationError`):

```js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 18, max: 120 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  username: { type: String, minlength: 3, maxlength: 20, match: /^[a-z0-9_]+$/i },
  // кастомная:
  website: {
    type: String,
    validate: {
      validator: (v) => !v || /^https?:\/\//.test(v),
      message: "website должен начинаться с http(s)://",
    },
  },
});
```

`required` — «обязательно» (пустая строка — тоже ошибка). `unique` — создаёт **unique-индекс** (урок 12). Ошибка: `err.name === "ValidationError"`, `err.errors` — по полям (в API → 400 с деталями).

### Defaults

`default: значение` (или **функция** — для «свежих» значений: `default: Date.now`). Применяется при создании (если поле не задано).

### Timestamps

`{ timestamps: true }` в опциях схемы — Mongoose **автоматически** ставит `createdAt` (при создании) и `updatedAt` (при каждом `save`/`update`). Не нужно руками.

### Virtuals

**Вычисляемое** поле (не хранится в БД, появляется в JSON):

```js
schema.virtual("fullName").get(function () { return this.first + " " + this.last; });
// чтобы virtuals были в JSON: schema.set("toJSON", { virtuals: true });
```

### Статик-методы

`schema.static("findByEmail", function (email) { return this.findOne({ email }); })` — `User.findByEmail("…")` (удобные «доменные» методы модели).

TIP: валидация — **на входе** (до БД). «Дорогие» проверки (уникальность по БД) — `unique` (индекс), не «select, потом insert» (гонки).

NOTE: в песочнице: `required` (пустая строка = ошибка), `default` (значение/функция), `type` (String/Number/Boolean/Date/[String]), `timestamps` (createdAt/updatedAt), `virtuals` (get), `static` — поддерживаются.

## Пример

`models.js`:

```js
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true, minlength: 2 },
    age: { type: Number, min: 18, max: 120 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: «полный» статус
userSchema.virtual("status").get(function () {
  return this.role === "admin" ? "админ" : "пользователь";
});
userSchema.set("toJSON", { virtuals: true });

// Статик: «найти по email»
userSchema.static("findByEmail", function (email) { return this.findOne({ email }); });

const User = mongoose.model("User", userSchema);

// 1) Create (дефолты + timestamps)
const u = await User.create({ email: "A@B.C", name: "Аня" });
console.log("email (lowercase):", u.email, "| role:", u.role, "| createdAt:", Boolean(u.createdAt));

// 2) Virtual
console.log("virtual status:", u.status);
console.log("toJSON:", JSON.stringify(u).includes("status"));

// 3) Валидация: enum
try { await User.create({ email: "x@y.z", name: "Боря", role: "superuser" }); }
catch (e) { console.log("enum:", e.name); }

// 4) Валидация: min
try { await User.create({ email: "y@z.a", name: "Вова", age: 10 }); }
catch (e) { console.log("min:", e.name); }

// 5) required (пустая строка)
try { await User.create({ email: "z@x.c", name: "  " }); }
catch (e) { console.log("required (пусто):", e.name); }

// 6) Статик
const found = await User.findByEmail("a@b.c");
console.log("findByEmail:", found ? found.name : null);

// 7) updatedAt (timestamps)
await u.save();
console.log("updatedAt >= createdAt:", u.updatedAt >= u.createdAt);
```

## Частые ошибки

WARN: `unique` **без** понимания, что это **индекс** (создаётся в БД; дубль при создании → ошибка). Для «проверки» до ответа — `findOne` + unique-индекс как «страховка».

WARN: `default: new Date()` (константа на момент **схемы**) вместо `default: Date.now` (функция — «свежая» дата на каждый документ).

WARN: `toJSON` без `virtuals: true` — виртуальные поля **нет** в API-ответе (хотя в объекте есть).

WARN: валидацию делаете **в контроллере** (вручную `if (!email)`) — дублирование правил. Валидация — **в схеме** (один источник правды).

## Практическое задание

1. Схема `Product`: `name` (required, minlength 2), `price` (Number, min 1), `category` (enum: ["tech","food","home"], default "tech"), `inStock` (Boolean, default true), `timestamps: true`.
2. Virtual `priceLabel` (`"N ₽"`), `toJSON virtuals`.
3. Статик `topByPrice(limit)` → `find({}).sort({ price: -1 }).limit(limit)`.
4. Проверьте валидацию: `price: 0` (min), `category: "sport"` (enum), `name: ""` (required) — все → ValidationError.
5. Создайте 3 товара; выведите `createdAt`/`updatedAt`; `save()` → `updatedAt` изменился.
6. В комментарии: почему `unique` на `email` — «индекс», а не «проверка в коде» (гонки).
