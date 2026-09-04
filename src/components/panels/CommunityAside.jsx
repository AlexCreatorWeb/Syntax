import { useEffect, useState } from "react";
import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";
import { getTech } from "../../lib/techs";
import { loadFollows, saveFollows, fmtNum } from "../../lib/communityStore";

const TRENDING_TAGS = [
  "Python",
  "React18",
  "Docker",
  "NodeJS",
  "AsyncJS",
  "TypeScriptBasics",
];

// DataBot_v2 + BOT-бейдж удалены (мёртв. №2 — dev-артефакт)
const CONTRIBUTORS = [
  {
    name: "Alex Mercer",
    handle: "@amermer_dev",
    rep: 14200,
    hue: 158,
    posts: 342,
    streak: 21,
  },
  {
    name: "Sarah Chen",
    handle: "@schen_codes",
    rep: 12800,
    hue: 330,
    posts: 287,
    streak: 34,
  },
  {
    name: "Priya Dev",
    handle: "@priya_builds",
    rep: 5120,
    hue: 280,
    posts: 214,
    streak: 9,
  },
];

// Обсуждения по треку (демо-счётчики; те же треки, что у постов в CommunityView)
const TRACK_COUNTS = { python: [1, 1], react: [1, 1], node: [1, 0] };

// Правый сайдбар вкладки Community: статус → трек пользователя → тренды → топ
function CommunityAside({ techId, isAuthed, onAuth }) {
  const t = useT();
  // Подписки персистятся по идентичности (гость/uid) — мёртв. №4;
  // гость без логина — тултип «Log in to follow» + открывается auth-модалка
  const [following, setFollowing] = useState(() => loadFollows());
  const [profile, setProfile] = useState(null);
  const track = TRACK_COUNTS[techId];

  const toggleFollow = (handle) => {
    if (!isAuthed) {
      if (onAuth) onAuth("login", "community");
      return;
    }
    setFollowing((prev) => {
      const next = { ...prev, [handle]: !prev[handle] };
      saveFollows(next);
      return next;
    });
  };

  useEffect(() => {
    if (!profile) return;
    const onKey = (e) => {
      if (e.key === "Escape") setProfile(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profile]);

  return (
    <>
      <aside className="card community-status">
        <span className="label-caps community-status__title">
          {t("community.systemStatus")}
        </span>
        {/* ONLINE NOW удалён (мёртв. №3 — статичное число без источника);
            остаётся общий счётчик участников */}
        <div className="community-status__grid">
          <div className="community-status__tile">
            <span className="community-status__label">
              {t("community.totalMembers")}
            </span>
            <strong className="community-status__value">84.5k</strong>
          </div>
        </div>
      </aside>

      {techId && track && (
        <aside className="card community-trackcard">
          <button
            type="button"
            className="community-trackcard__btn"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("syntax-community-track"))
            }
          >
            <span className="label-caps community-trackcard__title">
              {t("community.trackCardTitle", {
                tech: t(getTech(techId).label),
              })}
            </span>
            <strong className="community-trackcard__value">
              {t("community.trackCardBody", { n: track[0], m: track[1] })}
            </strong>
          </button>
        </aside>
      )}

      <aside className="card community-trending">
        <span className="label-caps community-trending__title">
          <svg
            className="community-trending__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
          {t("community.trendingTags")}
        </span>
        <div className="community-trending__tags">
          {TRENDING_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className="community-trending__tag"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("syntax-community-tag", { detail: tag }),
                )
              }
            >
              #{tag}
            </button>
          ))}
        </div>
      </aside>

      <aside className="card community-top">
        <span className="label-caps community-top__title">
          <svg
            className="community-top__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7S11 2 7.5 3 12 7 12 7ZM12 7s1-5 4.5-4S12 7 12 7Z" />
          </svg>
          {t("community.topContributors")}
        </span>
        <div className="community-top__list">
          {CONTRIBUTORS.map((user, i) => (
            <div key={user.handle} className="community-top__row">
              <span className="community-top__rank">{i + 1}</span>
              <button
                type="button"
                className="community-top__avatar"
                onClick={() => setProfile(user)}
                aria-label={user.name}
              >
                <Avatar name={user.name} hue={user.hue} size="sm" />
              </button>
              <button
                type="button"
                className="community-top__user"
                onClick={() => setProfile(user)}
              >
                <span className="community-top__name">
                  {user.name}
                  {user.bot && (
                    <span className="bot-badge" title={t("community.bot")}>
                      BOT
                    </span>
                  )}
                </span>
                <span className="community-top__handle">{user.handle}</span>
              </button>
              <div className="community-top__rep">
                <strong>{fmtNum(user.rep)}</strong>
                <span>{t("community.rep")}</span>
              </div>
              <button
                type="button"
                className={`community-top__follow ${following[user.handle] ? "community-top__follow--on" : ""}`}
                aria-pressed={!!following[user.handle]}
                title={!isAuthed ? t("community.followLogin") : undefined}
                onClick={() => toggleFollow(user.handle)}
              >
                {following[user.handle]
                  ? t("community.following")
                  : t("community.follow")}
              </button>
            </div>
          ))}
        </div>
      </aside>

      {profile && (
        <div
          className="community-modal"
          role="dialog"
          aria-modal="true"
          aria-label={profile.name}
          onClick={() => setProfile(null)}
        >
          <div
            className="community-modal__panel community-modal__panel--profile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile">
              <Avatar name={profile.name} hue={profile.hue} size="lg" />
              <strong className="profile__name">{profile.name}</strong>
              <span className="profile__handle">{profile.handle}</span>
              <div className="profile__stats">
                <div className="profile__stat">
                  <strong>{fmtNum(profile.rep)}</strong>
                  <span>{t("community.rep")}</span>
                </div>
                <div className="profile__stat">
                  <strong>
                    {t("community.profilePosts", { n: profile.posts })}
                  </strong>
                </div>
                <div className="profile__stat">
                  <strong>
                    {t("community.profileStreak", { n: profile.streak })}
                  </strong>
                </div>
              </div>
              <div className="profile__actions">
                <button
                  type="button"
                  className={`btn ${following[profile.handle] ? "btn--secondary" : "btn--primary"}`}
                  aria-pressed={!!following[profile.handle]}
                  title={!isAuthed ? t("community.followLogin") : undefined}
                  onClick={() => toggleFollow(profile.handle)}
                >
                  {following[profile.handle]
                    ? t("community.following")
                    : t("community.follow")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setProfile(null)}
                >
                  {t("editor.cancel")}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="community-modal__close"
              onClick={() => setProfile(null)}
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
      )}
    </>
  );
}

export default CommunityAside;
