import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { emmetCSS, emmetHTML, emmetJSX } from "emmet-monaco-es";
import { useT } from "../i18n/useT";
import { getTech } from "../lib/techs";
import { NODE_SHIMS_SRC } from "../lib/node-shims";

// Старт-код редактора: БАЗОВАЯ РАЗМЕТКА/заготовка по языку (фидбек: «код должен быть
// базовой разметкой или под конкретную задачу»). Урок из БД с колонкой `code` подменяет
// шаблон задачей; без `code` — базовая заготовка под тип файла.
const codeTemplates = {
  javascript: `// Your code here

console.log("Hello, Syntax!");`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My page</title>
</head>
<body>
  <!-- TODO: your markup here -->
  <h1>Hello, Syntax!</h1>
</body>
</html>`,

  css: `/* Your styles here */

body {
  margin: 0;
}`, 

  python: `# Your code here

print("Hello, Syntax!")`,

  sql: `-- Your query here

SELECT 1;`,
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
const PREVIEW_BG = "#e8e7e1"; // приглушённый фон превью (фидбек 2026-09: не чисто-белый)

// Emmet (emmet-monaco-es): регистрируем ОДИН раз до создания инстансов редактора.
// В Monaco 0.5x встроенный emmet вынесен из ядра, поэтому нужен отдельный плагин.
function setupEmmet(monaco) {
  if (monaco.__syntaxEmmet) return;
  emmetHTML(monaco, ["html"]);
  emmetCSS(monaco, ["css", "scss", "less"]);
  emmetJSX(monaco, ["javascript", "typescript", "jsx", "tsx"]);
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
    .filter((f) => f.language === "javascript" && !/\.jsx$/.test(f.name)) // jsx → React-раннер (buildReactDoc)
    .map((f) => `<script>window.__syntaxOffset = 0;</script>\n<script>\n${contents[f.id] ?? ""}\n</script>`);
}

// Собирает превью: HTML-файл + инлайн CSS и JS из соседних вкладок (+ перехват console)
function buildPreviewDoc(files, contents) {
  const htmlFile = files.find((f) => f.language === "html" && !/\.vue$/.test(f.name)); // .vue → Vue-раннер
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
// Python-раннер: main.py → Pyodide (настоящий CPython 3.12 в WASM, CDN jsDelivr).
// Код студента — как есть в text/plain-теге (экранируем </script), runPythonAsync: traceback-строки
// совпадают со строками файла (1-indexed) — клик по ошибке работает без сдвига.
// setStdout/setStderr → console-перехват (CONSOLE_CAPTURE). Top-level await поддерживается (asyncio-уроки).
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

function buildPythonDoc(pyCode) {
  const src = (pyCode || "").replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html, body { margin: 0; background-color: ${PREVIEW_BG}; }</style>
</head><body>
${CONSOLE_CAPTURE}
<script src="${PYODIDE_URL}pyodide.js"></script>
<script type="text/plain" id="syntax-py-src">
${src}
</script>
<script>
(async () => {
  try {
    window.__syntaxOffset = 0; // traceback = строки файла (код передаётся как есть)
    var pyodide = await loadPyodide({ indexURL: "${PYODIDE_URL}" });
    pyodide.setStdout({ batched: function (t) { console.log(t); } });
    pyodide.setStderr({ batched: function (t) { console.error(t); } });
    var code = document.getElementById("syntax-py-src").textContent.replace(/^\\n/, "").split("<\\\\/script").join("</scr" + "ipt");
    await pyodide.runPythonAsync(code);
    console.log("[Syntax] Python sandbox ready (CPython " + pyodide.version + ")");
  } catch (e) {
    console.error(String((e && e.message) || e));
  }
})();
</script>
</body></html>`;
}

