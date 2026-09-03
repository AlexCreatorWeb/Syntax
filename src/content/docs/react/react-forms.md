---
id: react-forms
track: react
type: guide
section: patterns
order: 5
title:
  en: "Forms & Controlled Inputs"
  ru: "Формы и управляемые инпуты"
excerpt:
  en: "Controlled inputs, submit handling, multi-field forms, validation, and the one case where uncontrolled inputs win."
  ru: "Управляемые инпуты, обработка submit, многополевые формы, валидация и один случай, когда выигрыш за uncontrolled-инпутами."
version: "react 19"
updated: 2026-09-03
relatedTask: react-012
---

Forms are where React's state model earns its keep: every keystroke updates state, and the UI always reflects the latest value. This guide covers controlled inputs, submit handling, multi-field forms, validation, and the one situation where uncontrolled inputs are lighter.

## Controlled inputs

A controlled input is one whose value is React state. You write `value` and `onChange`; every keystroke goes through your handler, so the input and the state can never drift apart.

```jsx
import { useState } from "react";

function NamePreview() {
  const [text, setText] = useState("");

  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your name"
      />
      <p>Hi, {text}</p>
    </>
  );
}
```

Because the state is the single source of truth, the boring tasks become one-liners: validation runs on every change, the submit button can be disabled while the field is empty, and live formatting (an uppercase name, a phone mask) is just a transformation applied in the handler before `setText`.

The same pattern covers every form element: `select` and `textarea` use `value` the same way. The only element with a different contract is the checkbox, which you meet in the multi-field section.

> **WARNING**
> A `value` without `onChange` makes the input read-only, and React warns about it in dev. If you want the browser to handle the input natively, use `defaultValue` instead — and never mix the two on the same element.

## Handling submit

Forms submit through the `form` element, not the button. Put `onSubmit` on the form, call `e.preventDefault()` to keep the page from reloading, and read the state — the fields were already updated by their own handlers.

```jsx
import { useState } from "react";

function Signup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | { ok } | { err }

  const submit = (e) => {
    e.preventDefault();
    if (email.includes("@") && email.includes(".")) {
      setStatus({ ok: true });
    } else {
      setStatus({ err: true });
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Sign up</button>
      {status && status.ok && <p>Welcome, {email}</p>}
      {status && status.err && <p>Invalid email</p>}
    </form>
  );
}
```

The `status` state is a tiny state machine with three positions: nothing happened, success, failure. Rendering is two conditional branches, and adding a third state later (a spinner during a real network call) is one more position — the structure does not change.

Buttons inside a form default to `type="submit"`. Any button that should not submit the form — "Cancel", "Clear" — must declare `type="button"` explicitly, or it will trigger the submit on click.

## Multiple fields

When a form has several fields, one state object per form beats one `useState` per field: the object is easy to send to the server, easy to reset, and easy to validate as a whole.

```jsx
import { useState } from "react";

function ProfileForm() {
  const [form, setForm] = useState({
    name: "",
    role: "viewer",
    email: "",
  });

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <form>
      <input value={form.name} onChange={update("name")} />
      <select value={form.role} onChange={update("role")}>
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>
      <input value={form.email} onChange={update("email")} />
    </form>
  );
}
```

The `update` factory takes the field name and returns a handler, so three fields share one line of logic. Computed keys — `[field]: e.target.value` — are what make this work for any number of fields without copying the handler.

Checkboxes and radio groups break the pattern: their meaningful value is not `e.target.value` but `e.target.checked`, and a radio group updates the shared field with the option's own value, not the event.

```jsx
const [agree, setAgree] = useState(false);

<label>
  <input
    type="checkbox"
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
  />
  I accept the terms
</label>
```

> **WARNING**
> A checkbox's `e.target.value` is always the string `"on"`. Read `e.target.checked` for the boolean, and store booleans in state — otherwise your validation logic will compare strings forever.

## Validation

Validate in one place: a pure function that takes the form object and returns an errors map. Show the errors only after the user has tried to submit, not on the first keystroke — a form that yells before it was touched feels broken.

```jsx
import { useState } from "react";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Invalid email";
  return errors;
}

function SignupForm() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(form);
  const shown = submitted ? errors : {};

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      console.log("submit", form);
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
      {shown.name && <p role="alert">{shown.name}</p>}
      <button type="submit" disabled={submitted && Object.keys(errors).length > 0}>
        Sign up
      </button>
    </form>
  );
}
```

The `submitted` flag is the whole trick: `errors` is recomputed on every render (it is derived data, not state), and what the user sees depends on whether they have tried once. Fixing the field clears the error immediately, without an extra "touched" bookkeeping per field.

## Uncontrolled inputs

When a form is plain data entry with no live cross-field logic — no validation, no formatting, no dependent fields — `defaultValue` plus reading `FormData` on submit is lighter: no state, no re-render per keystroke.

```jsx
import { useRef } from "react";

function LegacyForm() {
  const emailRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get("email"), data.get("role"));
    emailRef.current.focus();
  };

  return (
    <form onSubmit={submit}>
      <input ref={emailRef} defaultValue="" name="email" />
      <select defaultValue="viewer" name="role">
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>
      <button type="submit">Send</button>
    </form>
  );
}
```

The hybrid is common in practice: the fields that need live logic (search box, name preview) are controlled, the rest are uncontrolled and read once on submit. Do not mix `value` and `defaultValue` on the same input, and decide per form, not per mood.

> **TIP**
> Default new inputs to controlled. The moment a form needs validation, formatting, or cross-field logic, an uncontrolled form becomes a migration project — start where you will end.

<!-- RU -->

