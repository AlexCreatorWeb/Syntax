import { useEffect, useState } from "react";
import { useT } from "../../i18n/useT";

// Метаданные постов (статичные данные; контент постов — в i18n)
const POST_META = [
  { live: true, time: "2m", votes: 142, comments: 24, views: "1.2k", hue: 158, initial: "P" },
  { author: "@null_pointer", time: "1h", votes: 89, solved: true, comments: 12, hue: 210, initial: "N" },
  { author: "@sys_admin", time: "3h", votes: 45, comments: 8, hue: 260, initial: "S" },
];

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

function CommunityView() {
  const t = useT();
  const [tab, setTab] = useState("active");
  const [filter, setFilter] = useState("");
  const [loadMoreDone, setLoadMoreDone] = useState(false);
  const [votes, setVotes] = useState(POST_META.map((m) => m.votes));
  const [voted, setVoted] = useState(POST_META.map(() => false));
  const posts = t("community.posts") || [];

  // Клик по трендовому тегу в правом сайдбаре ставит тег в фильтр
  useEffect(() => {
    const onTag = (e) => setFilter(`#${e.detail}`);
    window.addEventListener("syntax-community-tag", onTag);
    return () => window.removeEventListener("syntax-community-tag", onTag);
  }, []);

  const feedTabs = [
    { id: "active", label: t("community.tabActive") },
    { id: "newest", label: t("community.tabNewest") },
    { id: "unanswered", label: t("community.tabUnanswered") },
  ];

  const handleVote = (i) => {
    setVoted((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
    setVotes((prev) => {
      const next = [...prev];
      next[i] = next[i] + (voted[i] ? -1 : 1);
      return next;
    });
  };

  const visiblePosts = (() => {
    const q = filter.trim().toLowerCase();
    const list = posts.map((p, i) => ({ p, i }));
    if (!q) return list;
    return list.filter(({ p }) =>
      (p.title + " " + (p.tags || []).join(" ")).toLowerCase().includes(q)
    );
  })();

  return (
    <div className="community">
      {/* Основная колонка: фид */}
      <div className="community__main">
        {/* Заголовок + действия */}
        <div className="community__head">
          <div>
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
            <button type="button" className="btn btn--primary community__new">
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
              {t("community.newDiscussion")}
            </button>
          </div>
        </div>

        {/* Табы фидов */}
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
            </button>
          ))}
        </div>

        {/* Лента обсуждений */}
        <div className="community__feed">
          {visiblePosts.map(({ p: post, i }) => {
            const meta = POST_META[i];
            return (
              <article key={i} className="post card">
                <button
                  type="button"
                  className={`post__vote ${voted[i] ? "post__vote--voted" : ""}`}
                  onClick={() => handleVote(i)}
                  aria-pressed={voted[i]}
                  aria-label={String(votes[i])}
                >
                  <UpArrowIcon />
                  <span className="post__votes">{votes[i]}</span>
                </button>
                <div className="post__body">
                  <div className="post__meta">
                    {meta.live ? (
                      <>
                        <span className="post__live">
                          <span className="post__live-dot" aria-hidden="true" />
                          {t("community.live")}
                        </span>
                        <span className="post__time">{t("community.activeAgo", { time: meta.time })}</span>
                      </>
                    ) : (
                      <span className="post__time">
                        {t("community.postedBy", { author: meta.author, time: meta.time })}
                      </span>
                    )}
                  </div>
                  <h3 className="post__title">{post.title}</h3>
                  <p className="post__excerpt">{post.excerpt}</p>
                  <div className="post__foot">
                    <div className="post__tags">
                      {(post.tags || []).map((tag) => (
                        <span key={tag} className="post__tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="post__stats">
                      {meta.solved && (
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
                        {meta.comments}
                      </span>
                      {meta.views && (
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
                          {meta.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {visiblePosts.length === 0 && (
            <div className="tasks-empty">{t("tasks.noResults")}</div>
          )}
        </div>

        <button
          type="button"
          className="community__loadmore"
          disabled={loadMoreDone}
          onClick={() => setLoadMoreDone(true)}
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
            <path d="M21 12a9 9 0 1 1-2.6-6.3" />
            <path d="M21 3v6h-6" />
          </svg>
          {loadMoreDone ? t("community.noMore") : t("community.loadMore")}
        </button>
      </div>

    </div>
  );
}

export default CommunityView;
