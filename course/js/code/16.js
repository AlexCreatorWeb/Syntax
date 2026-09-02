// Урок 16. Массивы: создание и базовые методы. Запустите (Run) — смотрите консоль.

const a = [1, 2, 3];
console.log(a[0], a[a.length - 1]); // 1 3

// «Создание**:
const c = Array.from("abc");
console.log(c); // ["a", "b", "c"]

// «Ссылка** vs «копия»:
const orig = [1, 2];
const ref = orig;
ref.push(3);
console.log(orig); // ??? (ссылка!)
const copy = [...orig];
copy.push(4);
console.log(orig); // ??? («копия** «не** «трогает** «оригинал»)

// TODO 1: stack «API» — { push, pop, peek, isEmpty } (через «массив» + «методы»)
//         const st = makeStack(); st.push(1); st.push(2); console.log(st.pop(), st.peek(), st.isEmpty())
// TODO 2: insertAt(arr, i, x) — «новый** «массив** «с** x «на** i (slice + spread)
// TODO 3: removeLast(arr, n) — «массив** «без** «последних** n
// TODO 4: «вызовите** [1,2,3,4].splice(1) — «что» «стало**? «Почему**?
// TODO 5 (бонус): Array.from({length: 5}, (_, i) => i * i) — «что** «даст**? «Объясните** _
