import { useEffect, useMemo, useState } from "react";
import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";
import { getTech } from "../../lib/techs";
import { useAvatar } from "../../lib/avatar";
import {
  loadCommunityStore,
  saveCommunityStore,
  fmtNum,
} from "../../lib/communityStore";

// Метаданные постов (статичные данные; контент постов и ответов — в i18n community.posts).
// rep/views — ЧИСЛА (формат ≥1000 → «14.2k» — единое правило, баг №6).
// `ago` — время для «{ago} назад»; null = «только что» (локальные посты).
const POST_META = [
  {
    tech: "python",
    ago: "2m",
    activeMin: 2,
    createdMin: 300,
    votes: 142,
    views: 1200,
    author: { name: "ana_data", rep: 8420, hue: 30 },
  },
  {
    tech: "react",
    ago: "1h",
    activeMin: 58,
    createdMin: 60,
    votes: 89,
    views: 986,
    solved: true,
    isMine: true,
    newReplies: 3,
    author: { name: "NeoCoder", rep: 1240, hue: 160 },
  },
  {
    tech: "node",
    ago: "3h",
    activeMin: 170,
    createdMin: 180,
    votes: 45,
    views: 540,
    author: { name: "sys_admin", rep: 12760, hue: 260 },
  },
  // — новые сид-посты (UX-аудит: фид «пустой» — 3 поста на 9 треков) —
  {
    tech: "css",
    ago: "4h",
    activeMin: 250,
    createdMin: 240,
    votes: 9,
    views: 118,
    solved: true,
    author: { name: "maria_sofia", rep: 3210, hue: 330 },
  },
  {
    tech: "javascript",
    ago: "5h",
    activeMin: 300,
    createdMin: 300,
    votes: 17,
    views: 286,
    author: { name: "neo_oleg", rep: 2940, hue: 30 },
  },
  {
    tech: "html",
    ago: "6h",
    activeMin: 360,
    createdMin: 360,
    votes: 6,
    views: 94,
    author: { name: "data_vlad", rep: 3120, hue: 260 },
  },
  {
    tech: "node",
    ago: "7h",
    activeMin: 420,
    createdMin: 420,
    votes: 21,
    views: 402,
    solved: true,
    author: { name: "dev_priya", rep: 5120, hue: 280 },
  },
  {
    tech: "mongo",
    ago: "9h",
    activeMin: 540,
    createdMin: 540,
    votes: 11,
    views: 176,
    author: { name: "data_vlad", rep: 3120, hue: 260 },
  },
  {
    tech: "postgres",
    ago: "11h",
    activeMin: 660,
    createdMin: 660,
    votes: 15,
    views: 229,
    solved: true,
    author: { name: "sys_admin", rep: 12760, hue: 200 },
  },
  {
    tech: "python",
    ago: "13h",
    activeMin: 780,
    createdMin: 780,
    votes: 8,
    views: 141,
    author: { name: "ana_data", rep: 8420, hue: 40 },
  },
  {
    tech: "react",
    ago: "16h",
    activeMin: 960,
    createdMin: 960,
    votes: 5,
    views: 73,
    author: { name: "alex_mercer", rep: 14200, hue: 158 },
  },
];

const YOU = { name: "NeoCoder", rep: 1240, hue: 160 };

// «{ago} назад» / «только что» — единый формат мета-строки (баг №5: автор —
// один раз в строке, дубль «Posted by X» убран)
function timeLabel(t, meta) {
  return meta.ago
    ? t("community.ago", { time: meta.ago })
    : t("community.justNow");
}

