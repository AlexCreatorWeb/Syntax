---
id: vue-reactivity
track: vue
type: guide
section: basics
order: 2
title:
  en: "Reactivity: ref & reactive"
  ru: "Реактивность: ref и reactive"
excerpt:
  en: "ref(), reactive() and computed(): how state is tracked, why .value exists, and when each primitive is the right tool."
  ru: "ref(), reactive() и computed(): как отслеживается state, зачем нужен .value и когда какой примитив уместен."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-002
---

Reactivity is the heart of Vue: declare state, and every place that reads it updates automatically when the state changes — no subscriptions to wire, no manual re-render calls. This guide covers the two primitives, `ref()` and `reactive()`, plus `computed()` for derived values, and explains the difference between them.

## ref: the basic building block

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
const name = ref("Guest");

function increment() {
  count.value += 1;
}
</script>

<template>
  <p>{{ name }}, you clicked {{ count }} times</p>
  <button @click="increment">+1</button>
</template>
```

`ref()` wraps a value in a reactive box that exposes a single `.value` property. In JavaScript you read and write `count.value`; in templates Vue unwraps refs automatically, so `{{ count }}` prints the number, not the wrapper. A ref can hold any type — numbers, strings, booleans, objects, arrays — and you can start with `null` and fill it in later.

The whole mechanism is dependency tracking. Whenever rendered code — a template expression, a `computed` getter, a `watch` source — reads `count.value`, Vue registers that spot as a dependency. A later write to `count.value` triggers re-renders of exactly those spots and nothing else.

That tracking has a practical consequence: a ref holding an object is deep-reactive. Mutating `user.value.profile.name` is tracked exactly the same way as top-level properties, so `ref` and `reactive` cover the same ground for nested data.

## reactive: deep reactivity for objects

```vue
<script setup>
import { reactive } from "vue";

const user = reactive({ profile: { name: "Ada", level: 1 } });

function levelUp() {
  user.profile.level += 1;
}
</script>

<template>
  <p>{{ user.profile.name }} is level {{ user.profile.level }}</p>
  <button @click="levelUp">Level up</button>
</template>
```

`reactive()` takes a plain object or array and returns a Proxy that tracks property access at any depth. There is no `.value` — you read and write properties directly, and nested objects become reactive automatically, without wrapping.

The trade shows up the moment you want to reassign the whole object. `user = { name: "X" }` in a component or a composable reassigns a local variable; the template still points at the old proxy and never updates. With a ref the same operation is fine, because you assign to `user.value`.

> **WARNING**
> Replacing a reactive object wholesale loses the binding: the template keeps watching the old proxy. Mutate the object in place, or use a `ref` whenever the value may be replaced.

> **WARNING**
> Destructuring a reactive object copies plain values: `const { name } = user` is no longer reactive. Use `toRefs(user)` or keep accessing properties on the object itself.

## computed: derived state

```vue
<script setup>
import { ref, computed } from "vue";

const price = ref(100);
const qty = ref(2);
const total = computed(() => price.value * qty.value);

const firstName = ref("ada");
const lastName = ref("lovelace");
const fullName = computed({
  get: () => firstName.value + " " + lastName.value,
  set: (v) => {
    const [f, l] = v.split(" ");
    firstName.value = f;
    lastName.value = l;
  },
});
</script>

<template>
  <span>Total: {{ total }}</span>
  <button @click="qty++">+1 qty</button>
  <p>{{ fullName }}</p>
</template>
```

A `computed` is a derived reactive value: a function that re-runs only when one of the reactive values it read changes. It is lazy — the first access triggers the evaluation — and cached, so reading `total` ten times in one render computes it once. By default a computed is read-only; passing `{ get, set }` makes it writable, which is handy when a form field displays a joined value that must write back.

Reach for `computed` instead of a template expression the moment the derivation is worth a name: it documents intent, is cacheable, and can be tested without rendering a component.

## Choosing between ref and reactive

Both primitives produce working reactive state, so the choice is about consistency, not correctness. A `ref` is a handle you can reassign, and it works for every type, including primitives that `reactive` cannot wrap at all (a bare number is not an object). A `reactive` object is a stable shape you mutate in place — a form, a settings object, a cart.

Inside composables the rule gets sharper: return refs. Refs survive destructuring in the consumer component, and top-level refs are unwrapped in templates, so `const { count } = useCounter()` Just works. A reactive object returned from a composable invites exactly the destructuring bug warned about above.

> **TIP**
> A rule that keeps a codebase consistent: use `ref` by default and reach for `reactive` only for a well-known object shape that you will mutate in place and never reassign.

## Common mistakes

> **WARNING**
> Forgetting `.value` in script code: `count += 1` reads `undefined` and silently breaks. In templates the unwrap is automatic — in `<script setup>` it is not.

> **WARNING**
> Reading a ref inside a callback and keeping the old box in a closure is fine, but copying the value out (`const c = count.value`) creates a plain number that never updates. Keep the ref in the closure if the value must stay live.

> **TIP**
> When in doubt, `ref`. It handles primitives, objects and reassignment in one API, and there is no situation where only `reactive` works.

<!-- RU -->

Реактивность — сердце Vue: объявите state, и каждое место, которое его читает, обновляется автоматически при изменении — без подписок и ручных вызовов перерисовки. Гайд покрывает два примитива — `ref()` и `reactive()` — плюс `computed()` для производных значений, и объясняет, в чём разница.

## ref: базовый строительный блок

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
const name = ref("Guest");

function increment() {
  count.value += 1;
}
</script>

<template>
  <p>{{ name }}, you clicked {{ count }} times</p>
  <button @click="increment">+1</button>
</template>
```

