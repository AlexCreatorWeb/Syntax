---
id: claude-overview
track: claude
type: guide
section: basics
order: 1
title:
  en: "Claude Code: Overview"
  ru: "Claude Code: обзор"
excerpt:
  en: "What Claude Code is, how the agent works inside your terminal, and the official resources to go deeper."
  ru: "Что такое Claude Code, как агент работает в терминале и куда смотреть для углублённого изучения."
version: "claude 2.x"
updated: 2026-09-16
---

Claude Code is Anthropic's terminal-based AI agent: you run it in the same folder as your project, describe the task in plain language, and it reads your code, edits files, runs commands, and explains what it did. It is built for real repository work — multi-file changes, refactors, test runs — not just one-shot code snippets.

## What it is

- An interactive CLI agent (a chat loop in your terminal) that has tool access: file read/write, shell commands, search.
- Context comes from your working directory: the more a normal project looks like a normal project (clear structure, README, tests), the better it works.
- Permission model: by default it asks before destructive commands; you can allow-list safe commands.

## First steps

```bash
# install (npm)
npm install -g @anthropic-ai/claude-code

# inside your project
cd my-project
claude

# inside the session
> add a test for the parser module and run it
```

The agent plans, edits files, runs the test command, and reports the result. You stay in control: every change is a normal file edit you can review with git.

## Where to learn more

- Official documentation: [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)
- Quickstart and keyboard reference: [claude.com/claude-code](https://claude.com/claude-code)
- Examples and tips from the team: [anthropic.com/claude-code-best-practices](https://www.anthropic.com/claude-code-best-practices)

> **TIP**
> Keep a short README and a runnable test command in the repo — the agent leans on them for every task.

<!-- RU -->

Claude Code — это агент Anthropic, работающий в терминале: запускаете его в папке с проектом, описываете задачу обычным языком, а он читает код, правит файлы, запускает команды и объясняет, что сделал. Он сделан для настоящей работы с репозиторием — изменения по нескольким файлам, рефакторинг, прогон тестов, а не разовые сниппеты.

## Что это такое

- Интерактивный CLI-агент (чат в терминале) с инструментами: чтение/запись файлов, shell-команды, поиск.
- Контекст — ваша рабочая папка: чем проект устроен понятнее (структура, README, тесты), тем лучше работает агент.
- Модель разрешений: опасные команды по умолчанию требуют подтверждения; безопасные можно позволить списком.

## Первые шаги

```bash
# установка (npm)
npm install -g @anthropic-ai/claude-code

# в папке проекта
cd my-project
claude

# в сессии
> добавь тесты для модуля парсера и запусти их
```

Агент составляет план, правит файлы, запускает тестовую команду и отчитывается. Вы остаетесь у руля: каждое изменение — обычная правка файла, которую можно посмотреть через git.

## Где учиться дальше

- Официальная документация: [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)
- Быстрый старт и клавиши: [claude.com/claude-code](https://claude.com/claude-code)
- Примеры и приёмы от команды Anthropic: [anthropic.com/claude-code-best-practices](https://www.anthropic.com/claude-code-best-practices)

> **TIP**
> Держите в репозитории короткий README и запускную тестовую команду — агент опирается на них в каждой задаче.
