## Цель

После урока студент сможет: создавать реактивные переменные через `ref`, читать и писать их значение через `.value` в JavaScript и без `.value` в шаблоне, хранить в `ref` примитивы и объекты и понимать, зачем нужен «обёрточный» объект.

## Теория

### Почему ref

Примитив (число, строка, булево) нельзя сделать «реактивным» напрямую — переменная ссылается на само значение, а не на контейнер. Поэтому `ref` оборачивает значение в объект с единственным свойством `value`:

- `const count = ref(0)` — внутри `count.value === 0`;
- в JavaScript читаем `count.value` и пишем `count.value = 5`;
- в шаблоне `{{ count }}` и `:disabled="count > 5"` — `.value` не пишем, Vue «разворачивает» сам.

Механизм: `ref` использует `Proxy`/getter-setter так, что при **чтении** значения (в шаблоне, в `computed`, в `watch`) Vue «подписывается», а при **записи** — уведомляет всё, что подписалось. Отсюда правило: в JS — `.value`, в шаблоне — без.

### ref для объектов

В `ref` можно положить и объект. Тогда:

- `const user = ref({ name: "Анна" })`;
- в JS — `user.value.name` (обёртка обязана);
- в шаблоне — `user.name` (обёртка прозрачна);
- сам объект становится **глубинно реактивным**: `user.value.name = "Борис"` тоже отслеживается.

Если нужен именно объект (без `.value` в JS) — используй `reactive` (следующий урок). Для большинства случаев `ref` — безопасный выбор: он одинаково работает и с примитивами, и с объектами, и **переживает замену** (`user.value = { … }` — новое значение).

### Ключевые правила

1. **Примитив → ref, без вопросов.**
2. **Объект → ref или reactive**; ref — универсальнее.
3. **Запись — через `.value` в JS** (`count.value = x`), иначе реактивность теряется.
4. **В шаблоне `.value` не пишем.**
5. **Массивы в ref** — методы (`push`, `splice`, `sort`) реактивны; `arr.value.push(item)` работает.

TIP: привычка «в JS — `.value`, в шаблоне — нет» — главный навык урока. Потренируйся на скелете, и дальше это станет рефлексом.

NOTE: раннер Syntax использует `ref` ровно так же, как Vite. Проверь: изменит `count.value` через кнопку — и увидишь обновление в превью без перезагрузки.

## Пример

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
const name = ref("гость");
const user = ref({ role: "student", level: 1 });
const tags = ref(["vue"]);

function inc() { count.value++; }
function dec() { count.value = Math.max(0, count.value - 1); }
function rename() { name.value = "Анна"; }
function upLevel() { user.value.level++; }
function addTag() { tags.value.push("reactivity"); }
function reset() { user.value = { role: "student", level: 1 }; }
</script>

<template>
  <div class="demo">
    <h3>Примитив: число</h3>
    <p>Счётчик: {{ count }}</p>
    <button @click="dec">−1</button>
    <button @click="inc">+1</button>

    <h3>Примитив: строка</h3>
    <p>Имя: {{ name }}</p>
    <button @click="rename">Сменить на «Анна»</button>

    <h3>Объект в ref</h3>
    <p>Роль: {{ user.role }}, уровень: {{ user.level }}</p>
    <button @click="upLevel">Уровень +1</button>
    <button @click="reset">Заменить объект</button>

    <h3>Массив в ref</h3>
    <p>Теги: {{ tags.join(", ") }}</p>
    <button @click="addTag">Добавить тег</button>
  </div>
</template>
```

Что проверить в превью:

- `inc`/`dec` — число меняется, `:disabled` (если добавить) тоже;
- `rename` — строка меняется;
- `upLevel` — вложенное свойство объекта обновляется;
- `reset` — **замена** объекта целиком работает (в шаблоне тот же путь `user.role`);
- `addTag` — `push` реактивен.

## Частые ошибки

WARN: пишешь `count = 5` вместо `count.value = 5` — «переприсваивание» переменной `ref` (внутри функции). Vue предупредит, что `ref` «переприсвоен». Правильно — `count.value = 5`.

WARN: в шаблоне пишешь `{{ count.value }}` — лишний `.value`, покажет `undefined`. В шаблоне `ref` разворачивается автоматически.

WARN: пытаешься записать вложенное свойство без `.value` у самого объекта: `user.name = "Борис"` (в JS). Нужно `user.value.name = "Борис"`.

WARN: разрываешь `ref` деструктуризацией: `const { count } = refObj` — теряется реактивность. Используй `unref` (не здесь, а в хуках) или просто `refObj.count.value`.

## Практическое задание

В `App.vue` сделай:

1. `const score = ref(0)` и `const multiplier = ref(1)`.
2. Кнопка «Очки +10 × multiplier» — `score.value += 10 * multiplier.value`.
3. Кнопка «Увеличить multiplier» — `multiplier.value++`.
4. Объект `const stats = ref({ best: 0, tries: 0 })`; при каждом «Очки» — `stats.value.tries++`, а если `score.value > stats.value.best` — обновить `best`.
5. Выведи строку: «Очки: {score}, множитель ×{multiplier}, рекорд: {stats.best}, попыток: {stats.tries}».
6. Запусти **Run** и покрути кнопки — убедись, что все значения обновляются.
