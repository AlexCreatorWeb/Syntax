// AI Assistant — HuggingFace Inference API, модель google/gemma-2-9b-it.
// Ключ — из VITE_HF_API_KEY (.env). Ключ — обычный HF token (hf_…),
// в браузер попадает VITE_-префиксом, но учти: без бэкенда любой токен виден в сети.
//
// Эндпоинт — OpenAI-совместимый чат-роутер: POST /v1/chat/completions,
// `stream: true` → SSE-поток (data: {...}). Старый api-inference.huggingface.co
// отключён — работает только router.huggingface.co. Холодный старт модели:
// заголовок X-Wait-For-Model: true — роутер держит запрос в очереди вместо 503.
const HF_BASE = "https://router.huggingface.co/v1";
export const AI_MODEL = "google/gemma-2-9b-it";
const HF_KEY = import.meta.env.VITE_HF_API_KEY || "";

export const isAiConfigured = () => Boolean(HF_KEY);

// Сис-промпт: репетитор Syntax, знает трек студента, отвечает в его языке,
// формат — markdown-lite (парсер: src/lib/markdown.js — без таблиц/списков).
export function buildSystemPrompt(techName) {
  return [
    "You are Syntax AI, the friendly coding tutor of the Syntax learning platform (people learn programming right in the browser).",
    techName ? `The student is currently on the "${techName}" track — prefer examples in that technology when relevant.` : "",
    "Rules: answer in the student's own language; be concise (under 200 words) and practical; show code in fenced blocks with a language tag.",
    "Formatting: use **bold**, `inline code` and ``` fenced code blocks. Do NOT use markdown tables, links with images, or ordered/unordered list syntax (no leading - or 1.) — write plain paragraphs instead; separate items with blank lines.",
    "If the question is not about coding, still keep the answer short and helpful.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Ошибка с «человечным» кодом: badKey / rateLimit / modelLoading / network / http.
export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Прогоняет SSE-поток, вызывает onToken(text) по мере прихода дельт.
// Возвращает полное собрание текста. signal — для отмены.
async function streamChatCompletion({ messages, signal, onToken }) {
  const res = await fetch(`${HF_BASE}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_KEY}`,
      "X-Wait-For-Model": "true",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      stream: true,
      temperature: 0.4,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    let code = "http";
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = (data && (data.message || data.error)) || message;
    } catch {
      /* тело не JSON */
    }
    if (res.status === 401 || res.status === 403) code = "badKey";
    else if (res.status === 429) code = "rateLimit";
    else if (res.status === 503) code = "modelLoading";
    throw new AiError(code, message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  // SSE: события разделены пустой строкой, строки вида «data: {...}» / «data: [DONE]».
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, sep).trim();
      buf = buf.slice(sep + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        continue; // неполный/служебный фрагмент
      }
      // 503-обёртка «модель грузится» приходит и внутри потока
      if (json.status === "loading") throw new AiError("modelLoading", json.error || "Model is warming up");
      const delta = json.choices && json.choices[0] && json.choices[0].delta;
      if (delta && typeof delta.content === "string" && delta.content) {
        full += delta.content;
        onToken(delta.content);
      }
    }
  }
  return full;
}

/**
 * Очередь одного сообщения студента.
 * history — массив {role, content} предыдущих сообщений (без сис-промпта).
 * @returns {Promise<void>} — onToken получает дельты, ответ уже в messages последнего элемента
 */
export async function askAssistant({ techName, history, question, onToken, signal }) {
  if (!isAiConfigured()) throw new AiError("noKey", "VITE_HF_API_KEY is not set");
  const messages = [
    { role: "system", content: buildSystemPrompt(techName) },
    ...history.slice(-10),
    { role: "user", content: question },
  ];
  let acc = "";
  const token = (txt) => {
    acc += txt;
    onToken(acc);
  };
  try {
    await streamChatCompletion({ messages, signal, onToken: token });
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    if (e instanceof AiError) throw e;
    throw new AiError("network", e && e.message ? e.message : "Network error");
  }
  return acc;
}
