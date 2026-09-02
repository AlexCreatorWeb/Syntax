// Урок 3: колбэки и Promise — обёртка, цепочки, Promise.all
import fs from "fs";

// TODO: напишите обёртку readJson(file) → Promise (объект) поверх колбэк fs.readFile
//   new Promise((resolve, reject) => { fs.readFile(file, "utf8", (err, data) => { … }) });

// Готовим файлы
fs.writeFileSync("/app/data/a.json", JSON.stringify({ course: "Node" }));
fs.writeFileSync("/app/data/b.json", JSON.stringify({ lessons: 26 }));

// TODO: цепочка readJson(a) → readJson(b) → console.log объединённого объекта;
//   в конце .catch (сбой) и .finally ("Цепочка завершена")

// TODO: Promise.all из двух readFile (fsp) по a.json и b.json → console.log("Параллельно")