`ref()` оборачивает значение в реактивную «коробку» с единственным свойством `.value`. В JavaScript вы читаете и пишете `count.value`; в template Vue разматывает ref'ы автоматически, поэтому `{{ count }}` печатает число, а не обёртку. Ref держит любой тип — числа, строки, булевы, объекты, массивы — и можно начать с `null` и заполнить позже.

Весь механизм — это отслеживание зависимостей. Каждый раз, когда рендеримый код — expression в template, getter `computed`, источник `watch` — читает `count.value`, Vue регистрирует это место как зависимость. Позднее запись в `count.value` запускает перерисовку ровно этих мест и больше ничего.

У отслеживания есть практическое следствие: ref, содержащий объект, — глубоко реактивный. Мутация `user.value.profile.name` отслеживается так же, как top-level свойства, так что `ref` и `reactive` покрывают один и тот же участок для вложенных данных.

## reactive: глубокая реактивность для объектов

```vue
<script setup>
import { reactive } from "vue";

const user = reactive({ profile: { name: "Ada", level: 1 } });

function levelUp() {
  user.profile.level += 1;
}
</script>

<template>
  <p>{{ user.profile.name }} is level {{ user.profile.level }}</p>
  <button @click="levelUp">Level up</button>
</template>
```

`reactive()` берёт обычный объект или массив и возвращает Proxy, который отслеживает доступ к свойствам на любой глубине. Свойства читаются и пишутся напрямую, без `.value`, а вложенные объекты становятся реактивными автоматически, без обёрток.

Компромисс проявляется в момент, когда хочется заменить объект целиком. `user = { name: "X" }` в компоненте или компаузабеле переопределяет локальную переменную; template по-прежнему смотрит на старый прокси и не обновляется. С ref та же операция легальна — вы присваиваете `user.value`.

> **WARNING**
> Замена reactive-объекта целиком теряет связь: template продолжает следить за старым прокси. Мутите объект на месте, а если значение может быть заменено — используйте `ref`.

> **WARNING**
> Деструктуризация reactive-объекта копирует обычные значения: `const { name } = user` перестаёт быть реактивным. Используйте `toRefs(user)` или продолжайте обращаться к свойствам на самом объекте.

## computed: производное состояние

```vue
<script setup>
import { ref, computed } from "vue";

const price = ref(100);
const qty = ref(2);
const total = computed(() => price.value * qty.value);

const firstName = ref("ada");
const lastName = ref("lovelace");
const fullName = computed({
  get: () => firstName.value + " " + lastName.value,
  set: (v) => {
    const [f, l] = v.split(" ");
    firstName.value = f;
    lastName.value = l;
  },
});
</script>

<template>
  <span>Total: {{ total }}</span>
  <button @click="qty++">+1 qty</button>
  <p>{{ fullName }}</p>
</template>
```

`computed` — это производное реактивное значение: функция, которая пересчитывается только когда изменилось одно из реактивных значений, которые она читала. Она ленивая — вычисление запускается при первом доступе — и кэшированная, поэтому десять чтений `total` в одном рендере считаются один раз. По умолчанию computed read-only; передача `{ get, set }` делает его записываемым — удобно, когда поле формы показывает склеенное значение, которое при этом пишет обратно.

Обращайтесь к `computed` вместо expression в template, как только производная стоит того, чтобы её назвать: она документирует намерение, кэшируется и тестируется без рендера компонента.

## Как выбрать: ref или reactive

Оба примитива дают рабочую реактивность, так что выбор — про консистентность, а не про корректность. `ref` — это handle, который можно переприсваивать, и он работает с любым типом, включая примитивы, которые `reactive` не может обернуть вообще (голое число — не объект). `reactive`-объект — это стабильная форма, которую вы мутите на месте: форма, объект настроек, корзина.

Внутри компаузаблей правило жёстче: возвращайте ref'ы. Ref'ы переживают деструктуризацию в компоненте-потребителе, а top-level ref'ы разматываются в template, поэтому `const { count } = useCounter()` просто работает. Reactive-объект, возвращённый из компаузабла, подталкивает ровно к тому багу с деструктуризацией, о котором шла речь выше.

> **TIP**
> Правило, которое держит кодовую базу консистентной: `ref` по умолчанию, а `reactive` — только для известной формы объекта, которую вы мутите на месте и никогда не переприсваиваете.

## Частые ошибки

> **WARNING**
> Забытый `.value` в скрипте: `count += 1` читает `undefined` и молча ломается. В template разматывание автоматическое — в `<script setup>` нет.

> **WARNING**
> Скопировать значение наружу (`const c = count.value`) — получить обычное число, которое никогда не обновится. Если значение должно оставаться «живым», держите в замыкании сам ref.

> **TIP**
> Если сомневаетесь — `ref`. Он закрывает примитивы, объекты и переприсваивание одним API, и ситуации, где работает только `reactive`, не существует.