function buildRunnerDoc(files, contents, job = null) {
  const vueFile = files.find((f) => f.language === "html" && /\.vue$/.test(f.name));
  if (vueFile) return buildVueDoc(contents[vueFile.id] ?? "");
  const jsxFile = files.find((f) => f.language === "javascript" && /\.jsx$/.test(f.name));
  if (jsxFile) return buildReactDoc(contents[jsxFile.id] ?? "");
  // Python-трехк: main.py → Pyodide (настоящий CPython в WASM)
  if (job && job.techId === "python") {
    const pyFile = files.find((f) => f.language === "python" && /\.py$/.test(f.name));
    if (pyFile) return buildPythonDoc(contents[pyFile.id] ?? "");
  }
  // Node/mongo-трехк: .js-файл (server.js / models.js) → Node-sandbox (ESM + import map)
  const isNodeTrack = Boolean(job && (job.techId === "node" || job.techId === "mongo"));
  if (isNodeTrack) {
    const jsFile = files.find((f) => f.language === "javascript" && /\.js$/.test(f.name));
    if (jsFile) return buildNodeDoc(contents[jsFile.id] ?? "");
  }
  const blocks = buildJsBlocks(files, contents);
  const js = blocks.join("\n");
  let doc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${CONSOLE_CAPTURE}${js}</body></html>`;
  return fixJsOffsets(doc, blocks, js);
}

// React-раннер: App.jsx → Babel (JSX, automatic runtime) → blob-module → createRoot.
// React 18 с esm.sh (одна копия для импортов студента и раннера), Babel — unpkg.
// Контракт урока: компонент называется App (function App / const App / export default).
// Номера строк ошибок: маркер-комментарий в начале кода → его строка в ТРАНСФОРМИРОВАННОМ
// модуле = window.__syntaxOffset (e.lineno у blob-module — в координатах blob, а не документа).
const REACT_IMPORT_MAP = JSON.stringify({
  imports: {
    react: "https://esm.sh/react@18.3.1",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  },
});

function buildReactDoc(appCode) {
  const src = (appCode || "").replace(/<\/script/gi, "<\\/script"); // не рвём тег при </script> в коде
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html, body { margin: 0; background-color: ${PREVIEW_BG}; }</style>
<script type="importmap">${REACT_IMPORT_MAP}</script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
</head><body>
<div id="root"></div>
${CONSOLE_CAPTURE}
<script type="text/plain" id="syntax-app-src">
${src}
</script>
<script type="module">
import { createRoot } from "react-dom/client";
import { createElement } from "react";
window.__syntaxMounted = false;
window.__SyntaxMount = function (C) {
  if (!C || window.__syntaxMounted) return;
  try {
    createRoot(document.getElementById("root")).render(createElement(C));
    window.__syntaxMounted = true;
    console.log("[Syntax] React app mounted");
  } catch (e) { console.error("mount error: " + (e.message || e)); }
};
try {
  const raw = document.getElementById("syntax-app-src").textContent;
  const marked = "// __SYNTAX_FILE_START__\\n" + raw + "\\n__SyntaxMount(typeof App !== \\"undefined\\" ? App : undefined);";
  const out = Babel.transform(marked, { presets: [[Babel.availablePresets.react, { runtime: "automatic" }]], filename: "App.jsx" }).code;
  const markerLine = (out.slice(0, out.indexOf("// __SYNTAX_FILE_START__")).match(/\\n/g) || []).length + 1;
  window.__syntaxOffset = markerLine;
  const url = URL.createObjectURL(new Blob([out], { type: "text/javascript" }));
  const mod = await import(url);
  if (!window.__syntaxMounted) window.__SyntaxMount(mod.default);
} catch (e) {
  console.error("App.jsx: " + String((e && e.message) || e).split("\\n")[0]);
}
</script>
</body></html>`;
}

