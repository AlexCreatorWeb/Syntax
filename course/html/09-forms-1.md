# Урок 9. Формы I: каркас и типы input

## Цель
После урока студент сможет: собрать форму с правильным связыванием `label` и полей, выбрать нужный `type="input"` под каждый тип данных, сгруппировать поля через `fieldset`/`legend` и отличить `button` от `input[type=submit]`.

## Теория
### Каркас формы
Форма — контракт: «дай мне такие данные». `action` — куда отправить (пусто — на текущую страницу), `method` — get (данные в URL, для поиска) или post (в теле запроса, для отправлений; по умолчанию get). При загрузке файлов нужен `enctype="multipart/form-data"`.

### label — сердце доступности
Два способа связать: явный — `<label for="email">` + `<input id="email">` (for/id — точное совпадение); вложенный — `<label>Почта <input type="email"></label>`. Зачем: клик по подписи фокусирует поле; скринридер при фокусе ЧИТАЕТ подпись (без label — «текстовое поле, без имени»). `placeholder` — НЕ замена label: исчезает при вводе, слабый контраст, скринридеры не всегда озвучивают.

### Типы input
Каждый `type` даёт правильный ввод «из коробки»: `text` (базовый), `email` (проверка @, клавиатура с @), `tel` (цифровая клавиатура), `url`, `number` (стрелки, min/max/step), `password` (маскировка), `search`, `date`/`time`/`datetime-local` (нативный пикер), `color`, `checkbox` (много из набора), `radio` (один из набора — группируются по одинаковому `name`), `file`, `hidden` (данные без видимого поля).

`name` — имя поля в данных отправки (без name поле «не существует» для сервера); `value` — выбранное значение.

### fieldset, legend и кнопки
`<fieldset>` + `<legend>` — группа полей с общей подписью («Адрес доставки»). Для `radio`-группы fieldset практически обязан: без него скринридер не понимает, что это ОДНА группа выбора.

`<button>` гибче (внутри может быть HTML/иконка), `<input type="submit" value="OK">` — только текст. Ловушка: дефолтный `type` у button — `submit`! Кнопка-действие (не отправка) обязана иметь явный `type="button"`.

TIP: атрибуты autocomplete (email, tel, name, street-address…) подключают сохранённые данные браузера — бесплатное удобство, пишем на «стандартных» полях.

## Пример
```html
<form action="/register" method="post">
  <h1>Регистрация</h1>
  <label for="name">Имя</label>
  <input type="text" id="name" name="name" autocomplete="given-name">
  <label for="email">Почта</label>
  <input type="email" id="email" name="email" placeholder="you@example.com">
  <label for="phone">Телефон</label>
  <input type="tel" id="phone" name="phone">
  <fieldset>
    <legend>Пол</legend>
    <label><input type="radio" name="gender" value="f"> Женский</label>
    <label><input type="radio" name="gender" value="m"> Мужской</label>
    <label><input type="radio" name="gender" value="other"> Не важно</label>
  </fieldset>
  <p>
    <label><input type="checkbox" name="agree">
    <span>Соглашаюсь с условиями</span></label>
  </p>
  <button type="submit">Зарегистрироваться</button>
  <button type="button">Сбросить</button>
  <input type="hidden" name="page" value="signup">
</form>
```
Обратите внимание: радио объединены одинаковым name; «Сбросить» — type="button" (не отправит форму); hidden уносит данные без видимого поля.

## Частые ошибки
WARN: подпись «над» полем как <span>/<p>, label нет — скринридер: «текстовое поле» без имени; клик по подписи не фокусирует.
WARN: placeholder как единственная «подсказка» — исчезает при вводе; label всегда, placeholder — только пример формата.
WARN: name у input пропущен — поле молча не отправляется на сервер.
WARN: радио-группа без одинакового name и без fieldset — три независимых «включателя» вместо выбора.
WARN: button без type внутри формы — по умолчанию submit; «кнопка-декор» отправляет форму.

## Практическое задание
1. В стартовом файле соберите поля: «Имя» (text), «Почта» (email + placeholder-пример), «Телефон» (tel).
2. Добавьте fieldset «Пол» с 3 радио (один name) и checkbox «Согласен».
3. У каждого поля: label + id, name, (где уместно) autocomplete.
4. Проверьте: клик по любой подписи фокусирует поле; button «Сбросить» НЕ отправляет форму.
5. Бонус: добавьте input type="date" и в device mode (DevTools) проверьте цифровую клавиатуру на tel.
