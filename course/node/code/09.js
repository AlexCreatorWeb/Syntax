// Урок 9: path — join/resolve/parse, защита от ..-выхода
import path from "path";

// TODO: функция buildReportPath(year, month, id) → path.join("reports", String(year), padStart-месяц, id + ".json")
// TODO: функция fileNameOnly(p) → { name, ext, dir } через path.parse
// TODO: функция isInside(base, target) → true, если target внутри base
//   (через path.relative: не начинается с ".." и не абсолютный)
console.log("join:", path.join("uploads", "avatars", "user-42.png"));
console.log("parse:", path.parse("/home/api/data/reports/2026-09.json"));
// TODO: выведите isInside("/srv/app", "/srv/app/uploads/a.png") → true
// TODO: выведите isInside("/srv/app", "/etc/passwd") → false