// Vue-раннер: App.vue (SFC) → @vue/compiler-sfc (parse + compileScript + compileTemplate)
// → единый blob-module (скрипт + render) → createApp + mount. Всё из unpkg esm-bundler
// (одна копия Vue: bare-импорты vue-router/pinia резолвятся через import map),
// @vue/compiler-sfc — esm.sh. Контракт урока: SFC с <script setup> и <template>;
// опционально export const router / export const pinia в обычном <script>-блоке.
// Номера строк: window.__syntaxOffset = 1 - (строка первой строки <script> в .vue) —
// e.lineno у blob-module в координатах blob, скрипт студента идёт в начале blob.
const VUE_IMPORT_MAP = JSON.stringify({
  imports: {
    vue: "https://unpkg.com/vue@3.4.38/dist/vue.esm-bundler.js",
    "@vue/compiler-dom": "https://unpkg.com/@vue/compiler-dom@3.4.38/dist/compiler-dom.esm-bundler.js",
    "@vue/compiler-core": "https://unpkg.com/@vue/compiler-core@3.4.38/dist/compiler-core.esm-bundler.js",
    "@vue/runtime-dom": "https://unpkg.com/@vue/runtime-dom@3.4.38/dist/runtime-dom.esm-bundler.js",
    "@vue/runtime-core": "https://unpkg.com/@vue/runtime-core@3.4.38/dist/runtime-core.esm-bundler.js",
    "@vue/reactivity": "https://unpkg.com/@vue/reactivity@3.4.38/dist/reactivity.esm-bundler.js",
    "@vue/shared": "https://unpkg.com/@vue/shared@3.4.38/dist/shared.esm-bundler.js",
    "vue-router": "https://unpkg.com/vue-router@4.4.3/dist/vue-router.mjs",
    pinia: "https://unpkg.com/pinia@2.1.7/dist/pinia.mjs",
    "vue-demi": "https://unpkg.com/vue-demi@0.14.10/lib/index.mjs",
    "@vue/devtools-api": "https://unpkg.com/@vue/devtools-api@6.6.3/lib/esm/index.js",
    "@vue/compiler-sfc": "https://esm.sh/@vue/compiler-sfc@3.4.38",
  },
});

