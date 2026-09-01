import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { emmetCSS, emmetHTML, emmetJSX } from "emmet-monaco-es";
import { useT } from "../i18n/useT";
import { getTech } from "../lib/techs";

const codeTemplates = {
  javascript: `function greetUser(name = "Developer") {
  const timeOfDay = new Date().getHours() < 12 ? "morning" : "evening";
  return \`Good \${timeOfDay}, \${name}! Welcome back to Syntax.\`;
}

console.log(greetUser("Alex"));`,

  html: `<h1>Hello, Syntax!</h1>
<p>Start editing to see changes.</p>`,

  css: `.container {
  display: flex;
  align-items: center;
  justify-content: center;
}`,
};

const fileNames = {
  javascript: "index.js",
  html: "index.html",
  css: "styles.css",
};

const ADDABLE_LANGUAGES = ["javascript", "html", "css"];

// К2: имя старт-файла из job-контекста урока → Monaco-язык по расширению
const langFromFileName = (name) => {
  const ext = (name || "").split(".").pop();
  if (ext === "py") return "python";
  if (ext === "sql") return "sql";
  if (ext === "css") return "css";
  if (ext === "html" || ext === "vue") return "html";
  return "javascript"; // js / jsx и пр.
};

// Темы редактора, привязанные к токенам платформы (Protocol Neo)
function definePlatformThemes(monaco) {
  monaco.editor.defineTheme("syntax-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#081827", // --code-bg (dark)
      "editor.lineHighlightBackground": "#122131", // --surface-2
      "editorLineNumber.foreground": "#46586e",
      "editorLineNumber.activeForeground": "#87948c", // --muted
      "editorCursor.foreground": "#30e0a1", // --primary-hover
      "editor.selectionBackground": "#29a37d4d",
      "editorIndentGuide.background1": "rgba(255, 255, 255, 0.08)", // --border
      "editorWidget.background": "#0d1c2d", // --surface
      "editorWidget.border": "#1c2b3c", // --surface-3
      "scrollbarSlider.background": "#29a37d66",
      "scrollbarSlider.hoverBackground": "#30e0a199",
    },
  });

  monaco.editor.defineTheme("syntax-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff", // --code-bg (light)
      "editor.lineHighlightBackground": "#f1f5f9", // --surface-2
      "editorLineNumber.foreground": "#94a3b8",
      "editorLineNumber.activeForeground": "#64748b", // --muted
      "editorCursor.foreground": "#1f8f6d", // --primary-hover (light)
      "editor.selectionBackground": "#26a17b33",
      "editorIndentGuide.background1": "#e2e8f0", // --border
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#e2e8f0",
      "scrollbarSlider.background": "#26a17b55",
      "scrollbarSlider.hoverBackground": "#1f8f6d88",
    },
  });
}

// Фон превью — «бумажный» (как в Claude), не чисто-белый
const PREVIEW_BG = "#f5f4ef";

// Emmet (emmet-monaco-es): регистрируем ОДИН раз до создания инстансов редактора.
// В Monaco 0.5x встроенный emmet вынесен из ядра, поэтому нужен отдельный плагин.
function setupEmmet(monaco) {
  if (monaco.__syntaxEmmet) return;
  emmetHTML(monaco, ["html"]);
  emmetCSS(monaco, ["css", "scss", "less"]);
  emmetJSX(monaco, ["javascript", "typescript"]);
  monaco.__syntaxEmmet = true;
}

// Скрипт перехвата console для превью/раннера (same-origin iframe).
// line: номер строки ОШИБКИ в координатах файла пользователя (аудит #3):
// e.lineno — в координатах runner-документа, window.__syntaxOffset смещает его.
const CONSOLE_CAPTURE = `<script>
  window.__logs = [];
  (function () {
    var fmt = function (a) {
      try {
        if (typeof a === "object" && a !== null) return JSON.stringify(a);
        return String(a);
      } catch (e) { return String(a); }
    };
    var push = function (type, args, line) {
      window.__logs.push({ type: type, text: Array.prototype.map.call(args, fmt).join(" "), line: line || 0 });
    };
    ["log", "info", "warn", "error"].forEach(function (k) {
      var orig = console[k] ? console[k].bind(console) : function () {};
      console[k] = function () { push(k, arguments, 0); orig.apply(null, arguments); };
    });
    window.addEventListener("error", function (e) {
      var off = window.__syntaxOffset || 0;
      var ln = e.lineno ? (e.lineno - off) : 0;
      push("error", [e.message + (ln > 0 ? " (line " + ln + ")" : "")], ln > 0 ? ln : 0);
    });
  })();
</script>`;

