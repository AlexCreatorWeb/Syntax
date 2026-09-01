# Урок 10. Формы II: валидация и спецэлементы

## Цель
После урока студент сможет: настроить нативную валидацию (required, min/max, pattern, novalidate), собрать `select` с `optgroup` и `textarea`, использовать прогресс-элементы `progress`/`meter` и отключить проверку осознанно.

## Теория
### Нативная валидация
HTML5 проверяет поля ДО отправки и показывает подсказки на языке пользователя — без единой строчки JS. Атрибуты: `required` (обязательно), `min`/`max` (диапазон для number/date, min для длины), `minlength`/`maxlength` (длина строки), `step` (шаг: «кратное 5», 0.1 и т.п.), `pattern` (регулярка БЕЗ якорей ^$ — HTML5 «якорит» сам).

Подсказка использует label: без него — «заполните это поле» без имени. `novalidate` на `<form>` отключает всю проверку формы (когда есть своя JS-валидация); `formnovalidate` на button — только для этой кнопки.

### select и textarea
`<select>` — выпадающий список. Первый «пустой» option (value="", disabled, selected) — стартовая позиция «выберите»: в паре с required заставляет сделать выбор. `optgroup` — группы опций. `value` пишем у каждого option явным (иначе отправится текст).

`<textarea>` — многострочный текст: `rows`/`cols` — базовый размер, значение = текст МЕЖДУ тегами. `maxlength` + видимый счётчик («12 / 300») — честный лимит.

### progress, meter, output
`<progress value="70" max="100">` — детерминированный ПРОЦЕСС (загрузка, шаги); без value — «неопределённый». `<meter value="60" min="0" max="100" low="40" high="80" optimal="90">` — ИЗМЕРЕНИЕ в диапазоне (заполненность, рейтинг) — low/high/optimal подсказывают цвет. `<output>` — результат вычисления.

TIP: валидация — на клиенте (UX) И на сервере (правда): «умный» клиент обойдёт любую JS-проверку, но нативную тоже. Не думайте, что валидация в форме заменяет проверку на бэкенде.

## Пример
```html
<form action="/order" method="post">
  <h1>Оформление заказа</h1>
  <label for="name">ФИО</label>
  <input type="text" id="name" name="name" required
         pattern="[А-ЯЁA-Z][а-яёa-z- ]{2,30}"
         title="Буквы, дефис, пробел; от 3 до 31 символа">
  <label for="qty">Количество (шаг 5)</label>
  <input type="number" id="qty" name="qty" value="10"
         min="0" max="100" step="5">
  <label for="delivery">Способ доставки</label>
  <select id="delivery" name="delivery" required>
    <option value="" disabled selected>— выберите —</option>
    <optgroup label="Самовывоз">
      <option value="msk">Магазин, Москва</option>
    </optgroup>
    <optgroup label="Курьер">
      <option value="courier">Курьер, 1–3 дня</option>
    </optgroup>
  </select>
  <label for="comment">Комментарий</label>
  <textarea id="comment" name="comment" rows="4" cols="44"
            maxlength="300"></textarea>
  <p>Баланс: <meter value="35" min="0" max="100"
                    low="20" high="70" optimal="80">35%</meter></p>
  <p>Загрузка: <progress value="60" max="100"></progress></p>
  <button type="submit">Оформить</button>
  <button type="submit" formnovalidate>Черновик (без проверки)</button>
</form>
```
Попробуйте: пустое ФИО → нативное сообщение; qty=7 → «должно быть кратным 5»; select без выбора → «выберите».

## Частые ошибки
WARN: pattern с ^...$ внутри — в HTML5 pattern якорится автоматически, двойные якоря ломают совпадение.
WARN: required на «опциональном» поле «на всякий случай» — пользователь заставлен выбирать лишнее.
WARN: <select> без label (только «подсказка» первым option) — a11y-проблема; label for + (опц.) пустой option.
WARN: option/radio/checkbox без явного value — отправится текст или «on».
WARN: novalidate поставлен, а своей валидации нет — валидации не осталось НИГДЕ.

## Практическое задание
1. В стартовом файле добавьте required и pattern к ФИО (буквы, от 3 символов).
2. Настройте number-поле: min=1000, max=100000, step=1000.
3. Соберите select «Доставка»: пустой option + 2 optgroup по 2 опции.
4. Добавьте textarea (rows=4, maxlength=300) и пару progress/meter.
5. Бонус: вторая кнопка formnovalidate — убедитесь, что она пропускает проверку; проверьте каждое правило вручную.