function hueOf(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function UpArrowIcon() {
  return (
    <svg
      className="vote-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 14 6-6 6 6" />
    </svg>
  );
}

/* ————— Markdown-lite: `code`, **bold**, *italic*, ``` блоки ————— */
function inlineMd(s) {
  const out = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1])
      out.push(
        <code key={k++} className="md-inline">
          {m[1].slice(1, -1)}
        </code>,
      );
    else if (m[2]) out.push(<strong key={k++}>{m[2].slice(2, -2)}</strong>);
    else out.push(<em key={k++}>{m[3].slice(1, -1)}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function MdText({ src }) {
  const parts = String(src || "").split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i])
      nodes.push(
        <p key={i} className="md-p">
          {inlineMd(parts[i])}
        </p>,
      );
    if (parts[i + 1] !== undefined) {
      nodes.push(
        <pre key={`c${i}`} className="md-code">
          <code>{parts[i + 2]}</code>
        </pre>,
      );
    }
  }
  if (!nodes.length)
    nodes.push(
      <p key="e" className="md-p">
        —
      </p>,
    );
  return <div className="md">{nodes}</div>;
}

/* ————— Ответ (рекурсивный, уровень 2 — вложенные). canAccept — у автора
   треда (мёртв. №8: принять ответ → зелёная рамка + Solved в ленте) ————— */
function ReplyItem({ reply, depth, t, onReplyTo, onOpenProfile, acceptInfo }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const author = {
    name: reply.author,
    rep: reply.rep,
    hue: reply.hue ?? hueOf(reply.author),
  };
  const isAccepted = !!(acceptInfo && acceptInfo.accepted);
  return (
    <div
      className={`reply ${depth > 1 ? "reply--nested" : ""} ${isAccepted ? "reply--accepted" : ""} ${reply.mine ? "reply--mine" : ""}`}
    >
      <div className="reply__head">
        <Avatar name={author.name} hue={author.hue} size="xs" />
        <button
          type="button"
          className="reply__author"
          onClick={() => onOpenProfile(author.name)}
          title={author.name}
        >
          {author.name}
        </button>
        {reply.rep && <span className="reply__rep">{fmtNum(reply.rep)}</span>}
        <span className="reply__time">{reply.time}</span>
        {isAccepted && (
          <span className="reply__accepted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
            {t("community.accepted")}
          </span>
        )}
        {reply.mine && (
          <span className="reply__mine-badge">
            {t("community.yourQuestion")}
          </span>
        )}
        {depth === 1 && acceptInfo && acceptInfo.canAccept && !isAccepted && (
          <button
            type="button"
            className="reply__accept"
            title={t("community.acceptAnswer")}
            onClick={acceptInfo.onAccept}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
            {t("community.acceptAnswer")}
          </button>
        )}
      </div>
      <MdText src={reply.body} />
      {reply.code && (
        <pre className="md-code">
          <code>{reply.code}</code>
        </pre>
      )}
      {reply.lesson && (
        <button
          type="button"
          className="reply__lesson"
          title={t("community.relatedLesson", { lesson: reply.lesson })}
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
            <path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13" />
          </svg>
          {t("community.relatedLesson", { lesson: reply.lesson })}
        </button>
      )}
      {depth === 1 && (
        <div className="reply__actions">
          <button
            type="button"
            className="reply__to"
            onClick={() => setOpen((v) => !v)}
          >
            {t("community.replyTo")}
          </button>
        </div>
      )}
      {open && depth === 1 && (
        <div className="reply__inline">
          <textarea
            className="reply__input"
            rows={2}
            value={text}
            placeholder={t("community.replyPlaceholder")}
            onChange={(e) => setText(e.target.value)}
            aria-label={t("community.replyPlaceholder")}
          />
          <button
            type="button"
            className="btn btn--ghost reply__submit"
            disabled={!text.trim()}
            onClick={() => {
              onReplyTo(reply, text.trim());
              setText("");
              setOpen(false);
            }}
          >
            {t("community.postReply")}
          </button>
        </div>
      )}
      {(reply.replies || []).map((r, i) => (
        <ReplyItem
          key={i}
          reply={r}
          depth={depth + 1}
          t={t}
          onReplyTo={onReplyTo}
          onOpenProfile={onOpenProfile}
        />
      ))}
    </div>
  );
}

