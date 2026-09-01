import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n/useT";
import { isAiConfigured, askAssistant, AI_MODEL, AI_MODEL_SHORT } from "../lib/ai";
import { MdContent } from "../lib/markdown-view";

// Модель иногда пишет открывающий fence в одной строке с кодом («```js function x(){»)
// — наш парсер требует ```lang в отдельной строке. А ещё ответ может оборваться на
// max_tokens с НЕЗАКРЫТЫМ блоком — тогда ``` остаётся на тексте; доклеиваем.
const fixMd = (s) => {
  let out = s.replace(/^```([\w-]*)[ \t]+(\S)/gm, "```$1\n$2");
  if (((out.match(/```/g) || []).length) % 2 === 1) out += "\n```";
  return out;
};

// Живой AI-чат (HuggingFace gemma-2-9b-it). techId задаёт контекст в сис-промпте.
// Ответы модели — markdown-lite → рендерим MdContent (код-блоки с Copy, callout'ы).
function AiChat({ techId }) {
  const t = useT();
  const [messages, setMessages] = useState([]); // [{id, role: "user"|"ai", content}]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null); // AiError code
  const [draft, setDraft] = useState("");
  const boxRef = useRef(null);
  const abortRef = useRef(null);
  // «Прилипание» к низу: автоскролл только если пользователь рядом с дном чата.
  // Иначе при стриминге каждый токен дергает его вниз, и «скролл не работает».
  const stickRef = useRef(true);
  const onChatScroll = () => {
    const el = boxRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  const configured = isAiConfigured();

  const errKey =
    error === "badKey" ? "ai.errBadKey" :
    error === "rateLimit" ? "ai.errRateLimit" :
    error === "modelLoading" ? "ai.errModel" :
    "ai.errGeneric";

  // Авто-скролл вниз на новые сообщения и при стриминге — ТОЛЬКО если пользователь не ушёл читать вверх
  const lastContent = messages.length ? messages[messages.length - 1].content : "";
  useEffect(() => {
    const el = boxRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, lastContent]);

  // Отмена полёта запроса при unmount (ушли со страницы технологии)
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const send = async () => {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft("");
    setError(null);
    setBusy(true);
    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));
    const userMsg = { id: `u${Date.now()}`, role: "user", content: question };
    const aiMsg = { id: `a${Date.now()}`, role: "ai", content: "" };
    stickRef.current = true; // свой вопрос — всегда показываем низ чата
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await askAssistant({
        techName: techId,
        history,
        question,
        signal: ctrl.signal,
        onToken: (acc) =>
          setMessages((prev) => {
            const next = prev.slice();
            const i = next.length - 1;
            next[i] = { ...next[i], content: acc };
            return next;
          }),
      });
    } catch (e) {
      if (e && e.name === "AbortError") return;
      setError(e && e.code ? e.code : "generic");
      // пустой ответ (ошибка до первого токена) — убираем пустую «пузырь-заглушку»
      setMessages((prev) => {
        const next = prev.slice();
        const i = next.length - 1;
        if (next[i].role === "ai" && !next[i].content) next.pop();
        return next;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const clear = () => {
    if (busy && abortRef.current) abortRef.current.abort();
    stickRef.current = true;
    setMessages([]);
    setError(null);
  };

  const typing = busy && messages.length > 0 && !messages[messages.length - 1].content;

  return (
    <section className="card rail-card tech-aside__ai">
      <div className="tech-aside__ai-head">
        <div className="tech-aside__ai-title-row">
          <h2 className="rail-card__title tech-aside__ai-title">
            <span className="dot-pulse" aria-hidden="true"></span>
            {t("techPage.aiTitle")}
          </h2>
        </div>
        {/* Имя модели — под заголовком */}
        <span className="tech-aside__model-chip" title={AI_MODEL}>{AI_MODEL_SHORT}</span>
      </div>

      {/* Кнопка очистки — вверху чата (не при заголовке), всегда на месте, не скроллится */}
      {messages.length > 0 && (
        <div className="tech-aside__chat-toolbar">
          <button type="button" className="icon-btn tech-aside__clear" title={t("ai.clear")} aria-label={t("ai.clear")} onClick={clear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />
            </svg>
          </button>
        </div>
      )}

      <div className="tech-aside__chat" ref={boxRef} onScroll={onChatScroll}>
        {/* Приветственная строка — вверху чата */}
        <p className="tech-aside__chat-greet">{t("techPage.aiGreet")}</p>
        {messages.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="tech-aside__bubble tech-aside__bubble--user">{m.content}</p>
          ) : m.content ? (
            <div key={m.id} className="tech-aside__bubble tech-aside__bubble--ai tech-aside__bubble--md">
              <MdContent src={fixMd(m.content)} t={t} />
            </div>
          ) : null
        )}
        {typing && (
          <div className="tech-aside__bubble tech-aside__bubble--ai tech-aside__typing" aria-live="polite">
            <span className="tech-aside__typing-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            {t("ai.thinking")}
          </div>
        )}
        {error && !busy && (
          <p className="tech-aside__bubble tech-aside__bubble--err" role="alert">{t(errKey)}</p>
        )}
      </div>

      <div className="tech-aside__input">
        <input
          className="field tech-aside__field"
          type="text"
          placeholder={configured ? t("techPage.aiInput") : t("ai.noKey")}
          aria-label={t("techPage.aiInput")}
          value={draft}
          disabled={!configured || busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button
          type="button"
          className={`icon-btn tech-aside__send${busy ? " tech-aside__send--busy" : ""}`}
          title={t("ai.send")}
          aria-label={t("ai.send")}
          disabled={!configured || busy || !draft.trim()}
          onClick={send}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12 20 4l-4 16-4-6-7-2Z" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default AiChat;