Формы — место, где state-модель React окупается: каждый символ ввода обновляет state, и UI всегда отражает последнее значение. Этот гайд разбирает управляемые инпуты, обработку submit, многополевые формы, валидацию и один случай, когда uncontrolled-инпуты легче.

## Управляемые инпуты

Управляемый (controlled) инпут — тот, чьё значение живёт в state React. Вы пишете `value` и `onChange`; каждый символ проходит через ваш обработчик, поэтому инпут и state никогда не расходятся.

```jsx
import { useState } from "react";

function NamePreview() {
  const [text, setText] = useState("");

  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your name"
      />
      <p>Hi, {text}</p>
    </>
  );
}
```

Так как state — единственный источник правды, скучные задачи становятся однострочниками: валидация работает на каждом изменении, submit-кнопка может быть disabled, пока поле пустое, а живое форматирование (имя в верхнем регистре, маска телефона) — это просто преобразование, применённое в обработчике до `setText`.

Та же схема работает для всех форм-элементов: `select` и `textarea` используют `value` так же. Единственный элемент с другим контрактом — checkbox, с ним вы встретитесь в разделе про многополевые формы.

> **WARNING**
> `value` без `onChange` делает инпут read-only, и React ворчит об этом в dev. Если хотите, чтобы браузер обрабатывал инпут нативно, используйте `defaultValue` — и никогда не смешивайте оба на одном элементе.

## Обработка submit

Форма сабмитится через элемент `form`, а не через кнопку. Поставьте `onSubmit` на форму, вызовите `e.preventDefault()`, чтобы страница не перезагружалась, и читайте state — поля были обновлены их собственными обработчиками.

```jsx
import { useState } from "react";

function Signup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | { ok } | { err }

  const submit = (e) => {
    e.preventDefault();
    if (email.includes("@") && email.includes(".")) {
      setStatus({ ok: true });
    } else {
      setStatus({ err: true });
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Sign up</button>
      {status && status.ok && <p>Welcome, {email}</p>}
      {status && status.err && <p>Invalid email</p>}
    </form>
  );
}
```

State `status` — крошечный конечный автомат из трёх позиций: ничего не происходило, успех, сбой. Рендер — две условные ветки, а третье состояние (спиннер во время настоящего сетевого вызова) — просто ещё одна позиция, структура не меняется.

Кнопки внутри формы по умолчанию имеют `type="submit"`. Любая кнопка, которая не должна сабмитить форму — «Отмена», «Очистить» — обязана явно указывать `type="button"`, иначе клик запустит submit.

## Многополевые формы

Когда в форме несколько полей, один state-объект на форму лучше, чем один `useState` на поле: объект легко отправить на сервер, легко сбросить и легко валидировать целиком.

```jsx
import { useState } from "react";

function ProfileForm() {
  const [form, setForm] = useState({
    name: "",
    role: "viewer",
    email: "",
  });

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <form>
      <input value={form.name} onChange={update("name")} />
      <select value={form.role} onChange={update("role")}>
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>
      <input value={form.email} onChange={update("email")} />
    </form>
  );
}
```

Фабрика `update` принимает имя поля и возвращает обработчик, поэтому три поля делят одну строку логики. Вычисляемые ключи — `[field]: e.target.value` — позволяют это работать для любого числа полей без копирования обработчика.

Checkboxes и радио-группы ломают схему: их осмысленное значение — не `e.target.value`, а `e.target.checked`, а радио-группа обновляет общее поле собственным значением опции, а не событием.

```jsx
const [agree, setAgree] = useState(false);

<label>
  <input
    type="checkbox"
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
  />
  I accept the terms
</label>
```

> **WARNING**
> У checkbox'а `e.target.value` всегда строка "on". Читайте `e.target.checked` для булевого значения и храните в state булевы — иначе валидация будет вечно сравнивать строки.

## Валидация

Валидируйте в одном месте: чистая функция, которая принимает объект формы и возвращает карту ошибок. Показывайте ошибки только после того, как пользователь попытался сабмитнуть, а не с первого символа — форма, которая орёт до прикосновения, кажется сломанной.

```jsx
import { useState } from "react";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Invalid email";
  return errors;
}

function SignupForm() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(form);
  const shown = submitted ? errors : {};

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      console.log("submit", form);
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
      {shown.name && <p role="alert">{shown.name}</p>}
      <button type="submit" disabled={submitted && Object.keys(errors).length > 0}>
        Sign up
      </button>
    </form>
  );
}
```

Флаг `submitted` — весь трюк: `errors` пересчитывается на каждом рендере (это производные данные, а не state), а то, что видит пользователь, зависит от того, пробовал ли он один раз. Исправленное поле сразу очищает ошибку, без отдельного учёта «touched» на каждое поле.

## Uncontrolled-инпуты

Когда форма — просто ввод данных без живой логики между полями — без валидации, форматирования и зависимых полей — `defaultValue` плюс чтение `FormData` при submit легче: ни state, ни перерисовка на каждый символ.

```jsx
import { useRef } from "react";

function LegacyForm() {
  const emailRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get("email"), data.get("role"));
    emailRef.current.focus();
  };

  return (
    <form onSubmit={submit}>
      <input ref={emailRef} defaultValue="" name="email" />
      <select defaultValue="viewer" name="role">
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>
      <button type="submit">Send</button>
    </form>
  );
}
```

Гибрид в практике распространён: полям, которым нужна живая логика (поиск, превью имени), — controlled, остальным — uncontrolled с чтением один раз при submit. Не смешивайте `value` и `defaultValue` на одном инпуте, и решайте по форме, а не по настроению.

> **TIP**
> Новые инпуты по умолчанию делайте controlled. Как только форме понадобятся валидация, форматирование или логика между полями, uncontrolled-форма превращается в проект миграции — начинайте там, где вы закончите.
