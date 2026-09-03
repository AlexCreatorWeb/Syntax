// AI Assistant — модель Gemini (Google AI Studio API).
//
// ДВА режима (API-ключ НЕ плывёт в публичный бандл — VITE_* попадают туда,
// а GitHub secret-scanning ревайдит публичные токены):
//   • DEV:  есть VITE_GEMINI_API_KEY (.env.local, в git не попадает) → прямой запрос к Google;
//   • PROD: ключа нет → POST /api/ai (Vercel serverless-прокси, ключ в Vercel env
//           GEMINI_API_KEY — только на сервере). SSE-поток в обоих режимах одинаковый.
//
// Эндпоинт — streamGenerateContent?alt=sse: события «data: {json}», текст в
// candidates[0].content.parts[].text.
import { buildSystemPrompt } from "./ai-prompt";

export const AI_MODEL = "gemini-flash-lite-latest";
export const AI_MODEL_SHORT = AI_MODEL;
// Человекочитаемое имя модели для чипа в UI (честно: реальная модель, не заглушка)
export const AI_MODEL_DISPLAY = "Gemini Flash Lite";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// Внешний AI-прокси (обычно prod-Vercel): нужен, когда прямой запрос к Google из этого
// окружения гео-блокирован ("User location is not supported for the API use").
// Задаётся VITE_AI_PROXY_URL (без хвостового /), например https://syntax-sooty.vercel.app.
const AI_PROXY_BASE = (import.meta.env.VITE_AI_PROXY_URL || "").replace(/\/+$/, "");
const proxyTarget = () => (AI_PROXY_BASE ? `${AI_PROXY_BASE}/api/ai` : "/api/ai");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:streamGenerateContent?alt=sse`;

// Dev: настроен, если есть локальный ключ ИЛИ внешний прокси ИЛИ prod (есть /api/ai).
export const isAiConfigured = () => Boolean(GEMINI_KEY || AI_PROXY_BASE || import.meta.env.PROD);

// Ошибка с «человечным» кодом: badKey / credits / rateLimit / modelLoading / network / http.
export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Прогоняет SSE-поток Gemini, вызывает onToken(text) по мере прихода дельт.
// Возвращает полное собрание текста. signal — для отмены.
async function streamChatCompletion({ headers, body, signal, onToken }) {
  const res = await fetch(GEMINI_URL, { method: "POST", signal, headers, body: JSON.stringify(body) });

  if (!res.ok) {
    let code = "http";
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      const e = (data && data.error) || data;
      message = e.message || e.status || message;
      if (typeof e.message === "string" && /API key not valid/i.test(e.message)) code = "badKey";
    } catch {
      /* тело не JSON */
    }
    if (res.status === 401 || res.status === 403) code = "badKey";
    else if (res.status === 402) code = "credits";
    else if (res.status === 429) code = "rateLimit";
    else if (res.status === 503) code = "modelLoading";
    throw new AiError(code, message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
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
      if (json.error) {
        const e = json.error;
        throw new AiError(e.status === "RESOURCE_EXHAUSTED" ? "rateLimit" : "http", e.message || "Stream error");
      }
      const cand = json.candidates && json.candidates[0];
      if (cand && cand.finishReason === "SAFETY") throw new AiError("http", "Answer blocked by safety filter");
      const parts = cand && cand.content && cand.content.parts;
      if (parts) {
        for (const p of parts) {
          if (typeof p.text === "string" && p.text) {
            full += p.text;
            onToken(p.text);
          }
        }
      }
    }
  }
  return full;
}

// История {role: "user"|"assistant", content} → Gemini contents [{role: "user"|"model", parts}].
function toGeminiContents(hist, question) {
  return [
    ...hist.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: question }] },
  ];
}

function geminiBody(techName, hist, question) {
  return {
    systemInstruction: { parts: [{ text: buildSystemPrompt(techName) }] },
    contents: toGeminiContents(hist, question),
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  };
}

/**
 * Отправить вопрос ассистенту.
 * history — массив {role, content} предыдущих сообщений (без сис-промпта).
 * @returns {Promise<string>} полный ответ; onToken получает накапливаемый текст
 */
export async function askAssistant({ techName, history, question, onToken, signal }) {
  if (!isAiConfigured()) throw new AiError("noKey", "VITE_GEMINI_API_KEY is not set (dev) or GEMINI_API_KEY in Vercel env (prod)");
  const hist = Array.isArray(history) ? history.slice(-10) : [];

  let acc = "";
  const token = (txt) => {
    acc += txt;
    onToken(acc);
  };
  // Прямой запрос к Google — только если есть локальный ключ И не задан внешний прокси.
  // DEV часто гео-блокирован Google'ом → VITE_AI_PROXY_URL переключает на prod-Vercel-прокси
  // (браузер ходит на Vercel, тот — к Google со своего, поддержанного IP).
  const useDirect = Boolean(GEMINI_KEY) && !AI_PROXY_BASE;
  try {
    if (useDirect) {
      await streamChatCompletion({
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: geminiBody(techName, hist, question),
        signal,
        onToken: token,
      });
    } else {
      await proxyStream({ url: proxyTarget(), signal, onToken: token, body: { techName, history: hist, question } });
    }
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    if (e instanceof AiError) throw e;
    throw new AiError("network", e && e.message ? e.message : "Network error");
  }
  return acc;
}

// PROD: POST /api/ai (Vercel-прокси уже держит ключ) — SSE passthrough того же формата Gemini.
// url — /api/ai (same-origin в prod) либо внешний прокси (dev → prod-Vercel, CORS на прокси).
async function proxyStream({ body, signal, onToken, url = "/api/ai" }) {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let code = "http";
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = (data && data.error) || message;
    } catch {
      /* тело не JSON */
    }
    if (res.status === 401 || res.status === 403) code = "badKey";
    else if (res.status === 429) code = "rateLimit";
    throw new AiError(code, message);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
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
        continue;
      }
      const cand = json.candidates && json.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      if (parts) {
        for (const p of parts) {
          if (typeof p.text === "string" && p.text) {
            full += p.text;
            onToken(p.text);
          }
        }
      }
    }
  }
  return full;
}
