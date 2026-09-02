// Урок 27. JSON: сериализация и ловушки. Запустите (Run) — смотрите консоль.

const user = {
  name: "A",
  age: 25,
  temp: undefined,        // «исчезнет**
  fn: () => {},           // «исчезнет**
  born: new Date(2000, 0, 1), // → «строка**
  tags: ["js", null, "css"],
};

// TODO 1: JSON.stringify(user) → console.log. «Что** «исчезло**? «Что** «превратилось**?
// TODO 2: JSON.parse(text) → «проверьте** obj.temp, typeof obj.born
// TODO 3: «красивый** «вывод**: JSON.stringify(user, null, 2)

// TODO 4: save(key, value) / load(key, fallback) «с** try/catch (localStorage)
// TODO 5 (бонус): «объясните** «порядок** «ключей** «в** «результате** «stringify