// Смещения строк JS-блоков: перед пользовательским кодом каждого <script> стоит
// маркер window.__syntaxOffset = N — номер строки маркера в документе. Первая
// строка кода = N + 1, т.е. file-line = doc-line - N. Числа не меняют размер блоков.
// Применимо в buildPreviewDoc / buildRunnerDoc после сборки doc.
function fixJsOffsets(doc, blocks, js) {
  if (!blocks.length) return doc;
  // Ищем присваивание ("= 0"), а не упоминание в CONSOLE_CAPTURE
  const marker = "window.__syntaxOffset = 0;";
  const first = doc.indexOf(marker);
  if (first === -1) return doc;
  const markerLine = (doc.slice(0, first).match(/\n/g) || []).length + 1; // строка тегов-маркеров
  let shift = 0;
  const fixed = blocks.map((b) => {
    const out = b.replace(marker, `window.__syntaxOffset = ${markerLine + shift + 1};`);
    shift += b.split("\n").length + 1; // +1 на \n между блоками
    return out;
  });
  return doc.replace(js, fixed.join("\n"));
}

function buildJsBlocks(files, contents) {
  // Смещение в ОТДЕЛЬНОМ <script> перед пользовательским кодом: при SyntaxError
  // сам блок не исполняется, но маркер-тег успевает (аудит #3)
  return files
    .filter((f) => f.language === "javascript")
    .map((f) => `<script>window.__syntaxOffset = 0;</script>\n<script>\n${contents[f.id] ?? ""}\n</script>`);
}

// Собирает превью: HTML-файл + инлайн CSS и JS из соседних вкладок (+ перехват console)
function buildPreviewDoc(files, contents) {
  const htmlFile = files.find((f) => f.language === "html");
  if (!htmlFile) return null;

  const css = files
    .filter((f) => f.language === "css")
    .map((f) => `<style>\n${contents[f.id] ?? ""}\n</style>`)
    .join("\n");
  const blocks = buildJsBlocks(files, contents);
  const js = blocks.join("\n");
  const baseStyle = `<style>html, body { background-color: ${PREVIEW_BG}; }</style>`;

  let doc = contents[htmlFile.id] ?? "";
  const injection = baseStyle + css + CONSOLE_CAPTURE + js;
  doc = doc.includes("</body>") ? doc.replace("</body>", `${injection}\n</body>`) : doc + injection;
  return fixJsOffsets(doc, blocks, js);
}

