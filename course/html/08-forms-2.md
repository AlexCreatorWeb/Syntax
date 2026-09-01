# Урок 8. Формы II: валидация и спецэлементы

## Цель
После урока студент сможет: настроить нативную валидацию (required, min/max, pattern, custom), собрать `select` с `optgroup`, `textarea`, прогресс-элементы `progress`/`meter`/`output` и отключить валидацию осознанно (`novalidate`).

## Теория

HTML5 валидация — **бесплатный** UX: браузер сам проверяет поля ДО отправки и показывает нативные подсказки (на языке пользователя). Никакого JS.

**Базовые атрибуты валидации:**
- `required` — поле обязано быть заполненным.
- `min` / `max` — диапазон (для number, date, range, length для text).
- `minlength` / `maxlength` — длина строки.
- `step` — шаг (для number/range: `step="0.1"`, `step="any"`).
- `pattern` — регулярное выражение БЕЗ ограничителей: `pattern="[А-ЯЁ][а-яё-]{2,9}"` (ФИО).
- `value` у checkbox/radio — что отправляется при выборе.

Подпись ошибки: если не хватает `label` — браузер показывает «Пожалуйста, заполните это поле» без имени; с `label` — «Имя: заполните это поле». Поэтому валидация ещё одна причина делать label правильно.

**`novalidate`** на `<form>` — отключает всю нативную валидацию формы (когда есть своя JS-валидация). `formnovalidate` на button — отключает только для ЭТОЙ кнопки отправки.

**Кастомные сообщения:** `:invalid`/`:valid`/`:user-invalid` в CSS, `setCustomValidity()` в JS (для сообщений) — пока достаточно знать CSS-селекторы.

**`<select>`** — выпадающий список:
```html
<label for="city">Город</label>
<select id="city" name="city" required>
  <option value="" disabled selected>— выберите —</option>
  <optgroup label="Запад">
    <option value="msk">Москва</option>
    <option value="spb">Санкт-Петербург</option>
  </optgroup>
  <optgroup label="Восток">
    <option value="ekb">Екатеринбург</option>
  </optgroup>
</select>
```
- `option value=""` с `disabled selected` — «пустая» стартовая позиция: заставляет выбрать (работает в паре с `required`).
- `optgroup` — группы опций. Много групп — лучше `datalist` (автодополнение, урок 12) или JS-комбо.

**`<textarea>`** — многострочный текст:
```html
<label for="msg">Сообщение</label>
<textarea id="msg" name="msg" rows="5" cols="40"
          minlength="10" maxlength="500" required
          placeholder="Опишите задачу"></textarea>
<p><output name="count">0</output> / 500</p>
```
Значение = текст МЕЖДУ тегами (если есть). `rows`/`cols` — «базовый» размер (CSS может переопределить).

**Прогресс и «индикаторы»:**
- `<progress value="70" max="100">` — **детерминированный** прогресс (загрузка, шаги). `max` по умолчанию 1.
- `<progress>` без `value` — «неопределённый» (индикатор «крутится», значение неизвестно).
- `<meter value="60" min="0" max="100" low="40" high="80" optimal="90">` — **измерение** в диапазоне (заполненность диска, рейтинг). `low/high/optimal` — подсказки для цвета.
- `<output name="result">` — результат вычисления (JS кладёт в него текст). Статичный пример: `<output>42</output>`.

## Пример: полная форма с валидацией

