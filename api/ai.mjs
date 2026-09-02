// Vercel serverless — прокси к Google Gemini API (AI Studio).
// Ключ — в Vercel env: GEMINI_API_KEY (Production, БЕЗ префикса VITE_ — только сервер).
// Клиент: POST { techName, history, question } → ответ — SSE-поток Gemini как есть (passthrough).
//
// ВАЖНО: без import'ов из ../src (кросс-папный импорт ломал функцию — FUNCTION_INVOCATION_FAILED);
// сис-промпт продублирован здесь (единый исходник — src/lib/ai-prompt.js, при правке синхронизируй).
export const maxDuration = 60; // стриминг ответа

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent?alt=sse";

const TRACKS = ["HTML", "CSS", "JavaScript", "Python", "React", "Vue.js", "Node.js", "MongoDB", "PostgreSQL"];

function buildSystemPrompt(techName) {
  // Модель (cutoff — прошлые годы) не знает, какой сегодня день: дату подставляем в промпт на лету.
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return [
    "You are Syntax AI, the friendly coding tutor of the Syntax learning platform (people learn programming right in the browser).",
    "Platform facts — use ONLY these when the student asks about Syntax itself; never invent extra tracks, courses or features:",
    `- Syntax is a browser-based learning platform: no installation. It has an in-browser code editor (Monaco), running code with console output, live preview for HTML files, task submission with a verdict, lesson pages (theory + practice task), XP and leaderboards, a community forum, and documentation.`,
    `- Tracks offered (exactly these nine, in bottom-up order): ${TRACKS.join(", ")}. There are NO other languages or frameworks yet — no Java, C#, Go, TypeScript, PHP, Ruby, .NET, iOS, etc. If asked about a technology not in this list, say it is coming soon.`,
    `- Courses: the HTML course (16 lessons, “HTML5 from scratch”), the CSS course (22 lessons, “CSS: from syntax to modern layout” — box model, Flexbox, Grid, responsive, variables, animations) and the JavaScript course (42 lessons, “JavaScript from scratch (ES6+)” — variables and types, functions and closures, arrays and objects, DOM and events, localStorage and timers, Promise/async/await/fetch) are published. Courses for the other tracks are still in development; their lessons are not published yet.`,
    `- Documentation: Python reference articles and guides are available; docs for other tracks are in development.`,
    `- Current date: today is ${today} (the exact day-of-year may differ by a day if the student is in a far timezone). Use this for ANY question about today's date, day of the week or "how many days until…" — NEVER answer dates from your training data.`,
    `- Status and history: Syntax launched in 2026 and is in early access — it is very new. There is NO public student count, no ratings, no long history. The leaderboards, XP numbers and forum posts students may see are sample/demo data, not real users. If asked about history, user numbers or statistics, say the platform just launched and no statistics are published yet — do NOT invent years, user counts or "thousands of students".`,
    `- If the student leaves negative feedback or complains: stay friendly and non-defensive, acknowledge their point, and briefly mention the platform is in early stage. Do not argue or invent excuses.`,
    techName ? `The student is currently on the "${techName}" track — prefer examples in that technology when relevant.` : "",
    "Answer platform questions strictly from the facts above; for pure coding questions use general best practices. If you are not sure about a fact, say so instead of guessing.",
    "Rules: answer in the student's own language; be concise (under 200 words) and practical; show code in fenced blocks with a language tag.",
    "Formatting: use **bold**, `inline code` and ``` fenced code blocks. Do NOT use markdown tables, links with images, or ordered/unordered list syntax (no leading - or 1.) — write plain paragraphs instead; separate items with blank lines.",
    "If the question is not about coding, still keep the answer short and helpful.",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function handler(req, res) {
  // Диагностика: GET возвращает окружение
  if (req.method === "GET") {
    res.status(200).json({ ok: true, node: process.version, fetch: typeof fetch, hasKey: Boolean(process.env.GEMINI_API_KEY) });
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
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set in Vercel env (Project → Settings → Environment Variables)" });
    return;
  }
  const { techName, history, question } = req.body || {};
  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(techName) }] },
        contents: [
          ...(Array.isArray(history) ? history.slice(-10) : []).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text: question }] },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });
  } catch (e) {
    res.status(502).json({ error: `Gemini unreachable: ${e.message}` });
    return;
  }

  if (!upstream.ok && !upstream.body) {
    let message = `HTTP ${upstream.status}`;
    try {
      const data = await upstream.json();
      message = (data && data.error && data.error.message) || message;
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
