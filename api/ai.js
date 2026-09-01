// Vercel serverless — прокси к HuggingFace Inference (router.huggingface.co).
// Зачем: HF-токен НЕ обязан лежать в публичном репо/бандле (GitHub secret-scanning
// ревайдит токены, уплывшие в публичный код). Токен — в Vercel env: HF_API_KEY
// (Production, БЕЗ префикса VITE_ — читается только здесь, на сервере).
//
// Клиент шлёт: { techName, history, question } (POST /api/ai).
// Ответ — SSE-поток HuggingFace КАК ЕСТЬ (passthrough) — парсер на клиенте
// (src/lib/ai.js) одинаковый для прямого и проксированного режима.
import { buildSystemPrompt } from "../src/lib/ai-prompt";

export const maxDuration = 60; // стриминг ответа

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "google/gemma-3-12b-it";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.HF_API_KEY;
  if (!key) {
    res.status(500).json({ error: "HF_API_KEY is not set in Vercel env (Project → Settings → Environment Variables)" });
    return;
  }
  const { techName, history, question } = req.body || {};
  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Wait-For-Model": "true", // холодный старт: очередь вместо 503
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(techName) },
          ...(Array.isArray(history) ? history.slice(-10) : []),
          { role: "user", content: question },
        ],
        stream: true,
        temperature: 0.4,
        max_tokens: 900,
      }),
    });
  } catch (e) {
    res.status(502).json({ error: `HF unreachable: ${e.message}` });
    return;
  }

  // Маппим статусы HF на то, что клиент умеет перевести в человекочитаемую ошибку
  if (!upstream.ok && !upstream.body) {
    let message = `HTTP ${upstream.status}`;
    try {
      const data = await upstream.json();
      message = (data && (data.message || data.error)) || message;
    } catch {
      /* не JSON */
    }
    res.status(upstream.status).json({ error: message });
    return;
  }

  // Passthrough SSE: заголовки стриминга + сырые чанки
  res.status(upstream.status || 200);
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    /* клиент отменил запрос — просто закрываем */
  } finally {
    res.end();
  }
}
