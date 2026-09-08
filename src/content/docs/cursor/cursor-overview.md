---
id: cursor-overview
track: cursor
type: guide
section: basics
order: 1
title:
  en: "Cursor: Overview"
  ru: "Cursor: обзор"
excerpt:
  en: "What Cursor is, its main AI modes (Tab, Chat, Composer/Agent), and the official resources to go deeper."
  ru: "Что такое Cursor, основные AI-режимы (Tab, Chat, Composer/Agent) и официальные материалы для углублённого изучения."
version: "cursor 2.x"
updated: 2026-09-16
---

Cursor is a code editor built on top of VS Code with AI baked into every step: inline completions (Tab), a chat panel that knows your codebase, and an agent mode (Composer) that edits multiple files and runs commands on its own. Because it is a VS Code fork, extensions and shortcuts you already know mostly work as-is.

## Main AI surfaces

- Tab — autocompletion: suggests whole lines and multi-line edits, and "jumps" to your next edit location.
- Chat / Ask — questions about the codebase with code-aware answers.
- Composer (agent) — task in natural language: the agent creates/edits files, runs terminal commands, iterates on errors.
- Rules — project rules (`.cursor/rules`) that tune the AI's behavior for your codebase.

## Typical workflow

```bash
# open the project in Cursor, then:
# 1. Cmd/Ctrl+I or Cmd/Ctrl+L — chat with codebase context
# 2. Cmd/Ctrl+Shift+Space — Composer (agent): "add a dark theme toggle,
#    update the docs, run the linter"
# 3. Review the diff of each changed file, commit
```

## Where to learn more

- Official documentation: [cursor.com/docs](https://cursor.com/docs)
- Feature guides (Tab, Composer, agents): [cursor.com/features](https://cursor.com/features)

> **TIP**
> Write a short project rule file (stack, naming conventions, test command) — the agent follows it in every session.

<!-- RU -->

Cursor — редактор кода на базе VS Code, где AI встроен в каждый шаг: инлайн-дополнения (Tab), чат-панель, которая знает ваш код, и агентский режим (Composer), который сам правит несколько файлов и запускает команды. Так как это форк VS Code, расширения и хоткеи, которые вы уже знаете, в основном работают как раньше.

## Основные AI-поверхности

- Tab — автодополнение: предлагает целые строки и многострочные правки, «перескакивает» к следующему месту правки.
- Chat / Ask — вопросы о кодовой базе с ответами, учитывающими код.
- Composer (агент) — задача обычным языком: агент создаёт/правит файлы, запускает команды в терминале, итерирует на ошибках.
- Rules — правила проекта (`.cursor/rules`), настраивающие поведение AI под ваш код.

## Типовой рабочий процесс

```bash
# откройте проект в Cursor, затем:
# 1. Cmd/Ctrl+I или Cmd/Ctrl+L — чат с контекстом кодовой базы
# 2. Cmd/Ctrl+Shift+Space — Composer (агент): «добавь переключатель
#    тёмной темы, обнови доки, прогони линтер»
# 3. Осмотрите diff каждого файла, коммит
```

## Где учиться дальше

- Официальная документация: [cursor.com/docs](https://cursor.com/docs)
- Гиды по функциям (Tab, Composer, агенты): [cursor.com/features](https://cursor.com/features)

> **TIP**
> Напишите короткий файл правил проекта (стек, конвенции именования, тестовая команда) — агент будет их соблюдать в каждой сессии.
