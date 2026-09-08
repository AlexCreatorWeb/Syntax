import { NAV_ICONS } from "./nav-data";
import { useT } from "../i18n/useT";

// UX-аудит V4: мобильный bottom tab bar — главный цикл платформы (5 вкл. Home)
// в один тап вместо «burger → пункт» (2 тапа). Остальное (Docs/Settings/Profile) — в burger.
// Аудит нав-2026-09: Editor (песочница-утилита) заменён на Courses — ежедневная
// секция «продолжить учить» важнее в bottom bar; редактор доступен через burger.
const TABS = [
        { id: "home", icon: NAV_ICONS.home || null, labelKey: "home" },
        { id: "roadmap", icon: NAV_ICONS.roadmap, labelKey: "roadmap" },
        { id: "courses", icon: NAV_ICONS.courses, labelKey: "courses" },
        { id: "tasks", icon: NAV_ICONS.tasks, labelKey: "tasks" },
        { id: "community", icon: NAV_ICONS.community, labelKey: "community" },
        { id: "rankings", icon: NAV_ICONS.rankings, labelKey: "rankings" },
];

export default function MobileTabBar({ activeTab, onNavigate }) {
        const t = useT();
        // Иконка home (SVG-элемент — как остальные NAV_ICONS)
        const HomeIcon = (
                <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                >
                        <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                        <path d="M9 22V12h6v10" />
                </svg>
        );
        return (
                <nav className="mobile-tabbar" aria-label="Main">
                        {TABS.map((tab) => {
                                const active =
                                        activeTab === tab.id ||
                                        (tab.id === "roadmap" &&
                                                activeTab === "technology") ||
                                        // Страница курса — часть раздела «Courses» (подсветка на tech-странице)
                                        (tab.id === "courses" &&
                                                activeTab === "technology");
                                return (
                                        <button
                                                key={tab.id}
                                                type="button"
                                                className={`mobile-tabbar__item ${active ? "is-active" : ""}`}
                                                aria-label={t(
                                                        `sidebar.${tab.labelKey}`,
                                                )}
                                                aria-current={
                                                        active
                                                                ? "page"
                                                                : undefined
                                                }
                                                onClick={() =>
                                                        onNavigate(tab.id)
                                                }
                                        >
                                                {/* NAV_ICONS — готовые JSX-элементы (не компоненты) */}
                                                <span className="mobile-tabbar__icon">
                                                        {tab.icon || HomeIcon}
                                                </span>
                                                <span>
                                                        {t(
                                                                `sidebar.${tab.labelKey}`,
                                                        )}
                                                </span>
                                        </button>
                                );
                        })}
                </nav>
        );
}
