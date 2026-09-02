# Урок 2. JSX: HTML внутри JavaScript

## Цель
После урока студент сможет: писать валидный JSX; подставлять JavaScript-выражения через `{}`; знать отличия JSX от HTML (className, style, self-closing теги) и не путать строки с выражениями.

## Теория
### JSX — это расширение JavaScript
**JSX** (JavaScript XML) — синтаксис, позволяющий писать разметку прямо в JS-коде. Это **не** HTML и **не** шаблонный язык: после сборки (Babel/Vite) JSX превращается в обычные вызовы функций `React.createElement(…)`. Пока вы пишете JSX, он **выглядит** как HTML, но **работает** как JavaScript — и в нём действуют правила JS.

### Выражения внутри JSX
Внутри тегов можно вставлять **любое** JavaScript-выражение в фигурных скобках `{}`:
```jsx
const name = "Синтаксис";
const year = new Date().getFullYear();
const isReady = true;

export default function App() {
  return (
    <div>
      <h1>{name}</h1>
      <p>Сейчас {year} год. 2 + 2 = {2 + 2}.</p>
      <p>Готово? {isReady ? "Да" : "Нет"}</p>
      <ul>
        {["React", "JSX", "Hooks"].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
```
Важно: `{}` — это **выражение**, а не «дырка для строки». `{ "Привет" }` — это строка, а `Привет` без скобок — **разметка** (React её просто отобразит текстом). Функция в скобках **вызовется**: `{formatDate()}`.

### Отличия JSX от HTML
1. **`className`, а не `class`** — `class` зарезервировано в JS.
2. **`htmlFor`, а не `for`** у `<label>`.
3. **`style` — объект**, а строка: `style={{ color: "red", fontSize: 14 }}` (camelCase, числа без единиц — React сам допишет `px`).
4. **Самозакрывающиеся теги** для одиночных: `<img />`, `<input />`, `<br />` (в HTML можно `<img>`, в JSX **обязательно** `<img />`).
5. **Один корневой элемент**: возвращаемый JSX должен быть обёрнут в один родительский тег или Fragment `<>...</>`.
6. **Комментарии** — как в JS: `{/* так */}` (HTML-комментарий `<!-- -->` в JSX — ошибка).

### Атрибуты с `data-` и `aria-`
Атрибуты `data-*` и `aria-*` пишутся как в HTML: `data-id={5}`, `aria-label="Закрыть"`. Все остальные атрибуты — по JS-правилам (имена в camelCase).

TIP: Держите в голове простое правило: **«JSX — это JavaScript в костюме HTML»**. Если хотите подставить значение — `{}`, если хотите атрибут — camelCase, если одиночный тег — закрывайте `/>`.

## Пример
Разбор частых «непоняток» в одном файле:
```jsx
const price = 1990;
const inStock = true;

export default function App() {
  return (
    <div className="card" style={{ padding: 12 }}>
      <h2>Товар</h2>
      <p>Цена: {price.toLocaleString("ru-RU")} ₽</p>
      <p>{inStock ? "В наличии" : "Под заказ"}</p>
      <button
        data-id={42}
        onClick={() => alert("Куплено!")}
        style={{ background: "green", color: "white" }}
      >
        Купить
      </button>
      <img src="https://picsum.photos/100" alt="Товар" />
      {/* Это комментарий в JSX */}
    </div>
  );
}
```
Здесь: `className` (не `class`), `style` — объект с camelCase (`background`, `color`), `{price.toLocaleString("ru-RU")}` — вызов метода, `{inStock ? … : …}` — тернарник, `<img />` — самозакрыт, `{/* … */}` — комментарий. Всё это после сборки превратится в цепочку `React.createElement` с теми же данными.

## Частые ошибки
WARN: Написали `class="card"` вместо `className="card"` — React выдаст предупреждение, а класса в DOM **не будет**. В JSX всегда `className`.
WARN: Пытались «склеить» строку и значение: `<p>{"Привет, " + name}</p>` — работает, но громоздко. Лучше один блок: `<p>{`Привет, ${name}`}</p>` (шаблонная строка) или несколько выражений: `<p>Привет, {name}!</p>`.
WARN: Забыли `{}` вокруг значения: `<p>{name}</p>` → написали `<p>name</p>` — React отобразит буквально текст «name», а не переменную.
WARN: Одиночный тег не закрыт (`<img>` без `/>`) — ошибка разбора JSX «unclosed tag». В JSX **все** одиночные теги закрываются: `<img />`, `<input />`, `<br />`.
WARN: `style="color: red"` (строка, как в HTML) — не сработает. В JSX `style` — **объект**: `style={{ color: "red" }}`.

## Практическое задание
1. Создайте компонент `Badge({ label, count })`, который возвращает `<span className="badge">{label}: {count}</span>`.
2. В `App` создайте переменные `const title = "Задачи"` и `const total = 7` и отрендерите `<Badge label={title} count={total} />`.
3. Добавьте `<p>` с вычислением: «Всего задач: {total}, в день: {Math.ceil(total / 7)}».
4. Отрендерите `<button>` с `onClick={() => alert("Нажато!")}` и стилем-объектом `style={{ padding: "8px 16px" }}`.
5. Бонус: добавьте `data-id` и `aria-label` на кнопку и убедитесь, что они попали в превью.
