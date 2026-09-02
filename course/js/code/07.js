// Урок 7. Условия: if, тернарник, switch. Запустите (Run) — смотрите консоль.

const score = 85;
const role = "admin";
const status = "paused";

// TODO 1: grade(score) — "A" (>=90), "B" (>=75), "C" (>=60), "D" — if-цепочка. console.log(grade(85))
// TODO 2: «то же» тернарником (одна строка) — «справьтесь»?

// TODO 3: roleMessage(role) — switch (admin/user/guest) «с» break «и» default
// TODO 4: «перепишите» roleMessage через «таблицу» (объект + ??)

// switch «демо»:
switch (status) {
  case "active": console.log("идёт"); break;
  case "paused": console.log("пауза"); break;
  default: console.log("неизвестно");
}

// TODO 5: validate(user) — early return: "нет user" / "нет email" / "ok: name"
//         Проверьте: null, {}, { name: "A", email: "a@b.c" }
// TODO 6 (бонус): tempLabel(t) — "холодно" (<10) / "прохладно" (<20) / "тепло" (<30) / "жарко"
