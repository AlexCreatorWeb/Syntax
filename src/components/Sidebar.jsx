import { useT } from "../i18n/useT";

function Sidebar({ activeTab, onSelectTab }) {
  const t = useT();
  const navItems = [
    {
      id: "roadmap",
      label: "Roadmap",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      ),
    },
    {
    id: "editor",
    label: "Editor",
    icon: (
        <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        >
        <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
        </svg>
    ),
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      ),
    },
    {
      id: "rankings",
      label: "Rankings",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </svg>
      ),
    },
    {
      id: "documentation",
      label: "Documentation",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 0-2 2V5Z" />
          <path d="M4 19a2 2 0 0 1 2-2h14" />
        </svg>
      ),
    },
    {
      id: "community",
      label: "Community",
      icon: (
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
      ),
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      ),
    },
    {
      id: "support",
      label: "Support",
      icon: (
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
          <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5" />
          <circle cx="12" cy="17" r=".5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="sidebar">
      <div className="streak card is-68">
        <div className="streak__ring" aria-hidden="true">
          <svg viewBox="0 0 44 44">
            <circle className="ring-bg" cx="22" cy="22" r="19" />
            <circle className="ring-fg" cx="22" cy="22" r="19" />
          </svg>
          <span className="streak__pct">68%</span>
        </div>
        <div className="streak__meta">
          <strong>{t("sidebar.complete")}</strong>
          <span>{t("sidebar.streak")}</span>
        </div>
      </div>

      <nav className="nav" aria-label="Main">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav__item ${activeTab === item.id ? "is-active" : ""}`}
            onClick={() => onSelectTab(item.id)}
          >
            {item.icon}
            <span>{t(`sidebar.${item.id}`)}</span>
          </button>
        ))}
      </nav>

      <div className="nav nav--bottom">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav__item ${activeTab === item.id ? "is-active" : ""}`}
            onClick={() => onSelectTab(item.id)}
          >
            {item.icon}
            <span>{t(`sidebar.${item.id}`)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;