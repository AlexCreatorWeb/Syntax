# Урок 13. Файлы: open, read/write, режимы, with

## Цель

После урока студент сможет: открывать файлы через `open` (режимы `r`/`w`/`a`/`r+`, `encoding`), читать (`read`, `readline`, итерация по строкам), писать (`write`, `writelines`), использовать **`with`** (контекстный менеджер — файл **автоматически закрывается**), работать с **UTF-8** и понимать разницу `w` (перезаписать) vs `a` (дописать).

## Теория

### open и режимы

`open(path, mode, encoding)` → объект-файл (стрим). Основные **режимы**:
- `r` — чтение (дефолт); файла **нет** → `FileNotFoundError`.
- `w` — запись (**перезаписать**; нет файла → создать; есть → **очистить**!).
- `a` — **дописать** (append; в конец; нет → создать).
- `r+` / `w+` — чтение **и** запись.
- `b` — бинарный (`rb`, `wb`) — байты (изображения, не текст).

**`encoding="utf-8"`** — всегда указывайте для текста (иначе — локальная кодировка системы, «кракозябры»).

### Чтение

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()            # весь текст (в строку)
    # f.readline()             # одна строка
    # for line in f:           # построчно (для больших)
```

`readlines()` → список строк (весь файл в память — для больших лучше **итерация**).

### Запись

```python
with open("out.txt", "w", encoding="utf-8") as f:
    f.write("строка\n")            # без \n — не добавит
    f.writelines(["a\n", "b\n"])   # список (без авто-\n)
```

### with: контекстный менеджер

`with open(…) as f: …` — «файл открыт в блоке, **закрыт при выходе** (даже при ошибке)». Без `with` — `f.close()` руками (забыли → данные «не дописаны» (буфер), «утечка» дескрипторов). **Правило: файлы — всегда через `with`.**

TIP: «чтение большого» — построчно (`for line in f`), не `read()` (вся память). «Лог» — `a` (append). «Пересчёт» — `w`.

NOTE: в песочнице (Pyodide) — **in-memory файловая система** (файлы живут до перезагрузки страницы): `open`/`read`/`write`/`with` — как в CPython, путь — виртуальный (`/tmp/…` или `./…`).

## Пример

`main.py`:

```python
"""Файлы: open, read/write, with."""

# Запись (w — перезаписать)
with open("/tmp/names.txt", "w", encoding="utf-8") as f:
    f.write("Аня\n")
    f.writelines(["Боря\n", "Вера\n", "Гена\n"])

# Чтение: весь текст
with open("/tmp/names.txt", encoding="utf-8") as f:
    text = f.read()
print("Весь текст:\n" + text)

# Чтение: построчно (итерация)
print("--- построчно:")
with open("/tmp/names.txt", encoding="utf-8") as f:
    for line in f:
        print("  ", line.strip())

# readlines (список)
with open("/tmp/names.txt", encoding="utf-8") as f:
    lines = f.readlines()
print("readlines:", lines, "| len:", len(lines))

# a — дописать (append)
with open("/tmp/names.txt", "a", encoding="utf-8") as f:
    f.write("Дима\n")
with open("/tmp/names.txt", encoding="utf-8") as f:
    print("После append:", f.read())

# Обработка «файл не найден»
try:
    with open("/tmp/нет.txt", encoding="utf-8") as f:
        f.read()
except FileNotFoundError:
    print("FileNotFoundError: /tmp/нет.txt (ожидаемо)")

# «Обработка» CSV-подобного (разделитель ;)
data = "имя;балл\nАня;92\nБоря;78\n"
with open("/tmp/scores.csv", "w", encoding="utf-8") as f:
    f.write(data)
with open("/tmp/scores.csv", encoding="utf-8") as f:
    rows = [line.strip().split(";") for line in f if line.strip()]
print("CSV rows:", rows)
```

## Частые ошибки

WARN: **`w` «тихо» очищает** существующий файл (открыли `w` → файл **пустой**, даже если не дописали). Для «дописать» — `a`; для «прочитать, потом изменить» — читать в `r`, затем писать в `w` (в **два** `with`).

WARN: **забыли `encoding="utf-8"`** — на некоторых системах «кракозябры» (локальная кодировка). Всегда `encoding="utf-8"`.

WARN: **файл без `with`** и без `close()` — данные «в буфере» (могут не дописаться), дескриптор «утёк». Файлы — **всегда** `with`.

WARN: `read()` на **огромном** файле (вся память). Для больших — построчно (`for line in f`) или чанками.

## Практическое задание

1. Функция `count_words(path: str) -> int` — количество слов в файле (через `with`, `split()`). Создайте тестовый файл и проверьте.
2. Функция `tail(path: str, n: int) -> list[str]` — последние `n` строк (как `tail`). Проверьте на файле из 10 строк.
3. «Лог-файл»: допишите (`a`) 3 строки `2026-09-02 14:30 событие N`; затем прочитайте и посчитайте «событий в 14:30» (по подстроке).
4. Функция `reverse_file(src: str, dst: str) -> None` — «переписать» файл в **обратном** порядке строк (сначала прочитать в список, затем `w` в dst).
5. В комментарии: почему `with` нужен (буфер/закрытие), и что будет, если `write` без `close` (2–3 предложения).
