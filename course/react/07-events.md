# Урок 7. События и контролируемые формы

## Цель
После урока студент сможет: обрабатывать события React (`onClick`, `onChange`, `onSubmit`); создавать **контролируемые** поля форм; связывать input и состояние и отправлять форму без перезагрузки.

## Теория
### События в React
React обрабатывает события **атрибутами** с префиксом `on` + **заглавной** буквы: `onClick`, `onChange`, `onSubmit`, `onKeyDown`. Это те же DOM-события, но в **каме́ль-кейс** и как пропс компонента.
```jsx
function App() {
  return (
    <button onClick={(e) => console.log("клик!", e)}>Нажми</button>
  );
}
```
Первый аргумент обработчика — **объект события** `e` (или `event`). У клика — `e.target` (элемент), у input — `e.target.value` (введённый текст).

### Контролируемые компоненты
**Контролируемый** (controlled) компонент — тот, чей «источник правды» — **состояние React**, а не сам DOM. Для input это связка `value` + `onChange`:
```jsx
function App() {
  const [name, setName] = useState("");
  return (
    <input
      value={name}              // значение БЕРЁМ из состояния
      onChange={(e) => setName(e.target.value)}  // и ПЕРЕДАЁМ обратно
    />
  );
}
```
Каждое нажатие клавиши → `onChange` → `setName` → перерендер → `value` снова из состояния. Поле и состояние **синхронны** — это и есть «контролируемое» поле. Вы **полностью** управляете значением.

### Отправка формы: onSubmit и preventDefault
Форма отправляется по `onSubmit`. По умолчанию браузер **перезагружает** страницу — в React (SPA) мы это отменяем:
```jsx
const handleSubmit = (e) => {
  e.preventDefault();   // отменяем перезагрузку
  console.log("данные:", { name, email });
};
return (
  <form onSubmit={handleSubmit}>
    <input value={name} onChange={(e) => setName(e.target.value)} />
    <button type="submit">Отправить</button>
  </form>
);
```
**Всегда** вызывайте `e.preventDefault()` в `onSubmit`, если не хотите перезагрузки. Кнопку делайте `type="submit"`, чтобы срабатывала и по Enter.

### Разные события разных полей
- **`onChange`** — для `input`, `select`, `textarea` (при каждом изменении).
- **`onClick`** — для кнопок.
- **`onSubmit`** — для формы.
- **`onKeyDown`** — для клавиш (`e.key === "Enter"`).

TIP: Держите **одно** состояние на форму (объект) или **отдельные** состояния на каждое поле — оба подхода валидны. Для небольших форм отдельные переменные читабельнее; для больших — объект `const [form, setForm] = useState({ name: "", email: "" })` и `setForm({ ...form, name: e.target.value })`.

## Пример
Регистрация по-React:
```jsx
import { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted({ name, email });
  };

  if (submitted) {
    return (
      <h2>
        Спасибо, {submitted.name}! На {submitted.email} отправлено письмо.
      </h2>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
      <input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
export default App;
```
Разбор: два **контролируемых** поля, `onSubmit` отменяет перезагрузку и сохраняет данные в `submitted`. После отправки — **early return** (урок 5) показывает «спасибо» вместо формы. Классический цикл: данные → UI → событие → новые данные.

## Частые ошибки
WARN: **Забыли `e.preventDefault()`** в `onSubmit` — страница **перезагружается**, всё состояние пропадает. В SPA-формах это почти всегда нужно.
WARN: **Забыли `onChange`** у input с `value` — React выдаст предупреждение «value without onChange», поле станет **нечитаемым** (нельзя печатать). Контролируемое поле = `value` **и** `onChange`.
WARN: **`type="button"` vs `type="submit"`**: в форме обычная кнопка **по умолчанию** `type="submit"` и отправляет форму. Если кнопка **не** должна отправлять (например «Очистить») — явно `type="button"`.
WARN: Чтёте `e.target.value`, но обработчик повесили **на кнопку** (у кнопки нет `value` как текста). `value` есть у `input`/`textarea`. Для «отправить и очистить» — вызывайте `setName("")` после отправки.

## Практическое задание
1. Создайте `InputDemo`: `useState("")`, контролируемый `<input>`, ниже `<p>Вы ввели: {text}</p>`.
2. Создайте `TodoForm`: поле + кнопка `type="submit"`, `onSubmit` с `preventDefault`, добавляет текст в `useState([])` и **очищает** поле.
3. Отрендерите список задач через `.map()` с `key`.
4. Добавьте кнопку `type="button"` «Очистить всё» (не отправляет форму).
5. Бонус: добавьте `<select>` со статусами («новое/в работе/готово») как **контролируемый** компонент и показывайте выбранный статус.
