import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";

const TRENDING_TAGS = ["React18", "AsyncJS", "TypeScriptBasics", "SystemDesign", "WebGL", "Rust"];

const CONTRIBUTORS = [
  { name: "Alex Mercer", handle: "@amermer_dev", rep: "14.2k", hue: 158 },
  { name: "Sarah Chen", handle: "@schen_codes", rep: "12.8k", hue: 330 },
  { name: "DataBot_v2", handle: "@auto_reply", rep: "9.4k", hue: 210 },
];

// Правый сайдбар вкладки Community (монтируется во внешнюю rail)
function CommunityAside() {
  const t = useT();

  return (
    <>
      <aside className="card community-status">
        <span className="label-caps community-status__title">{t("community.systemStatus")}</span>
        <div className="community-status__grid">
          <div className="community-status__tile">
            <span className="community-status__label">
              <span className="community-status__dot" aria-hidden="true" />
              {t("community.onlineNow")}
            </span>
            <strong className="community-status__value">1,432</strong>
          </div>
          <div className="community-status__tile">
            <span className="community-status__label">{t("community.totalMembers")}</span>
            <strong className="community-status__value">84.5k</strong>
          </div>
        </div>
      </aside>

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
                  new CustomEvent("syntax-community-tag", { detail: tag })
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
              <Avatar name={user.name} hue={user.hue} size="sm" />
              <div className="community-top__user">
                <span className="community-top__name">{user.name}</span>
                <span className="community-top__handle">{user.handle}</span>
              </div>
              <div className="community-top__rep">
                <strong>{user.rep}</strong>
                <span>{t("community.rep")}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export default CommunityAside;
