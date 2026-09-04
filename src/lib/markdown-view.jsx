import { useState } from "react";
import { parseMdBlocks, inlineMdTokens } from "./markdown";

function CodeBlock({ lang, code, t }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* клипборд недоступен (headless) — некритично */
    }
  };
  return (
    <div className="code-block md-code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{lang || "code"}</span>
        <button type="button" className="code-block__copy" onClick={copy}>
          {copied ? t("docs.copied") : t("docs.copy")}
        </button>
      </div>
      <pre className="code-block__pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Инлайн-маркап для одиночных строк (описание задачи в карточке/редакторе):
// `код` → чип, **жирный**, *курсив*, [ссылка](url)
export function InlineMd({ text }) {
  const toks = inlineMdTokens(String(text ?? ""));
  return (
    <>
      {toks.map((tok, j) => {
        if (tok.t === "code")
          return (
            <code key={j} className="md-inline">
              {tok.v}
            </code>
          );
        if (tok.t === "b") return <strong key={j}>{tok.v}</strong>;
        if (tok.t === "i") return <em key={j}>{tok.v}</em>;
        if (tok.t === "a")
          return (
            <a
              key={j}
              className="md-link"
              href={tok.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tok.v}
            </a>
          );
        return <span key={j}>{tok.v}</span>;
      })}
    </>
  );
}

function Callout({ kind, text }) {
  const labels = { tip: "Tip", note: "Note", warning: "Warning" };
  return (
    <div className={`callout callout--${kind}`}>
      <span className="callout__label">{labels[kind]}</span>
      <p className="callout__text">{text}</p>
    </div>
  );
}

export function MdContent({ src, t, limit, blocks }) {
  // blocks: готовые блоки parseMdBlocks (например, уже переведённые) — src не нужен
  const base = blocks || parseMdBlocks(src);
  let blocksOut = base.map((b) =>
    b.type === "p" && !b.tokens ? { ...b, tokens: inlineMdTokens(b.text) } : b,
  );
  // limit: показать блоки пока суммарный объём ≤ N знаков (свёрнутый вид статьи)
  if (limit != null) {
    const visible = [];
    let len = 0;
    for (const b of blocksOut) {
      visible.push(b);
      len += (b.text || b.code || b.src || "").length;
      if (len >= limit) break;
    }
    blocksOut = visible;
  }
  if (!blocksOut.length) return <p className="md-p">—</p>;
  return (
    <div className="md md-content">
      {blocksOut.map((b, i) => {
        if (b.type === "h2")
          return (
            <h2 key={i} className="md-h2">
              {b.text}
            </h2>
          );
        if (b.type === "h3")
          return (
            <h3 key={i} className="md-h3">
              {b.text}
            </h3>
          );
        if (b.type === "image")
          return (
            <img
              key={i}
              className="md-img"
              src={b.src}
              alt={b.alt}
              loading="lazy"
            />
          );
        if (b.type === "code")
          return <CodeBlock key={i} lang={b.lang} code={b.code} t={t} />;
        if (b.type === "callout")
          return <Callout key={i} kind={b.kind} text={b.text} />;
        return (
          <p key={i} className="md-p">
            {b.tokens.map((tok, j) => {
              if (tok.t === "code")
                return (
                  <code key={j} className="md-inline">
                    {tok.v}
                  </code>
                );
              if (tok.t === "b") return <strong key={j}>{tok.v}</strong>;
              if (tok.t === "i") return <em key={j}>{tok.v}</em>;
              if (tok.t === "a")
                return (
                  <a
                    key={j}
                    className="md-link"
                    href={tok.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tok.v}
                  </a>
                );
              return tok.v;
            })}
          </p>
        );
      })}
    </div>
  );
}
