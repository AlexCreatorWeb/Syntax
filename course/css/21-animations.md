# Урок 21. Transitions и анимации: transform и keyframes

## Цель
После урока студент сможет: собрать плавный переход (transition) на hover/focus; различать transition и animation (@keyframes); анимировать «дёшево» (transform/opacity) и уметь отключить анимации для prefers-reduced-motion.

## Теория
### transition: плавный переход между двумя состояниями
**transition** плавно «перелетает» свойство из одного значения в другое, КОГДА состояние меняется (hover, класс, check):
```css
.btn {
  background: #1971c2;
  transform: translateY(0);
  transition: background 0.2s ease, transform 0.2s ease;
}
.btn:hover {
  background: #1864ab;
  transform: translateY(-2px);
}
```
Порядок в сокращении: **свойство длительность easing задержка** (duration по умолчанию 0s — без неё transition «мгновенный»). Несколько свойств — через запятую.

**Easing-функции**: ease (по умолчанию), linear, ease-in/out/in-out, cubic-bezier(a,b,c,d) — «кривая» ускорения. ease-out — «быстрый старт, плавное торможение» — универсальный выбор для UI.

### transform: «дёшевое» движение
**transform** двигает/масштабирует/вращает элемент БЕЗ пересчёта layout (композиторный уровень — GPU):

- **translate(x, y)** — сдвиг: translateX(10px), translateY(-2px), translate(-50%, -50%) (центрирование!);

- **scale(n)** — масштаб: scale(1.05);

- **rotate(deg)** — поворот: rotate(45deg);

- **композиция**: transform: translateY(-2px) scale(1.02) — применяется «слева направо».

Почему «дёшево»: top/left/width/height анимируют **layout** (пересчёт позиций ВСЕХ соседей каждый кадр — 60fps «падает» на сложных страницах). transform/opacity — **composite** (отдельный «слой», GPU). Правило: **анимируйте transform и opacity**, layout-свойства — только для «медленных» переходов (width-«аккордеон» — терпимо, но не для 60fps-«крутений»).

**translate(-50%, -50%)** — классика центрирования absolute-элемента «по центру точки» (self-сдвиг наполовину своих размеров).

### @keyframes и animation: циклы и сценарии
**@keyframes** описывает **сценарий** (от A через B к C), **animation** — «запускает» его:
```css
@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.badge {
  animation: pulse 1.5s ease-in-out infinite;
}
```
Сокращение animation: **имя длительность easing задержка итерации направление fill-mode**: pulse 1.5s ease-in-out infinite — «вечно». Ключевые слова: **forwards** (остаться в «последнем» кадре), **alternate** (туда-обратно), **infinite** (вечно). from/to = 0%/100%.

### reduced-motion: a11y-обязательство
Пользователи с вестибулярной чувствительностью включают «меньше движения» — браузер отдаёт **prefers-reduced-motion: reduce**. Анимации без «отключения» — a11y-баг. Стандартная «защита»:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

TIP: **hover-эффекты** — transition 150–250ms, ease-out, «маленькие» движения (translateY(-2px), scale(1.02)): «живость» без «крика». Больше 300ms — «вялое», меньше 100ms — «дёрганое».

NOTE: var() «не работает» «внутри» @keyframes (animation «не видит» кастомных свойств, урок 20): значения «дублируются» «в» from/to. (Продвинутый обход — @property; для курса — «дублируйте».)

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 21. Анимации</title>
</head>
<body>
  <button class="btn">Наведи</button>
  <div class="card">
    <span class="badge">NEW</span>
    <h2>Карточка с «пульсом»</h2>
  </div>
  <div class="spinner"></div>
</body>
</html>
```
CSS:
```css
body { font-family: system-ui, sans-serif; padding: 2rem; }

.btn {
  background: #1971c2;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  transform: translateY(0);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgb(25 113 194 / 0.3);
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e8590c;
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}

.card {
  position: relative;
  max-width: 400px;
  margin-top: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin-top: 1.5rem;
  border: 4px solid #dee2e6;
  border-top-color: #1971c2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Разбор: .btn — transition на transform+box-shadow (hover «приподнимает» кнопку, transform — «дёшево»). .badge — pulse (scale 1→1.1→1, infinite). .spinner — spin (rotate 0→360, linear, infinite) — «классический» лоадер. reduced-motion «защита» внизу — «гасит» ВСЕ анимации для a11y-пользователей.

## Частые ошибки
WARN: transition «без» duration — transition: transform ease; — duration 0s (по умолчанию) — «мгновенно», «перехода» нет; duration ОБЯЗАТЕЛЕН (0.2s).
WARN: transition: all 0.3s «везде» — анимируется «всё» (width, top, color, visibility): layout-свойства «тормозят», «случайные» свойства «мигают»; перечисляйте свойства явно.
WARN: анимация top/left/width «для движения» — layout-рекомпоузит каждый кадр: 60fps «падает»; transform (translate/scale/rotate) + opacity — «composite» (GPU).
WARN: @keyframes «с» var() — «не работает» (animation «не видит» кастомных свойств): значения «дублируются» «в» from/to (или @property — продвинуто).
WARN: «без» prefers-reduced-motion — «качающиеся»/«вращающиеся» элементы «раздражают» пользователей с вестибулярной чувствительностью; «защитный» media query — ОБЯЗАТЕЛЕН (a11y).

## Практическое задание

1. Соберите каркас из Примера и реализуйте transition/animation со скелета задания.

2. Замените у .btn:hover transform на top: -3px — и в DevTools → Performance («записать» hover) сравните: transform — «дешёвый» (Composite), top — «дорогой» (Layout).

3. Добавьте у .card transition: transform 0.2s и hover: scale(1.01) — и объясните, почему transition «запустился» (состояние «сменилось»).

4. Задайте .spinner animation-direction: alternate — что изменилось (rotate «туда-обратно»)? Верните normal.

5. Бонус: соберите «появление» (fade-in): @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } + .card { animation: fadeIn 0.4s ease-out } — и проверьте в reduced-motion (DevTools → Rendering → Emulate), что анимация «гаснет».
