// AI Assistant — модель google/gemma-3-12b-it (HuggingFace Inference).
//
// ДВА режима (чтобы HF-токен НЕ плыл в публичный репо/бандл — GitHub secret-scanning
// ревайдит такие токены и блокирует пуши):
//   • DEV:  есть VITE_HF_API_KEY (.env.local, в git не попадает) → прямой запрос к HF;
//   • PROD: ключа нет → POST /api/ai (Vercel serverless-прокси, токен в Vercel env
//           HF_API_KEY — только на сервере). SSE-поток в обоих режимах одинаковый.
//
// Эндпоинт — OpenAI-совместимый чат-роутер (router.huggingface.co), stream: true → SSE.
import { buildSystemPrompt } from "./ai-prompt";

export const AI_MODEL = "google/gemma-3-12b-it";
export const AI_MODEL_SHORT = AI_MODEL.split("/").pop();
const DEV_KEY = import.meta.env.VITE_HF_API_KEY || "";

// Dev: настроен, если есть локальный ключ. Prod: всегда (прокси есть, если Vercel env выставлен).
export const isAiConfigured = () => DEV_KEY || import.meta.env.PROD;

// Ошибка с «человечным» кодом: badKey / rateLimit / modelLoading / network / http.
export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Прогоняет SSE-поток, вызывает onToken(text) по мере прихода дельт.
// Возвращает полное собрание текста. signal — для отмены.
async function streamChatCompletion({ url, headers, body, signal, onToken }) {
  const res = await fetch(url, { method: "POST", signal, headers, body: JSON.stringify(body) });

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
 * Отправить вопрос ассистенту.
 * history — массив {role, content} предыдущих сообщений (без сис-промпта).
 * @returns {Promise<string>} полный ответ; onToken получает накапливаемый текст
 */
export async function askAssistant({ techName, history, question, onToken, signal }) {
  if (!isAiConfigured()) throw new AiError("noKey", "VITE_HF_API_KEY is not set (dev) or HF_API_KEY in Vercel env (prod)");
  const hist = Array.isArray(history) ? history.slice(-10) : [];

  // DEV: прямой HF (ключ из .env.local). PROD: /api/ai — прокси сам собирает messages.
  const request = DEV_KEY
    ? {
        url: "https://router.huggingface.co/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEV_KEY}`,
          "X-Wait-For-Model": "true", // холодный старт: очередь вместо 503
        },
        body: {
          model: AI_MODEL,
          messages: [{ role: "system", content: buildSystemPrompt(techName) }, ...hist, { role: "user", content: question }],
          stream: true,
          temperature: 0.4,
          max_tokens: 900,
        },
      }
    : {
        url: "/api/ai",
        headers: { "Content-Type": "application/json" },
        body: { techName, history: hist, question },
      };

  let acc = "";
  const token = (txt) => {
    acc += txt;
    onToken(acc);
  };
  try {
    await streamChatCompletion({ ...request, signal, onToken: token });
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    if (e instanceof AiError) throw e;
    throw new AiError("network", e && e.message ? e.message : "Network error");
  }
  return acc;
}