// Скрипт для «сухого» запуска JS-файлов без HTML: только console-перехват + JS
function buildRunnerDoc(files, contents) {
  const blocks = buildJsBlocks(files, contents);
  const js = blocks.join("\n");
  let doc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${CONSOLE_CAPTURE}${js}</body></html>`;
  return fixJsOffsets(doc, blocks, js);
}

function CodeEditor({ language = "javascript", theme = "dark", job = null, onNavigate, defaultShowPreview = true }) {
  const t = useT();

  // Стартовый файл: у урока с трека — файл урока (main.py, queries.sql, …),
  // иначе — дефолтный для языка (K2: имя/расширение соответствуют треку)
  const startFile = job && job.file ? job.file : fileNames[language] || `file.${language}`;
  const startLang = langFromFileName(startFile);
  // Код урока из базы (Supabase): строка `lessons` приходит в job.code и перебивает шаблон
  const jobCode = job && typeof job.code === "string" ? job.code : null;
  const [files, setFiles] = useState(() => [
    { id: 1, name: startFile, language: startLang },
  ]);
  // Исходный контент файлов (для Reset, аудит #5): код урока из БД / старт-шаблон, новые — пустые
  const initialContentsRef = useRef({ 1: jobCode ?? (codeTemplates[startLang] || "") });
  const [contents, setContents] = useState(() => ({ 1: jobCode ?? (codeTemplates[startLang] || "") }));
  const [activeId, setActiveId] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(defaultShowPreview);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [split, setSplit] = useState(0.5); // доля ширины: редактор / превью (аудит #6)
  const [resetConfirm, setResetConfirm] = useState(false);
  const addMenuRef = useRef(null);

  // Консоль / запуск / сдача
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [ranOnce, setRanOnce] = useState(false);
  const [consoleFlash, setConsoleFlash] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [runnerDoc, setRunnerDoc] = useState("");
  const [runnerToken, setRunnerToken] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null); // null | "ok" | "fail"
  const previewFrameRef = useRef(null);
  const runnerFrameRef = useRef(null);
  const willCollectRef = useRef(false);
  const submitPendingRef = useRef(false);
  const editorRef = useRef(null);
  const consoleRef = useRef(null);
  const wrapperRef = useRef(null);

  const activeFile = files.find((f) => f.id === activeId) || files[0];
  const hasHtml = files.some((f) => f.language === "html");
  const hasJs = files.some((f) => f.language === "javascript");
  const jobTech = job && job.techId ? getTech(job.techId) : null;

  // Консоль всегда в кадре + вспышка после Run (аудит #1): цикл «действие → фидбек»
  const scrollConsoleToView = (aggressive) => {
    setTimeout(() => {
      consoleRef.current?.scrollIntoView({ behavior: "smooth", block: aggressive ? "center" : "nearest" });
      setConsoleFlash(true);
    }, 60);
  };
  useEffect(() => {
    if (!consoleFlash) return undefined;
    const id = setTimeout(() => setConsoleFlash(false), 1200);
    return () => clearTimeout(id);
  }, [consoleFlash]);

  // Инлайн-подтверждение Reset: 5 секунд без ответа — отмена (аудит #5)
  useEffect(() => {
    if (!resetConfirm) return undefined;
    const id = setTimeout(() => setResetConfirm(false), 5000);
    return () => clearTimeout(id);
  }, [resetConfirm]);

  const handleReset = () => {
    setContents((prev) => ({
      ...prev,
      [activeFile.id]: initialContentsRef.current[activeFile.id] ?? "",
    }));
    setResetConfirm(false);
  };

  // Закрытие меню добавления файла кликом вне
  useEffect(() => {
    if (!addMenuOpen) return undefined;
    const close = (e) => {
      if (!addMenuRef.current.contains(e.target) && !e.target.closest(".file-menu")) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [addMenuOpen]);

  const toggleAddMenu = (e) => {
    if (addMenuOpen) {
      setAddMenuOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left });
    setAddMenuOpen(true);
  };

  // Уникальное имя: styles.css -> styles.css (2) -> styles.css (3)
  const uniqueName = (lang) => {
    const base = fileNames[lang] || `file.${lang}`;
    const existing = new Set(files.map((f) => f.name));
    if (!existing.has(base)) return base;
    let n = 2;
    while (existing.has(`${base} (${n})`)) n += 1;
    return `${base} (${n})`;
  };

  const addFile = (lang) => {
    const id = Math.max(...files.map((f) => f.id)) + 1;
    setFiles((prev) => [...prev, { id, name: uniqueName(lang), language: lang }]);
    // Новые файлы — чистые, без дублирования шаблона
    initialContentsRef.current[id] = "";
    setContents((prev) => ({ ...prev, [id]: "" }));
    setActiveId(id);
    setAddMenuOpen(false);
  };

  const closeFile = (id) => {
    if (files.length <= 1) return;
    const idx = files.findIndex((f) => f.id === id);
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    setContents((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeId === id) {
      setActiveId(remaining[Math.min(idx, remaining.length - 1)].id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(contents[activeFile.id] ?? "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const previewDoc = useMemo(() => buildPreviewDoc(files, contents), [files, contents]);

  const collectFrom = (frame) => {
    let logs;
    try {
      logs = frame?.contentWindow?.__logs || [];
    } catch {
      logs = [];
    }
    setConsoleLogs(logs);
    setRanOnce(true);
    if (submitPendingRef.current) {
      submitPendingRef.current = false;
      const failed = logs.some((l) => l.type === "error");
      setSubmitStatus(failed ? "fail" : "ok");
      // Урок из БД: успешный Submit = отметка выполнения (прогресс курса)
      if (!failed && job && job.onComplete) job.onComplete();
      // «check the console» должен сопровождаться видимой консолью (аудит #1)
      scrollConsoleToView(failed);
    } else {
      scrollConsoleToView(false);
    }
  };

  const runCode = () => {
    setSubmitStatus(null);
    if (hasHtml) {
      // Run = запустить и показать результат: превью включается само (глазик убран)
      willCollectRef.current = true;
      setShowPreview(true);
      setRunToken((v) => v + 1);
    } else if (hasJs) {
      setRunnerDoc(buildRunnerDoc(files, contents));
      setRunnerToken((v) => v + 1);
    } else {
      // Не-JS workspace (Python/SQL/CSS-один): Run не молчит никогда (аудит #2)
      const lang = activeFile.language;
      const text =
        lang === "css"
          ? t("editor.cssOnly")
          : t("editor.runnerSoon", {
              lang: lang === "python" ? "Python" : lang === "sql" ? "SQL" : lang.toUpperCase(),
            });
      setConsoleLogs([{ type: "info", text }]);
      setRanOnce(true);
      scrollConsoleToView(false);
    }
  };

  const runRef = useRef(null);
  useEffect(() => {
    runRef.current = runCode; // актуальный обработчик для хоткея Ctrl/⌘+Enter
  });

  const submitSolution = () => {
    setSubmitStatus(null);
    // Без JS/HTML раннера нет — вердикт честный: подсказка в консоли, без «accepted»
    if (!hasHtml && !hasJs) {
      runCode();
      return;
    }
    submitPendingRef.current = true;
    runCode();
  };

  // Drag: перестановка вкладок файлов
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  // Drag: разделитель редактор/превью (аудит #6), ширина — на время сессии
  const startSplitDrag = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const p = (ev.clientX - rect.left) / rect.width;
      setSplit(Math.min(0.75, Math.max(0.25, p)));
    };
    const up = () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <section className="card code-card code-card--full">
      <header className="code-card__head">
        <span className="code-card__file">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m8 8-5 4 5 4M16 8l5 4-5 4M13 5l-2 14" />
          </svg>
          {activeFile.name}
        </span>
        <div className="code-card__actions">
          <button
            className="btn btn--primary btn--run"
            type="button"
            title={`${t("editor.run")} — ${t("editor.runHint")}`}
            onClick={runCode}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m7 5 12 7-12 7V5Z" />
            </svg>
            {t("editor.run")}
          </button>
          {job && (
            <button className="btn btn--ghost btn--run" type="button" onClick={submitSolution}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
              {/* Мобилка: короткая подпись «Submit» (аудит #8) */}
              <span className="btn-label btn-label--full">{t("editor.submit")}</span>
              <span className="btn-label btn-label--short">{t("editor.submitShort")}</span>
            </button>
          )}
          {/* Reset: инлайн-подтверждение вместо dialog (аудит #5) */}
          {resetConfirm ? (
            <span className="code-reset-confirm">
              <button className="btn btn--ghost btn--sm" type="button" onClick={handleReset}>
                {t("editor.resetYes")}
              </button>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setResetConfirm(false)}>
                {t("editor.cancel")}
              </button>
            </span>
          ) : (
            <button
              className="icon-btn icon-btn--sm"
              type="button"
              aria-label={t("editor.reset")}
              title={`${t("editor.reset")} — ${t("editor.resetAsk")}`}
              onClick={() => setResetConfirm(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
          <button
            className="icon-btn icon-btn--sm"
            type="button"
            aria-label={t("editor.copy")}
            onClick={handleCopy}
          >
            {copied ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Статус сдачи решения */}
      {submitStatus && (
        <div className={`editor-status editor-status--${submitStatus}`} role="status">
          {submitStatus === "ok" ? t("editor.submitOk") : t("editor.submitFail")}
        </div>
      )}

      {/* Контекст урока/задания. Back ведёт на СВОЙ трек (аудит #4): techId из job */}
      {job && (
        <div className="editor-job">
          <div className="editor-job__row">
            <span className="chip">
              {jobTech ? `${t(jobTech.label)} · ` : ""}
              {job.kind === "lesson" ? t("editor.lessonLabel") : t("editor.taskLabel")}
            </span>
            {job.fromDb && <span className="chip chip--db">{t("editor.dbSource")}</span>}
            <button
              type="button"
              className="editor-job__back"
              onClick={() => onNavigate(job.backTab, job.techId ? { techId: job.techId } : null)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              {t("editor.back")}
            </button>
          </div>
          <h3 className="editor-job__title">{job.title}</h3>
          <p className="editor-job__desc">{job.desc}</p>
        </div>
      )}

      {/* Бесконтекстный редактор = песочница: подсказка + выход в задания (аудит #7) */}
      {!job && (
        <div className="editor-freemode">
          <span>{t("editor.freeMode")}</span>
          <button type="button" onClick={() => onNavigate("tasks")}>
            {t("editor.freeModeLink")} →
          </button>
        </div>
      )}

      {/* Вкладки файлов */}
      <div className="file-tabs">
        <div className="file-tabs__scroll" role="tablist" aria-label={t("editor.files")}>
          {files.map((f, index) => (
          <div
            key={f.id}
            role="tab"
            tabIndex={0}
            aria-selected={f.id === activeId}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => setDragIndex(null)}
            onClick={() => setActiveId(f.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveId(f.id);
              }
            }}
            className={`file-tab ${f.id === activeId ? "is-active" : ""} ${
              dragIndex === index ? "is-dragging" : ""
            }`}
          >
            <span className="file-tab__name">{f.name}</span>
            {files.length > 1 && (
              <button
                type="button"
                className="file-tab__close"
                aria-label={t("editor.closeFile")}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(f.id);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
          ))}
          <div className="file-tabs__add" ref={addMenuRef}>
            <button
              className="icon-btn icon-btn--sm file-tabs__add-btn"
              type="button"
              aria-label={t("editor.addFile")}
              aria-haspopup="true"
              aria-expanded={addMenuOpen}
              onClick={toggleAddMenu}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Меню добавления файла: fixed, чтобы не клипалось скролл-контейнером */}
      {addMenuOpen && menuPos && (
        <div
          className="file-menu"
          role="menu"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {ADDABLE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              role="menuitem"
              className="file-menu__item"
              onClick={() => addFile(lang)}
            >
              <span className="file-menu__lang" aria-hidden="true">
                {lang === "javascript" ? "JS" : lang.toUpperCase()}
              </span>
              {t(`editor.lang.${lang}`)}
            </button>
          ))}
        </div>
      )}

      <div className="code-card__editor-wrapper" ref={wrapperRef}>
        <div className="code-card__editor-pane" style={hasHtml && showPreview ? { flex: `${split} 1 0px` } : undefined}>
          <div className="editor-host">
            <Editor
              height="100%"
              language={activeFile.language}
              theme={theme === "light" ? "syntax-light" : "syntax-dark"}
              beforeMount={(monaco) => {
                definePlatformThemes(monaco);
                setupEmmet(monaco);
              }}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                // Ctrl/⌘+Enter — Run: базовая привычка кодеров (аудит #9)
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
              }}
              value={contents[activeFile.id] ?? ""}
              onChange={(value) =>
                setContents((prev) => ({ ...prev, [activeFile.id]: value ?? "" }))
              }
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 },
                glyphMargin: false,
                folding: false,
                renderLineHighlight: "line",
                // Emmet работает через плагин emmet-monaco-es (см. setupEmmet): Tab разворачивает аббревиатуры
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>

          {/* Консоль ВСЕГДА в кадре (аудит #1): до первого Run — подсказка */}
          <div className={`editor-console ${consoleFlash ? "editor-console--flash" : ""}`} ref={consoleRef}>
            <div className="editor-console__head">
              <span>{t("editor.console")}</span>
              <button
                type="button"
                className="editor-console__clear"
                onClick={() => setConsoleLogs([])}
              >
                {t("editor.clear")}
              </button>
            </div>
            <div className="editor-console__body">
              {consoleLogs.length === 0 ? (
                <span className="editor-console__empty">
                  {ranOnce ? "—" : t("editor.consoleHint")}
                </span>
              ) : (
                consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`log-line log-line--${log.type} ${log.line ? "log-line--link" : ""}`}
                    title={log.line ? t("editor.jumpToLine") : undefined}
                    onClick={
                      log.line
                        ? () => {
                            const ed = editorRef.current;
                            if (!ed) return;
                            ed.revealLineInCenter(log.line);
                            ed.setPosition({ lineNumber: log.line, column: 1 });
                            ed.focus();
                          }
                        : undefined
                    }
                  >
                    {log.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {hasHtml && (
          <>
            {showPreview && <div className="editor-split-handle" onMouseDown={startSplitDrag} aria-hidden="true"></div>}
            {/* iframe для HTML всегда смонтирован (даже при скрытом превью):
                именно его onLoad собирает логи — иначе Run/Submit молчат без превью */}
            <iframe
              className={`editor-preview ${showPreview ? "" : "editor-preview--hidden"}`}
              title={t("editor.preview")}
              srcDoc={previewDoc}
              key={runToken}
              ref={previewFrameRef}
              sandbox="allow-scripts allow-same-origin"
              style={showPreview ? { flex: `${(1 - split).toFixed(4)} 1 0px` } : undefined}
              onLoad={() => {
                if (willCollectRef.current) {
                  willCollectRef.current = false;
                  setTimeout(() => collectFrom(previewFrameRef.current), 250);
                }
              }}
            />
          </>
        )}
        {/* Скрытый раннер для JS-файлов без HTML: результат — в консоли */}
        {!hasHtml && hasJs && runnerToken > 0 && (
          <iframe
            key={runnerToken}
            className="js-runner"
            ref={runnerFrameRef}
            title="JS runner"
            srcDoc={runnerDoc}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setTimeout(() => collectFrom(runnerFrameRef.current), 250)}
          />
        )}
      </div>
    </section>
  );
}

export default CodeEditor;