function buildVueDoc(appCode) {
  // </script> внутри SFC ломал бы хранилище-тег — экранируем; раннер разэкранирует
  const src = (appCode || "").replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html, body { margin: 0; background-color: ${PREVIEW_BG}; }</style>
<script>window.process = { env: { NODE_ENV: "development" } };
window.__VUE_OPTIONS_API__ = true; window.__VUE_PROD_DEVTOOLS__ = false; window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;</script>
<script type="importmap">${VUE_IMPORT_MAP}</script>
</head><body>
<div id="root"></div>
${CONSOLE_CAPTURE}
<script type="text/plain" id="syntax-app-src">
${src}
</script>
<script type="module">
(async () => {
  try {
    const { createApp } = await import("vue");
    const { parse, compileScript, compileTemplate } = await import("@vue/compiler-sfc");
    const src = document.getElementById("syntax-app-src").textContent.split("<\\\\/script").join("</scr" + "ipt");
    // offset: строка (1-indexed) первой строки содержимого <script> в .vue
    const lines = src.split("\\n");
    let contentStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^\\s*<script/.test(lines[i])) { contentStart = i + 2; break; }
    }
    window.__syntaxOffset = 1 - contentStart;
    const { descriptor, errors } = parse(src, { filename: "App.vue" });
    if (errors && errors.length) console.error("App.vue: " + errors[0].message);
    let code = "";
    let bindings = undefined;
    if (descriptor.script || descriptor.scriptSetup) {
      const script = compileScript(descriptor, { id: "syntax-app" });
      code += script.content;
      bindings = script.bindings;
    }
    if (descriptor.template) {
      const tpl = compileTemplate({
        source: descriptor.template.content,
        id: "syntax-app",
        filename: "App.vue",
        compilerOptions: { mode: "module", bindingMetadata: bindings },
      });
      if (tpl.errors && tpl.errors.length) console.error("App.vue template: " + tpl.errors[0].message);
      code += "\\n" + tpl.code; // import {...} from "vue" + export function render(...)
    }
    for (const s of descriptor.styles || []) {
      document.head.insertAdjacentHTML("beforeend", "<style>" + s.content + "</style>");
    }
    const blob = new Blob([code], { type: "text/javascript" });
    const mod = await import(URL.createObjectURL(blob));
    const App = { ...mod.default, render: mod.render };
    const app = createApp(App);
    if (mod.router) app.use(mod.router);
    if (mod.pinia) app.use(mod.pinia);
    app.config.warnHandler = (m) => console.warn("Vue warn: " + m);
    app.config.errorHandler = (e) => console.error("App.vue: " + ((e && e.message) || e));
    app.mount("#root");
    console.log("[Syntax] Vue app mounted");
  } catch (e) {
    console.error("App.vue: " + String((e && e.message) || e).split("\\n")[0]);
  }
})();
</script>
</body></html>`;
}

// Node-раннер: server.js (ESM) → blob-module в «Node-sandbox» (браузер):
// шимы built-ins (globalThis.__shims: fs/path/stream/events-мост, mock http + window.__request,
// mini-Express, pg/mongodb-моки, JWT HS256, helmet/cors) + import map (data:-модули на __shims,
// events — настоящий esm.sh). Код студента — чистый Node ESM: в терминале работает без изменений.
// Номера строк: blob = код как есть → e.lineno = строка файла (offset 0).
const NODE_SHIM_MODULES = {
  fs: "const s=globalThis.__shims.fs;export default s;export const readFileSync=(...a)=>s.readFileSync(...a);export const writeFileSync=(...a)=>s.writeFileSync(...a);export const mkdirSync=(...a)=>s.mkdirSync(...a);export const readdirSync=(...a)=>s.readdirSync(...a);export const existsSync=(...a)=>s.existsSync(...a);export const statSync=(...a)=>s.statSync(...a);export const unlinkSync=(...a)=>s.unlinkSync(...a);export const accessSync=(...a)=>s.accessSync(...a);export const readFile=(...a)=>s.readFile(...a);export const writeFile=(...a)=>s.writeFile(...a);export const mkdir=(...a)=>s.mkdir(...a);export const appendFile=(...a)=>s.appendFile(...a);export const createReadStream=(...a)=>s.createReadStream(...a);export const createWriteStream=(...a)=>s.createWriteStream(...a);",
  path: "export default globalThis.__shims.path;",
  stream: "const s=globalThis.__shims.stream;export default s;export const Readable=s.Readable;export const Writable=s.Writable;export const Transform=s.Transform;export const PassThrough=s.PassThrough;export const Duplex=s.Duplex;",
  http: "const s=globalThis.__shims.http;export default s;export const createServer=(...a)=>s.createServer(...a);export const STATUS_CODES=s.STATUS_CODES;export const METHODS=s.METHODS;",
  express: "const s=globalThis.__shims.express;export default s;export const Router=s.Router;",
  pg: "export default globalThis.__shims.pg;",
  mongodb: "const s=globalThis.__shims.mongodb;export default s;export const MongoClient=s.MongoClient;export const ObjectId=s.ObjectId;",
  mongoose: "export default globalThis.__shims.mongoose;",
  jsonwebtoken: "export default globalThis.__shims.jsonwebtoken;",
  bcrypt: "export default globalThis.__shims.bcrypt;",
  bcryptjs: "export default globalThis.__shims.bcryptjs;",
  helmet: "export default globalThis.__shims.helmet;",
  cors: "export default globalThis.__shims.cors;",
  dotenv: "export default globalThis.__shims.dotenv;",
  util: "export default globalThis.__shims.util;",
  events: "https://esm.sh/events@3.3.0",
  os: "export default {platform:()=>'linux',cpus:()=>[{model:'sandbox'}],freemem:()=>1073741824,totalmem:()=>2147483648,release:()=>'sandbox'};",
};
const NODE_IMPORT_MAP = JSON.stringify({
  imports: Object.fromEntries(
    Object.entries(NODE_SHIM_MODULES).flatMap(([k, v]) => {
      const url = v.startsWith("http") ? v : "data:text/javascript," + encodeURIComponent(v);
      return [[k, url], ["node:" + k, url]];
    })
  ),
});

function buildNodeDoc(serverCode) {
  // </script> внутри кода ломал бы хранилище-тег — экранируем; раннер разэкранирует
  const src = (serverCode || "").replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html, body { margin: 0; background-color: ${PREVIEW_BG}; }</style>
<script>${NODE_SHIMS_SRC}</script>
<script type="importmap">${NODE_IMPORT_MAP}</script>
</head><body>
${CONSOLE_CAPTURE}
<script type="text/plain" id="syntax-app-src">
${src}
</script>
<script type="module">
(async () => {
  try {
    const src = document.getElementById("syntax-app-src").textContent.split("<\\\\/script").join("</scr" + "ipt");
    window.__syntaxOffset = 0; // blob = код как есть: e.lineno = строка файла
    const blob = new Blob([src], { type: "text/javascript" });
    await import(URL.createObjectURL(blob));
    console.log("[Syntax] Node sandbox ready");
  } catch (e) {
    console.error("server.js: " + String((e && e.message) || e).split("\\n")[0]);
  }
})();
</script>
</body></html>`;
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
  const hasHtml = files.some((f) => f.language === "html" && !/\.vue$/.test(f.name)); // .vue → раннер, не превью
  const hasJs = files.some((f) => f.language === "javascript" || /\.vue$/.test(f.name));
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

  // «Очистить редактор»: активный файл → пустой (одной кнопкой, без подтверждения —
  // фидбек: инлайн-пара Reset/Cancel «вылетала» и не использовалась)
  const handleClear = () => {
    setContents((prev) => ({
      ...prev,
      [activeFile.id]: "",
    }));
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

  // M6: превью «белый лист» — подсказка вместо молчащего пустого iframe.
  // Проверка по реальному HTML: без комментариев и тегов видимого текста нет → страница пуста.
  const previewBodyEmpty = useMemo(() => {
    if (!hasHtml) return false;
    const html = files.filter((f) => f.language === "html").map((f) => contents[f.id] || "").join("");
    const noComments = html.replace(/<!--[\s\S]*?-->/g, "");
    // <style>/<script> (baseStyle раннера) — тоже не «видимый текст» страницы
    const noInert = noComments.replace(/<(style|script)[\s\S]*?<\/\1>/gi, "");
    const bodyMatch = noInert.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const inner = (bodyMatch ? bodyMatch[1] : noInert).replace(/<[^>]+>/g, " ");
    return inner.replace(/\s+/g, " ").trim() === "";
  }, [files, contents, hasHtml]);

  // H3: сколько TODO-шагов задания осталось в воркспейсе (вердикт Submit без ложного «accepted»)
  const todosLeft = useMemo(
    () => files.reduce((n, f) => n + ((contents[f.id] || "").match(/TODO/g) || []).length, 0),
    [files, contents]
  );

  const collectFrom = (frame) => {
    let logs;
    try {
      logs = frame?.contentWindow?.__logs || [];
    } catch {
      logs = [];
    }
    // HTML: в консоль — и разметка страницы (что реально собрал браузер), и логи страницы
    let markup = "";
    try {
      if (hasHtml) markup = frame?.contentDocument?.documentElement?.outerHTML || "";
    } catch {
      /* iframe недоступен — без разметки */
    }
    const entries = [...(logs.length ? logs : hasHtml ? [{ type: "info", text: t("editor.htmlResultHint") }] : [])];
    if (hasHtml && markup) entries.push({ type: "markup", text: markup });
    setConsoleLogs(entries);
    setRanOnce(true);
    if (submitPendingRef.current) {
      submitPendingRef.current = false;
      const failed = logs.some((l) => l.type === "error");
      // H3: «accepted» только когда ошибок нет И TODO-шаги задания завершены
      if (failed) setSubmitStatus("fail");
      else if (todosLeft > 0) setSubmitStatus("todos");
      else setSubmitStatus("ok");
      // Урок из БД: успешный Submit = отметка выполнения (прогресс курса) — только полный успех
      if (!failed && todosLeft === 0 && job && job.onComplete) job.onComplete();
      // «check the console» должен сопровождаться видимой консолью (аудит #1)
      scrollConsoleToView(failed || todosLeft > 0);
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
      setRunnerDoc(buildRunnerDoc(files, contents, job));
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
    // H3: код не тронут — вердикта нет, студента ведут к первому TODO
    const changed = files.some((f) => (contents[f.id] ?? "") !== (initialContentsRef.current[f.id] ?? ""));
    if (!changed) {
      const startCode = contents[1] ?? "";
      const todoLine = startCode.split("\n").findIndex((l) => l.includes("TODO"));
      setConsoleLogs([{ type: "info", text: t("editor.submitUnchanged") }]);
      setRanOnce(true);
      if (todoLine >= 0) setTimeout(() => editorRef.current?.revealLineInCenter(todoLine), 120);
      scrollConsoleToView(true);
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
          {hasHtml && (
            // Переключатель превью: крестик закрывает панель, глазик возвращает (фидбек 2026-09)
            <button
              className="icon-btn"
              type="button"
              title={showPreview ? t("editor.closePreview") : t("editor.preview")}
              aria-pressed={showPreview}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
                  <path d="M2 2l20 20" />
                </svg>
              )}
            </button>
          )}
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
          {/* Очистить редактор: одна кнопка, без пары-подтверждения (фидбек 2026-09) */}
          <button
            className="icon-btn icon-btn--sm"
            type="button"
            aria-label={t("editor.clearCode")}
            title={t("editor.clearCode")}
            onClick={handleClear}
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
              <path d="M20 20H8.5L3.9 15.4a2 2 0 0 1 0-2.8L13 3.5a2 2 0 0 1 2.8 0l4.7 4.7a2 2 0 0 1 0 2.8L11 20" />
              <path d="m7 10 5 5" />
              <path d="M14.5 6.5 19 11" />
            </svg>
          </button>
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
          {submitStatus === "ok" ? t("editor.submitOk") : submitStatus === "todos" ? t("editor.submitTodosLeft", { n: todosLeft }) : t("editor.submitFail")}
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
              language={activeFile.language === "javascript" && /\.jsx$/.test(activeFile.name) ? "jsx" : activeFile.language}
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
                consoleLogs.map((log, i) => {
                  // HTML-разметка страницы — отдельный блок с подписью (pre, без переносов строк)
                  if (log.type === "markup") {
                    return (
                      <div key={i} className="log-markup">
                        <span className="log-markup__label">{t("editor.markupLabel")}</span>
                        <pre className="log-markup__pre">{log.text}</pre>
                      </div>
                    );
                  }
                  return (
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
                  );
                })
              )}
            </div>
          </div>
        </div>
        {hasHtml && (
          <>
            {showPreview && <div className="editor-split-handle" onMouseDown={startSplitDrag} aria-hidden="true"></div>}
            {/* iframe для HTML всегда смонтирован (даже при скрытом превью):
                именно его onLoad собирает логи — иначе Run/Submit молчат без превью */}
            <div
              className={`editor-preview-wrap ${showPreview ? "" : "editor-preview-wrap--hidden"}`}
              style={showPreview ? { flex: `${(1 - split).toFixed(4)} 1 0px` } : undefined}
            >
              <iframe
                className="editor-preview"
                title={t("editor.preview")}
                srcDoc={previewDoc}
                key={runToken}
                ref={previewFrameRef}
                sandbox="allow-scripts allow-same-origin"
                onLoad={() => {
                  if (willCollectRef.current) {
                    willCollectRef.current = false;
                    setTimeout(() => collectFrom(previewFrameRef.current), 250);
                  }
                }}
              />
              {/* Крестик: закрыть панель превью (редактор на всю ширину; глазик в тулбаре возвращает) */}
              {showPreview && (
                <button
                  type="button"
                  className="editor-preview-close"
                  aria-label={t("editor.closePreview")}
                  onClick={() => setShowPreview(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
              {/* M6: пустая страница в превью — не «сбой», а ожидание: подсказка поверх */}
              {showPreview && previewBodyEmpty && (
                <div className="editor-preview-hint" role="note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>{t("editor.previewEmpty")}</span>
                </div>
              )}
            </div>
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
