// Vercel serverless — прокси к HuggingFace Inference (router.huggingface.co).
// Токен — в Vercel env: HF_API_KEY (Production, БЕЗ префикса VITE_ — только сервер).
// Клиент: POST { techName, history, question } → ответ — SSE-поток HF как есть (passthrough).
//
// ВАЖНО: без import'ов из ../src (кросс-папный импорт ломал функцию — FUNCTION_INVOCATION_FAILED);
// сис-промпт продублирован здесь (единый исходник — src/lib/ai-prompt.js, при правке синхронизируй).
export const maxDuration = 60; // стриминг ответа

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "google/gemma-3-12b-it";

function buildSystemPrompt(techName) {
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

export default async function handler(req, res) {
  // Диагностика: GET возвращает окружение (пока функция падает)
  if (req.method === "GET") {
    res.status(200).json({ ok: true, node: process.version, fetch: typeof fetch, hasKey: Boolean(process.env.HF_API_KEY) });
    return;
  }
  try {
    await handle(req, res);
  } catch (e) {
    try {
      res.status(500).json({ error: String((e && e.stack) || e) });
    } catch {
      res.status(500).end();
    }
  }
}

async function handle(req, res) {
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

  // Passthrough SSE
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
    /* клиент отменил запрос */
  } finally {
    res.end();
  }
}
