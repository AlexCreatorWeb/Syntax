import RankingsAside from "./panels/RankingsAside";
import CommunityAside from "./panels/CommunityAside";
import DocsAside from "./panels/DocsAside";
import TasksAside from "./panels/TasksAside";
import TechAside from "./panels/TechAside";
import PromoCard from "./PromoCard";
import DailyChallenge from "./DailyChallenge";

// Вкладки, у которых в дизайне есть собственный правый сайдбар:
// он монтируется во внешнюю rail вместо дефолтных виджетов.
const TAB_ASIDES = {
    rankings: RankingsAside,
    community: CommunityAside,
    documentation: DocsAside,
    tasks: TasksAside,
    technology: TechAside,
    // Урок — тот же функциональный rail, что и страница технологии (Resources + AI Assistant);
    // techId для AI берётся из job (урок привязан к треку)
    lesson: TechAside,
};

function WidgetPanel({
    activeTab,
    onNavigate,
    onAuth,
    job,
    activeTech,
    isAuthed,
    dbLessons,
    docsRoute,
}) {
    const Aside = TAB_ASIDES[activeTab];

    return (
        <aside className="rail">
            {Aside ? (
                <Aside
                    onNavigate={onNavigate}
                    techId={(job && job.techId) || activeTech}
                    isAuthed={isAuthed}
                    dbLessons={dbLessons}
                    onAuth={onAuth}
                    docsRoute={docsRoute}
                />
            ) : (
                <>
                    {/* Daily challenge: только по трекам с реальными уроками в БД, новое каждый день */}
                    <DailyChallenge
                        dbLessons={dbLessons}
                        isAuthed={isAuthed}
                        onAuth={onAuth}
                        onNavigate={onNavigate}
                        backTab="home"
                    />

                    {/* Реклама: книга (вместо AI-ментора; остальные виджеты — позже) */}
                    <PromoCard id="book" />
                </>
            )}
        </aside>
    );
}

export default WidgetPanel;
