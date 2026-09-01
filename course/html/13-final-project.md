# Урок 13. Финальный проект: семантическая страница

## Цель
Собрать **полную страницу** (лендинг продукта/курса) по чек-листу курса: валидный HTML5, семантика, доступность, адаптивные изображения, формы, медиа, современные элементы. Результат — страница, которую не стыдно показать.

## Требования (чек-лист)

### Структура (урок 1, 9)
- [ ] `<!DOCTYPE html>`, `<html lang="ru">`
- [ ] `head`: `charset`, `viewport`, `title`, `description`, `canonical`, 4 `og:*`, favicon (svg+png), `theme-color` (2 темы)
- [ ] Один `main`, `header`, `nav` (≥2), `footer`
- [ ] Иерархия: `h1` (1) → `h2` (≥3) → `h3` (≥2)

### Контент (уроки 2–5, 10)
- [ ] ≥ 5 абзацев, `strong`/`em`/`mark`/`code`/`blockquote`
- [ ] ≥ 3 ссылки: внутренняя, внешняя (`target="_blank" rel="noopener"`), `mailto:`
- [ ] ≥ 2 изображения: `srcset`+`sizes` (адаптивное), `figure`+`figcaption`, `alt` по смыслу, `loading="lazy"` (ниже экрана)
- [ ] `ul` (меню) + `ol` (шаги) + `dl` (характеристики)
- [ ] ≥ 1 таблица: `caption`, `th scope`, `thead`/`tbody`
- [ ] `video` (или `audio`) с `controls`, `poster`, `track`, fallback-текст
- [ ] `iframe` (карта/видео) с `title`, `loading="lazy"`, `sandbox`

### Формы (уроки 7–8)
- [ ] Форма: `label for` + `id` на каждое поле
- [ ] `input`: `text`, `email`, `tel`, `date`, `number` (с `min`/`max`/`step`)
- [ ] `select` (с `optgroup`), `textarea` (`rows`/`maxlength`)
- [ ] `fieldset`+`legend` (радио-группа)
- [ ] Валидация: `required` (≥3), `pattern` (1), `minlength` (1)
- [ ] `button type="submit"` + `button type="button"` (не отправка)

### A11y (урок 11)
- [ ] Контраст ≥ 4.5:1 (проверено WebAIM)
- [ ] Tab-навигация: фокус видим, порядок логичен, Esc закрывает диалог
- [ ] `aria-label` на иконки-кнопки, `aria-hidden` на декор
- [ ] `role="status"` на «Сохранено» (если есть JS)
- [ ] `aria-current="page"` на активном пункте меню
- [ ] Скринридер: landmarks/заголовки/таблицы/формы объявлены

### Современные элементы (урок 12)
- [ ] `<dialog>` (модалка) + `showModal()` + Esc + backdrop-click
- [ ] ≥ 3 `<details>` (FAQ)
- [ ] `<time datetime>` (≥2, один `pubdate`)
- [ ] `<datalist>` (1)

### Валидация и качество
- [ ] [validator.w3.org](https://validator.w3.org) — 0 ошибок
- [ ] DevTools → Lighthouse: Accessibility ≥ 90
- [ ] Мобильный вьюпорт (375px): нет горизонтального скролла
- [ ] Все картинки — с `width`/`height` (нет CLS-прыжков)

## Структура страницы (скелет)

```
header
  nav (лого + меню: Главная, Возможности, Цены, FAQ)
main
  section#hero (h1, 2 p, 2 button)
  section#features (h2, ul из 3 li, figure+img)
  section#how (h2, ol из 4 шагов)
  section#pricing (h2, table с 3 тарифами)
  section#video (h2, video с track)
  section#faq (h2, 4 details)
  section#contact (h2, form: имя, почта, телефон, дата, select, textarea, checkbox, 2 button)
aside (в main: «Отзывы» — 2 article)
footer (копирайт, nav доп. ссылки, time)
dialog (модалка «Подписаться»)
```

## Критерии приёмки

1. **Валидность**: 0 ошибок валидатора.
2. **Семантика**: landmarks-навигация в скринридере «ходит» по странице (banner → navigation → main → contentinfo).
3. **A11y**: Lighthouse ≥ 90; Tab-проход без «застреваний»; контраст AA.
4. **Контент**: все пункты чек-листа отмечены.
5. **Код**: 4- пробела, атрибуты на своих строках (если > 3), без мёртвых тегов (`<center>`, `<font>`), без «div-спагетти» (каждый `div` — осознанный).

## Самопроверка (10 минут)

1. Включите скринридер. «Прочитайте» страницу вслух. Что «зацепило»?
2. Откройте на телефоне (DevTools → device mode). Горизонтальный скролл? Кнопки ≥ 24px?
3. Отключите CSS (DevTools → Styles → «deactivate»). Страница «читается»? (если да — семантика работает)
4. Отключите JS. Модалка/детали не работают — но контент «виден»? (должен быть fallback)
5. Валидатор. Lighthouse. Done.

## Где взять материалы

- Картинки: [unsplash.com](https://unsplash.com) (CC0), [pexels.com](https://pexels.com).
- Видео/аудио: [pixabay.com](https://pixabay.com) (CC0), [sample-videos.com](https://sample-videos.com).
- Favicon: [realfavicongenerator.net](https://realfavicongenerator.net).
- Валидатор: [validator.w3.org](https://validator.w3.org).
- Контраст: [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker).
- Lighthouse: DevTools → Lighthouse (встроен).

## Что дальше

- **CSS**: Flexbox, Grid, кастомные свойства (переменные), медиазапросы.
- **JS**: DOM-события, fetch, SPA-паттерны.
- **Адаптив**: mobile-first, CLS/CWV-метрики.
- **Фреймворки**: Tailwind/Bootstrap (когда уже умеешь «вручную»).
- **Прод-навыки**: Git, деплой (Vercel/Netlify), аналитика, A/B.

Удачи! Курс пройден — вы умеете вёрстать.
