import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { emmetCSS, emmetHTML, emmetJSX } from "emmet-monaco-es";
import { useT } from "../i18n/useT";

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

// Собирает превью: HTML-файл + инлайн CSS и JS из соседних вкладок
function buildPreviewDoc(files, contents) {
  const htmlFile = files.find((f) => f.language === "html");
  if (!htmlFile) return null;

  const css = files
    .filter((f) => f.language === "css")
    .map((f) => `<style>\n${contents[f.id] ?? ""}\n</style>`)
    .join("\n");
  const js = files
    .filter((f) => f.language === "javascript")
    .map((f) => `<script>\n${contents[f.id] ?? ""}\n</script>`)
    .join("\n");
  const baseStyle = `<style>html, body { background-color: ${PREVIEW_BG}; }</style>`;

  let doc = contents[htmlFile.id] ?? "";
  const injection = baseStyle + css + js;
  doc = doc.includes("</body>") ? doc.replace("</body>", `${injection}\n</body>`) : doc + injection;
  return doc;
}

function CodeEditor({ language = "javascript", theme = "dark" }) {
  const t = useT();

  // Стартовый файл — пример кода технологии, выбранной пользователем
  const [files, setFiles] = useState(() => [
    { id: 1, name: fileNames[language] || `file.${language}`, language },
  ]);
  const [contents, setContents] = useState(() => ({ 1: codeTemplates[language] || "" }));
  const [activeId, setActiveId] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const addMenuRef = useRef(null);

  const activeFile = files.find((f) => f.id === activeId) || files[0];
  const hasHtml = files.some((f) => f.language === "html");

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

  // Drag & drop: перестановка вкладок файлов
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
          {hasHtml && (
            <button
              className="icon-btn icon-btn--sm"
              type="button"
              aria-label={t("editor.preview")}
              aria-pressed={showPreview}
              onClick={() => setShowPreview((v) => !v)}
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
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
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
                aria-label={`Close ${f.name}`}
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

      <div className="code-card__editor-wrapper">
        <div className="code-card__editor-pane">
          <Editor
            height="100%"
            language={activeFile.language}
            theme={theme === "light" ? "syntax-light" : "syntax-dark"}
            beforeMount={(monaco) => {
            definePlatformThemes(monaco);
            setupEmmet(monaco);
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
        {hasHtml && showPreview && (
          <iframe
            className="editor-preview"
            title={t("editor.preview")}
            srcDoc={previewDoc}
            sandbox="allow-scripts"
          />
        )}
      </div>
    </section>
  );
}

export default CodeEditor;

// touch-test 1

// touch-test 2

// touch-test 3