/* ————— Модалка ветки обсуждения ————— */
function ThreadModal({
  item,
  t,
  onClose,
  onReply,
  onOpenProfile,
  onAccept,
  acceptedIdx,
}) {
  const [text, setText] = useState("");
  const { post, meta } = item;
  const replies = [...(post.replies || []), ...item.extra];
  const author = meta.author;
  const solved =
    !!meta.solved || (acceptedIdx !== undefined && acceptedIdx !== null);
  return (
    <div
      className="community-modal"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      onClick={onClose}
    >
      <div
        className="community-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="community-modal__head">
          <div className="community-modal__meta">
            <Avatar name={author.name} hue={author.hue} size="sm" />
            <div>
              <strong>{author.name}</strong>
              <span>
                {fmtNum(author.rep)} {t("community.rep")} · {timeLabel(t, meta)}
              </span>
            </div>
            {solved && (
              <span className="post__solved">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.5 2.5 2.5 5-5.5" />
                </svg>
                {t("community.solved")}
              </span>
            )}
          </div>
          <h2 className="community-modal__title">{post.title}</h2>
          <div className="community-modal__tags">
            {(post.tags || []).map((tag) => (
              <span key={tag} className="post__tag">
                #{tag}
              </span>
            ))}
          </div>
          <MdText src={post.excerpt} />
        </header>

        <div className="community-modal__body">
          <span className="label-caps community-modal__count">
            {t("community.threadReplies", { n: replies.length })}
          </span>
          {replies.length === 0 && (
            <div className="tasks-empty">{t("community.threadEmpty")}</div>
          )}
          {replies.map((r, i) => (
            <ReplyItem
              key={i}
              reply={r}
              depth={1}
              t={t}
              onReplyTo={(parent, txt) => onReply(item.key, txt, parent)}
              onOpenProfile={onOpenProfile}
              acceptInfo={
                meta.isMine
                  ? {
                      canAccept: true,
                      accepted: acceptedIdx === i,
                      onAccept: () => onAccept(item.key, i),
                    }
                  : null
              }
            />
          ))}
          <div className="thread-composer">
            <textarea
              className="reply__input thread-composer__input"
              rows={3}
              value={text}
              placeholder={t("community.replyPlaceholder")}
              onChange={(e) => setText(e.target.value)}
              aria-label={t("community.replyPlaceholder")}
            />
            <div className="thread-composer__foot">
              <span className="thread-composer__hint">
                {text.trim()
                  ? t("community.composerSub")
                  : t("community.replyRequired")}
              </span>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!text.trim()}
                onClick={() => {
                  onReply(item.key, text.trim(), null);
                  setText("");
                }}
              >
                {t("community.postReply")}
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="community-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ————— Composer: новое обсуждение ————— */
function ComposerModal({ t, tagPool, defaultLang, onClose, onPublish }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState([]);
  const [mode, setMode] = useState("write");
  const canPost = title.trim() && body.trim();
  const toggleTag = (tag) =>
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((x) => x !== tag)
        : prev.length < 4
          ? [...prev, tag]
          : prev,
    );
  const insertCode = () =>
    setBody(
      (b) => `${b}${b ? "\n" : ""}\`\`\`${defaultLang}\n// your code\n\`\`\`\n`,
    );
  return (
    <div
      className="community-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t("community.newDiscussion")}
      onClick={onClose}
    >
      <div
        className="community-modal__panel community-modal__panel--composer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="community-modal__head">
          <h2 className="community-modal__title">
            {t("community.newDiscussion")}
          </h2>
          <span className="thread-composer__hint">
            {t("community.composerSub")}
          </span>
        </header>
        <div className="community-modal__body composer">
          <input
            className="composer__title"
            type="text"
            value={title}
            maxLength={120}
            placeholder={t("community.composerTitlePh")}
            onChange={(e) => setTitle(e.target.value)}
            aria-label={t("community.composerTitlePh")}
          />
          <div className="composer__modes" role="tablist">
            {["write", "preview"].map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`composer__mode ${mode === m ? "composer__mode--active" : ""}`}
                onClick={() => setMode(m)}
                disabled={m === "preview" && !body}
              >
                {t(`community.composer${m[0].toUpperCase()}${m.slice(1)}`)}
              </button>
            ))}
            <button
              type="button"
              className="btn btn--ghost composer__code"
              onClick={insertCode}
              title={t("community.composerCodeBtn")}
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
                <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
              </svg>
              {t("community.composerCodeBtn")}
            </button>
          </div>
          {mode === "write" ? (
            <textarea
              className="composer__body"
              rows={7}
              value={body}
              placeholder={t("community.composerBodyPh")}
              onChange={(e) => setBody(e.target.value)}
              aria-label={t("community.composerBodyPh")}
            />
          ) : (
            <div className="composer__preview">
              <MdText src={body} />
            </div>
          )}
          <div className="composer__tags">
            <span className="label-caps composer__tags-label">
              {t("community.composerTags")}
            </span>
            <div className="composer__tag-pool">
              {tagPool.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`composer__tag ${tags.includes(tag) ? "composer__tag--on" : ""}`}
                  aria-pressed={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <div className="composer__foot">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t("editor.cancel")}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canPost}
              onClick={() => onPublish(title.trim(), body.trim(), tags)}
            >
              {t("community.composerPublish")}
            </button>
          </div>
        </div>
        <button
          type="button"
          className="community-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CommunityView({ activeTech, userName }) {
  const t = useT();
  // Ник «меня» — как в профиле (одинаково во всём; гостю — демо-имя).
  // Аватар тоже берём из профиля (useAvatar) — моё фото там, где мой ник.
  const [avatarUrl] = useAvatar();
  const meName = (userName || "").trim() || "NeoCoder";
  // «none» = трек не выбран — для community это «нет трека»
  const tech = activeTech && activeTech !== "none" ? activeTech : null;
  const [tab, setTab] = useState("active");
  const [filter, setFilter] = useState("");
  const [myTrack, setMyTrack] = useState(false);
  const [threadKey, setThreadKey] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  // Персист (баг №2): гостевые/юзерские посты, ответы, голоса, прочитанные
  // и принятые ответы живут в localStorage по идентификатору (guest/uid)
  const initial = useMemo(() => loadCommunityStore(), []);
  const [votes, setVotes] = useState(initial.votes);
  const [voted, setVoted] = useState(initial.voted);
  const [extraReplies, setExtraReplies] = useState(initial.replies);
  const [localPosts, setLocalPosts] = useState(initial.posts);
  const [viewed, setViewed] = useState(initial.viewed);
  const [accepted, setAccepted] = useState(initial.accepted);
  const [deleted, setDeleted] = useState(initial.deleted);
  // двухшаговое удаление: key поста → подтверждение (авто-сброс 4с)
  const [confirmDelete, setConfirmDelete] = useState(null);
  // «Load more»: фикс-лента 11–12 постов → порции по 8
  const [limit, setLimit] = useState(8);
  const rawPosts = t("community.posts");
  // т() возвращает объект словаря по языку — стабильная ссылка; useMemo гасит warning про deps
  const posts = useMemo(() => rawPosts || [], [rawPosts]);

  // авто-сброс «Confirm delete?» (паттерн Reset из редактора)
  useEffect(() => {
    if (!confirmDelete) return undefined;
    const id = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(id);
  }, [confirmDelete]);

  // Сохранение стора при любом изменении персистируемого состояния
  useEffect(() => {
    saveCommunityStore({
      posts: localPosts,
      replies: extraReplies,
      voted,
      votes,
      viewed,
      accepted,
      deleted,
    });
  }, [localPosts, extraReplies, voted, votes, viewed, accepted, deleted]);

  // Клик по трендовому тегу (рейл) или тегу поста — один и тот же фильтр (без дубля #);
  // карточка трека в рейле включает track-фильтр
  useEffect(() => {
    const onTag = (e) =>
      setFilter((f) => (f === `#${e.detail}` ? "" : `#${e.detail}`));
    const onTrack = () => setMyTrack(true);
    window.addEventListener("syntax-community-tag", onTag);
    window.addEventListener("syntax-community-track", onTrack);
    return () => {
      window.removeEventListener("syntax-community-tag", onTag);
      window.removeEventListener("syntax-community-track", onTrack);
    };
  }, []);

  // Esc закрывает модалки
  useEffect(() => {
    if (!threadKey && !composerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setThreadKey(null);
        setComposerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [threadKey, composerOpen]);

  // Итоговый список: i18n-посты + опубликованные локально (без удалённых)
  const items = useMemo(() => {
    const base = posts
      .map((post, i) => ({
        key: `p${i}`,
        post,
        // «Мой» сид-пост: автор = реальное имя из профиля (не NeoCoder)
        meta: POST_META[i].isMine
          ? { ...POST_META[i], author: { ...POST_META[i].author, name: meName } }
          : POST_META[i],
      }))
      .filter((it) => !deleted[it.key]);
    const local = localPosts
      .filter((p) => !deleted[`l${p.id}`])
      .map((p) => ({
        key: `l${p.id}`,
        post: p.post,
        meta: p.meta.isMine
          ? { ...p.meta, author: { ...p.meta.author, name: meName } }
          : p.meta,
      }));
    return [...base, ...local];
  }, [posts, localPosts, deleted, meName]);

  const repliesCount = (it) =>
    (it.post.replies || []).length + (extraReplies[it.key] || []).length;

  // Счётчики табов (учитывает track-фильтр, но не поиск)
  const trackList = tech
    ? items.filter((it) => !myTrack || it.meta.tech === tech)
    : items;
  const tabCounts = {
    active: trackList.length,
    newest: trackList.length,
    unanswered: trackList.filter((it) => repliesCount(it) === 0).length,
  };

  const visible = (() => {
    const q = filter.trim().replace(/^#/, "").toLowerCase();
    let list = trackList;
    if (q) {
      // Поиск по всему: заголовок, текст, теги + ответы (включая локальные)
      list = list.filter((it) =>
        (
          it.post.title +
          " " +
          it.post.excerpt +
          " " +
          (it.post.tags || []).join(" ") +
          " " +
          (it.post.replies || [])
            .map(
              (r) =>
                r.body +
                " " +
                r.author +
                " " +
                (r.replies || []).map((x) => x.body).join(" "),
            )
            .join(" ") +
          " " +
          (extraReplies[it.key] || []).map((r) => r.body).join(" ")
        )
          .toLowerCase()
          .includes(q),
      );
    }
    if (tab === "unanswered")
      list = list.filter((it) => repliesCount(it) === 0);
    return [...list].sort((a, b) =>
      tab === "newest"
        ? a.meta.createdMin - b.meta.createdMin
        : a.meta.activeMin - b.meta.activeMin,
    );
  })();

  const handleVote = (key, base) => {
    setVoted((prev) => ({ ...prev, [key]: !prev[key] }));
    setVotes((prev) => ({
      ...prev,
      [key]: (prev[key] ?? base) + (voted[key] ? -1 : 1),
    }));
  };

  // Открытие треда: помечаем прочитанным («N new replies» гаснет — мёртв. №7)
  const openThread = (key) => {
    setThreadKey(key);
    setViewed((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  // Принятие ответа (мёртв. №8): только у автора треда, один ответ на тред
  const acceptReply = (key, idx) => {
    setAccepted((prev) => ({ ...prev, [key]: idx }));
  };

  // Удаление своего вопроса: две ступени (кнопка → «Confirm?» → удалить).
  // Сид-пост — в deleted (персист), локальный — физически выкидывается
  const deleteQuestion = (key) => {
    if (key.startsWith("l")) {
      const id = Number(key.slice(1));
      setLocalPosts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeleted((prev) => ({ ...prev, [key]: true }));
    setConfirmDelete(null);
    if (threadKey === key) setThreadKey(null);
  };

  const addReply = (key, text, parent) => {
    const reply = {
      author: meName, // мой ответ — ник из профиля (не NeoCoder)
      rep: YOU.rep,
      hue: YOU.hue,
      time: t("community.justNow"),
      body: text,
      mine: true,
      replies: [],
    };
    // Демо: ответ добавляется в топ-лист ветки (parent используется для UI-контекста)
    void parent;
    setExtraReplies((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), reply],
    }));
  };

  const publish = (title, body, tags) => {
    const id = Date.now();
    setLocalPosts((prev) => [
      {
        id,
        post: { title, excerpt: body, tags, replies: [] },
        meta: {
          tech: tech || "javascript",
          ago: null,
          activeMin: 0,
          createdMin: 0,
          votes: 0,
          views: 0,
          isMine: true,
          author: { ...YOU, name: meName },
        },
      },
      ...prev,
    ]);
    // Баг №1: фильтр НЕ трогаем — новый пост виден при любом текущем фильтре
    // (теги поста — локальное состояние composer'а, глобальный фильтр не касается)
    setComposerOpen(false);
    setTab("active");
  };

  const tagPool = useMemo(() => {
    const s = new Set();
    posts.forEach((p) => (p.tags || []).forEach((x) => s.add(x)));
    return [...s];
  }, [posts]);

  const defaultLang =
    {
      javascript: "js",
      node: "js",
      python: "python",
      html: "html",
      css: "css",
      postgresql: "sql",
    }[tech] || "js";

  const feedTabs = [
    { id: "active", label: t("community.tabActive") },
    { id: "newest", label: t("community.tabNewest") },
    { id: "unanswered", label: t("community.tabUnanswered") },
  ];

  const threadItem = threadKey
    ? items.find((it) => it.key === threadKey)
    : null;

  return (
    <div className="community">
      <div className="community__main">
        {/* Заголовок + действия (на мобилке — 2 ряда) */}
        <div className="community__head">
          <div className="community__head-text">
            <h1 className="community__title">{t("community.title")}</h1>
            <p className="community__desc">{t("community.desc")}</p>
          </div>
          <div className="community__actions">
            <div className="community__filter">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("community.filter")}
                aria-label={t("community.filter")}
              />
            </div>
            <button
              type="button"
              className="btn btn--primary community__new"
              onClick={() => setComposerOpen(true)}
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="community__new-label">
                {t("community.newDiscussion")}
              </span>
            </button>
          </div>
        </div>

        {/* Табы фидов со счётчиками + track-фильтр */}
        <div className="community__toolbar">
          <div className="community__tabs" role="tablist">
            {feedTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`community__tab ${tab === item.id ? "community__tab--active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                <span className="community__tab-count">
                  {tabCounts[item.id]}
                </span>
              </button>
            ))}
          </div>
          {tech && (
            <button
              type="button"
              className={`community__track ${myTrack ? "community__track--on" : ""}`}
              aria-pressed={myTrack}
              onClick={() => setMyTrack((v) => !v)}
            >
              {t("community.myTrack", { tech: t(getTech(tech).label) })}
            </button>
          )}
        </div>

        {/* Счётчик видимых постов = количество карточек на экране (load more) */}
        <div className="community__showing">
          {t("community.showing", {
            a: Math.min(limit, visible.length),
            b: items.length,
          })}
        </div>

        {/* Лента обсуждений */}
        <div className="community__feed">
          {visible.slice(0, limit).map((it) => {
            const { post, meta } = it;
            const vote = votes[it.key] ?? meta.votes;
            const isVoted = !!voted[it.key];
            const isSolved = !!meta.solved || accepted[it.key] !== undefined;
            return (
              <article
                key={it.key}
                className={`post card ${isSolved ? "post--solved" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => openThread(it.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openThread(it.key);
                  }
                }}
              >
                <button
                  type="button"
                  className={`post__vote ${isVoted ? "post__vote--voted" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(it.key, meta.votes);
                  }}
                  aria-pressed={isVoted}
                  title={t("community.voteHint")}
                  aria-label={String(vote)}
                >
                  <UpArrowIcon />
                  <span className="post__votes">{fmtNum(vote)}</span>
                </button>
                <div className="post__body">
                  <div className="post__meta">
                  {meta.isMine && avatarUrl ? (
                    <span
                      className="avatar-dot avatar-dot--xs avatar-dot--img"
                      style={{ backgroundImage: `url(${avatarUrl})` }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Avatar
                      name={meta.author.name}
                      hue={meta.author.hue}
                      size="xs"
                    />
                  )}
                  <span className="post__author">
                    {meta.author.name}
                      <span className="post__rep">
                        {fmtNum(meta.author.rep)}
                      </span>
                    </span>
                    {/* Автор уже указан — время справа, без дубля «Posted by X» (баг №5);
                        LIVE-бейдж удалён (мёртв. №1 — статичный) */}
                    <span className="post__time">{timeLabel(t, meta)}</span>
                  </div>
                  <div className="post__badges">
                    {meta.isMine && (
                      <span className="post__mine">
                        {t("community.yourQuestion")}
                      </span>
                    )}
                    {meta.newReplies > 0 && !viewed[it.key] && (
                      <span className="post__new-replies">
                        <span className="post__new-dot" aria-hidden="true" />
                        {t("community.newReplies", { n: meta.newReplies })}
                      </span>
                    )}
                    {/* Удаление своего вопроса: две ступени (Confirm? 4с) */}
                    {meta.isMine && (
                      <button
                        type="button"
                        className={`post__delete ${confirmDelete === it.key ? "post__delete--confirm" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDelete === it.key) deleteQuestion(it.key);
                          else setConfirmDelete(it.key);
                        }}
                        aria-label={t("community.deleteQuestion")}
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
                          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                        </svg>
                        {confirmDelete === it.key
                          ? t("community.deleteConfirm")
                          : t("community.deleteQuestion")}
                      </button>
                    )}
                  </div>
                  <h3 className="post__title">{post.title}</h3>
                  <p className="post__excerpt">{post.excerpt}</p>
                  <div className="post__foot">
                    <div className="post__tags">
                      {(post.tags || []).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="post__tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("syntax-community-tag", {
                                detail: tag,
                              }),
                            );
                          }}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                    <div className="post__stats">
                      {isSolved && (
                        <span className="post__solved">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="m8.5 12.5 2.5 2.5 5-5.5" />
                          </svg>
                          {t("community.solved")}
                        </span>
                      )}
                      <span className="post__stat">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
                        </svg>
                        {repliesCount(it)}
                      </span>
                      {meta.views !== undefined && (
                        <span className="post__stat">
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
                          {fmtNum(meta.views)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Load more: порции по 8 (иначе лента фикс 11–12 постов) */}
          {visible.length > limit && (
            <button
              type="button"
              className="btn btn--ghost community__loadmore"
              onClick={() => setLimit((v) => v + 8)}
            >
              {t("community.loadMore")}
            </button>
          )}

          {visible.length === 0 && (
            <div className="tasks-empty community-empty">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3M8 11h6" />
              </svg>
              <strong>{t("community.nothingTitle")}</strong>
              <span>{t("community.nothingReason")}</span>
              <div className="community-empty__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setFilter("");
                    setMyTrack(false);
                  }}
                >
                  {t("community.resetFilters")}
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setComposerOpen(true)}
                >
                  {t("community.askFirst")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {threadItem && (
        <ThreadModal
          item={{ ...threadItem, extra: extraReplies[threadItem.key] || [] }}
          t={t}
          onClose={() => setThreadKey(null)}
          onReply={addReply}
          onOpenProfile={() => {}}
          onAccept={acceptReply}
          acceptedIdx={accepted[threadItem.key]}
        />
      )}
      {composerOpen && (
        <ComposerModal
          t={t}
          tagPool={tagPool}
          defaultLang={defaultLang}
          onClose={() => setComposerOpen(false)}
          onPublish={publish}
        />
      )}
    </div>
  );
}

export default CommunityView;