```html
<form action="/order" method="post">
  <h1>Оформление заказа</h1>

  <label for="name">ФИО</label>
  <input type="text" id="name" name="name" required
         pattern="[А-ЯЁA-Z][а-яёa-z- ]{2,30}"
         title="Буквы, дефис, пробел; от 3 до 31 символа">

  <label for="age">Возраст</label>
  <input type="number" id="age" name="age" min="14" max="99"
         value="18" required>

  <label for="code">Промокод (опц.)</label>
  <input type="text" id="code" name="code"
         pattern="[A-Z0-9]{4,8}" title="4–8 букв/цифр, капс"
         placeholder="SYNTAX25">

  <label for="qty">Количество (шаг 5)</label>
  <input type="number" id="qty" name="qty" value="10"
         min="0" max="100" step="5">

  <label for="delivery">Способ доставки</label>
  <select id="delivery" name="delivery" required>
    <option value="" disabled selected>— выберите —</option>
    <optgroup label="Самовывоз">
      <option value="msk-store">Магазин, Москва</option>
      <option value="spb-store">Магазин, СПб</option>
    </optgroup>
    <optgroup label="Курьер">
      <option value="courier">Курьер, 1–3 дня</option>
      <option value="post">Почта, 5–10 дней</option>
    </optgroup>
  </select>

  <label for="comment">Комментарий</label>
  <textarea id="comment" name="comment" rows="4" cols="44"
            maxlength="300" placeholder="Необязательно"></textarea>

  <p>Баланс аккаунта:
    <meter value="35" min="0" max="100" low="20" high="70" optimal="80">35%</meter>
  </p>
  <p>Загрузка: <progress value="60" max="100"></progress></p>

  <button type="submit">Оформить</button>
  <button type="submit" formnovalidate>Оформить (пропуск проверки)</button>
</form>
```

Попробуйте: оставьте ФИО пустым и отправьте — нативное сообщение; введите `abc123` в промокод — «должно соответствовать формату»; поставьте qty=7 — «должно быть кратным 5».

## Частые ошибки новичков

| Ошибка | Почему плохо | Как правильно |
|---|---|---|
| `pattern` с `^...$` внутри | В HTML5 pattern «якорится» автоматически — двойные якоря ломают | Без `^$` |
| `required` на «опциональном» поле «на всякий случай» | Пользователь ЗАСТАВЛЕН выбирать лишнее | required только по смыслу |
| `maxlength` без `title`/объяснения | «До 50 символов» — пользователь не знает лимита заранее | Показываем счётчик/лимит в label или рядом |
| `<select>` без `label` (только placeholder «Город») | Placeholder у select — не подпись, a11y-проблема | `label for` + (опц.) первый пустой option |
| `option` без `value` | Отправится ТЕКСТ опции (часто с пробелами) | Явный `value` у каждого option |
| Радио/чекбокс без `value` | Отправится "on" | Явный `value` |
| `novalidate` «чтобы браузер не мешал», но JS-валидации нет | Валидации нет НИГДЕ | Либо нативная, либо своя — не «ни одна» |
| `<progress>` для «рейтинга» (оценка качества) | Прогресс = процесс; оценка = meter | `<meter>` с low/high/optimal |
| `textarea` с `style="height: 20px"` и без rows | Хрупко, нет baseline | `rows`/`cols` + CSS |
| Валидация только на клиенте «— серверу не нужны правила» | Любой «умный» клиент обойдёт JS | Валидация — на клиенте (UX) И на сервере (правда) |

## Практическое задание

1. Добавьте в форму урока 7: `select` (3 опции, 1 optgroup), `textarea` (rows=5, maxlength=500, required, minlength=10), числовое поле «бюджет» (min=1000, max=100000, step=1000).
2. Настройте валидацию: `pattern` для поля «никнейм» (3–16 символов, латиница/цифры/_), `required` на имя/почту, `minlength=3` на никнейм.
3. Проверьте каждое правило: оставьте поле пустым → нативное сообщение; введите `ab` в никнейм → «заполните корректно».
4. Добавьте `<progress value="45">` («Шаг 2 из 4» — визуально) и `<meter>` (заполненность корзины, low/high/optimal).
5. Бонус: вторая кнопка `formnovalidate` «Отправить черновик» — убедитесь, что она пропускает проверку. Попробуйте `:invalid { border-color: red }` в CSS.
