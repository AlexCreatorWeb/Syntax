import { useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import LessonView from "./views/LessonView";
import MainView from "./views/MainView";
import RoadmapView from "./views/RoadmapView";
import TechnologyView from "./views/TechnologyView";
import TasksView from "./views/TasksView";
import DocsView from "./views/DocsView";
import RankingsView from "./views/RankingsView";
import CommunityView from "./views/CommunityView";
import ProfileView from "./views/ProfileView";
import SettingsView from "./views/SettingsView";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { getCompleted, getDoneTasks } from "../lib/progress";
import { taskJobFor } from "../lib/taskJob";
import { lessonJobFor } from "../lib/lessonJob";

// Учебный контекст «урока» (демо-данные; дальше — с бэкенда)
function lessonJob(t) {
  return {
    kind: "lesson",
    title: t("lesson.title"),
    desc: t("lesson.desc"),
    backTab: "roadmap",
  };
}

function MainContent({
  activeTab,
  theme,
  job,
  onNavigate,
  activeTech,
  onSelectTech,
  onSignup,
  dbLessons,
  session,
  userName,
  guestMode,
  onAuth,
  onLogout,
  progressTick,
  docsRoute,
  onDocsRoute,
  onToggleTheme,
}) {
  const t = useT();
  const { langCode } = useLanguage();
  const [currentLanguage] = useState("javascript"); // селектор языка редактора появится позже
  const isAuthed = Boolean(session);
  // Гостевой режим (UX-аудит 2026-09): «Continue as guest» — реальный путь,
  // уроки/задачи открыты, прогресс — в guest-бакетах (наследуется при регистрации)
  const canAccess = isAuthed || guestMode;
  // Перерасчёт taskDone после Complete (job живёт в state App и не пересобирается)
  const [taskTick, setTaskTick] = useState(0);
  // progressTick (App): после синка БД→кэш — перерендер вьюх (профиль/roadmap
  // в момент входа видели пустой кэш; данные уже в localStorage — просто перерисовать)
  void progressTick;

  // УЧЕБА ЗА РЕГИСТРАЦИЕЙ/ГОСТЕВЫМ РЕЖИМОМ: аноним листает roadmap/технологии/tasks,
  // открыть задачу/урок — после входа ИЛИ «Continue as guest».
  // Исключение: ПЕРВЫЙ урок любого трека открыт анониму (фрис-триал, 2026-09).
  // requireAuth(action): аноним → auth-модалка + pending-action; после успешного
  // входа/флага гостя эффект выполняет сохранённое действие — студент
  // оказывается в том самом уроке/задаче, что нажал до регистрации.
  const pendingActionRef = useRef(null);
  const requireAuth = (action) => {
    if (canAccess) {
      action();
      return;
    }
    pendingActionRef.current = action;
    onAuth("signup", null);
  };
  useEffect(() => {
    if (canAccess && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action();
    }
  }, [canAccess]);
  // #/lesson без job-контекста (refresh/bookmark): урок живёт в состоянии App,
  // после перезагрузки job=null — вместо белого экрана мягкий редирект на roadmap
  useEffect(() => {
    if (activeTab === "lesson" && !job) onNavigate("roadmap");
  }, [activeTab, job, onNavigate]);

  // К2: урок привязан к треку — имя, описание и файл соответствуют технологии.
  // Без techId (демо-урок с главной) — первая строка БД целиком / исходный JavaScript-урок.
  // Приоритет: таблица `lessons` в Supabase (строка с tech = трек) → i18n-статика (fallback).
  const dbLessonsArr = dbLessons || [];
  // UX-аудит: курс-контекст открытого урока (n/m, prev, next) для LessonView
  const lessonCtx = (() => {
    if (!job || job.kind !== "lesson" || !job.lessonId || !job.techId)
      return null;
    const rows = dbLessonsArr.filter((l) => l.tech === job.techId);
    const n = rows.findIndex((l) => l.id === job.lessonId) + 1;
    if (!n) return null;
    // Строгая последовательность (Udemy): «Next» разблокируется, только когда
    // ВСЕ предыдущие уроки пройдены (а не только текущий — дыры в прогрессе
    // из старых данных не дают перескакивать вперёд)
    const prevDone = rows.slice(0, n - 1).every((l) =>
      getCompleted(job.techId).includes(l.id),
    );
    return {
      n,
      m: rows.length,
      prev: rows[n - 2] || null,
      next: rows[n] || null,
      allPrevDone: prevDone,
    };
  })();
  const openCourseLesson = (lesson, techId, backTab) =>
    doOpenDbLesson(
      lesson,
      techId,
      backTab || (job && job.backTab) || "technology",
    );
  const doOpenDbLesson = (lesson, techId, backTab = "technology") => {
    // UX-аудит H1: без явного трека (демо-урок с главной, Continue без трека) —
    // трек берём из самой строки урока: верный файл (index.html), язык Monaco,
    // live-превью, номер в курсе, EN-заголовок и запись прогресса.
    const tid = techId || (lesson && lesson.tech) || null;
    const staticFor = tid ? t(`techs.${tid}.lesson`) : null;
    // n = номер урока в курсе (порядок id) — для EN-локализации заголовка
    const rows = tid ? dbLessonsArr.filter((l) => l.tech === tid) : [];
    const n = rows.findIndex((l) => l.id === lesson.id) + 1;
    // Урок из БД = отдельная вкладка «lesson»: материал (markdown) + редактор с заданием
    onNavigate(
      "lesson",
      lessonJobFor(
        lesson,
        tid,
        backTab,
        (staticFor && staticFor.desc) || "",
        n || null,
        langCode,
      ),
    );
  };
  // Гость → auth-гейт. Исключение (2026-09): ПЕРВЫЙ урок любого курса открыт
  // всем — обещание лендинга «first lesson in 2 minutes», демо-урок без регистрации.
  const lessonNumber = (lesson, techId) => {
    const tid = techId || (lesson && lesson.tech) || null;
    const rows = tid
      ? dbLessonsArr.filter((l) => l.tech === tid)
      : dbLessonsArr;
    return rows.findIndex((l) => l.id === lesson.id) + 1;
  };
  const openDbLesson = (lesson, techId, backTab) => {
    if (canAccess || lessonNumber(lesson, techId) <= 1) {
      doOpenDbLesson(lesson, techId, backTab);
      return;
    }
    requireAuth(() => doOpenDbLesson(lesson, techId, backTab));
  };
  const doOpenLesson = (techId) => {
    // Урок трека из БД: первый НЕВЫПОЛНЕННЫЙ (иначе — первый). Без трека
    // (Continue с главной) — первый невыполненный по ВСЕМ трекам: логичное
    // «продолжить», а не возврат на первый урок HTML.
    const techLessons = techId
      ? dbLessonsArr.filter((l) => l.tech === techId)
      : dbLessonsArr;
    const match = techId
      ? techLessons.find((l) => !getCompleted(techId).includes(l.id)) ||
        techLessons[0]
      : dbLessonsArr.find((l) => !getCompleted(l.tech).includes(l.id)) ||
        dbLessonsArr[0];
    if (match) {
      openDbLesson(match, techId);
      return;
    }
    if (techId) {
      const lesson = t(`techs.${techId}.lesson`);
      if (lesson && lesson.title) {
        onNavigate("editor", {
          kind: "lesson",
          title: lesson.title,
          desc: lesson.desc,
          backTab: "technology",
          techId,
          file: lesson.file,
        });
        return;
      }
    }
    onNavigate("editor", lessonJob(t));
  };
  // Гость → auth-гейт: после входа «Continue» продолжает с того же урока.
  // Исключение: гость всегда попадает на ПЕРВЫЙ урок трека (open без гейта);
  // трек без уроков в БД — обычный гейт.
  const openLesson = (techId) => {
    const tid = techId && techId !== "none" ? techId : null;
    if (!canAccess) {
      const first = tid
        ? dbLessonsArr.find((l) => l.tech === tid)
        : dbLessonsArr[0];
      if (first) {
        doOpenDbLesson(first, tid);
        return;
      }
      // БД ещё грузится (null) или пуста — гостя НЕ слить в регистрацию:
      // обещание лендинга «первый урок за 2 минуты» держим и на статическом демо.
      if (!tid) {
        onNavigate("editor", lessonJob(t));
        return;
      }
    }
    requireAuth(() => doOpenLesson(tid));
  };
  // 2026-09: Tasks = структурированный каталог. openTask(task) — задача из
  // src/content/tasks/*.json (job: файлы, тесты, XP, связь с уроком — в lib/taskJob.js).
  // Гость → auth-гейт (условия: задачи — за регистрацией).
  const openTask = (task) =>
    requireAuth(() => {
      const j = taskJobFor(task, {
        dbLessons: dbLessonsArr,
        langCode,
        onCompleted: () => setTaskTick((v) => v + 1),
      });
      if (j) onNavigate("editor", j);
    });

  const renderLessonCard = () => (
    <section className="card lesson">
      <div className="lesson__top">
        <span className="chip chip--module">{t("lesson.chip")}</span>
        <button type="button" className="btn btn--primary" onClick={openLesson}>
          {t("lesson.continue")}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <h1 className="lesson__title">{t("lesson.title")}</h1>
      <p className="lesson__desc">{t("lesson.desc")}</p>
      <div className="lesson__progress">
        <div className="progress-labels">
          <span className="label-caps">{t("lesson.progress")}</span>
          <span className="label-caps progress-value">45%</span>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={45}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar__fill" style={{ width: "45%" }}></div>
        </div>
      </div>
    </section>
  );

  const renderPlaceholder = (tab) => (
    <section className="card placeholders">
      <div className="placeholders__head">
        <h1 className="lesson__title">{t(`placeholders.${tab}Title`)}</h1>
        {/* M2-аудит: заглушки не притворяются готовыми разделами */}
        <span className="soon-badge">{t("home.soon")}</span>
      </div>
      <p className="lesson__desc">{t(`placeholders.${tab}Desc`)}</p>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <MainView
            onNavigate={onNavigate}
            onSignup={onSignup}
            onDemo={() => openLesson(activeTech)}
            activeTech={activeTech}
            onSelectTech={onSelectTech}
            dbLessons={dbLessons}
            isAuthed={canAccess}
            onAuth={onAuth}
          />
        );
      case "roadmap":
        return (
          <RoadmapView
            activeTech={activeTech}
            onSelectTech={onSelectTech}
            onResume={(id) => openLesson(id)}
            dbLessons={dbLessons}
            onOpenDbLesson={openDbLesson}
            onNavigate={onNavigate}
          />
        );
      case "technology":
        // job.techId — при клике по карточке; activeTech — при deep-link/refresh (job сбрасывается)
        return (
          <TechnologyView
            techId={(job && job.techId) || activeTech}
            onResume={(id) => openLesson(id)}
            onOpenDbLesson={openDbLesson}
            dbLessons={dbLessonsArr}
            onNavigate={onNavigate}
            onSelectTech={onSelectTech}
            isAuthed={canAccess}
          />
        );
      case "editor": {
        // Task-джоб: taskDone пересчитываем (job в state App не пересобирается после Complete)
        const editorJob =
          job && job.kind === "task" && job.track
            ? {
                ...job,
                taskDone: getDoneTasks().includes(`${job.track}:${job.taskId}`),
              }
            : job;
        void taskTick; // зависимость: пересчёт после Complete
        return (
          <CodeEditor
            key={
              job && job.kind === "task" && job.taskId
                ? `task-${job.taskId}`
                : "editor"
            }
            language={currentLanguage}
            theme={theme}
            job={editorJob}
            onNavigate={onNavigate}
          />
        );
      }
      case "lesson":
        // Урок из базы: материал + редактор (job = строка lessons); без job — редирект в effect
        return job ? (
          <LessonView
            job={job}
            theme={theme}
            onNavigate={onNavigate}
            lessonCtx={lessonCtx}
            onOpenLesson={openCourseLesson}
          />
        ) : null;
      case "tasks":
        // key=activeTech: смена трека перемонтирует вьюху — tech-фильтр синхронен с выбранным треком
        return (
          <TasksView
            key={activeTech || "none"}
            activeTech={activeTech}
            onSelectTech={onSelectTech}
            onSolve={(task) => openTask(task)}
          />
        );
      case "documentation":
        // docsRoute {track, page} — из /docs-пути (deep-link + refresh); onDocsRoute — pushState
        return (
          <DocsView
            docsRoute={docsRoute}
            onDocsRoute={onDocsRoute}
            activeTech={activeTech}
            onNavigate={onNavigate}
            onOpenTask={(task) => openTask(task)}
          />
        );
      case "rankings":
        return (
          <RankingsView
            isAuthed={canAccess}
            onAuth={onAuth}
            userName={userName}
          />
        );
      case "community":
        return <CommunityView activeTech={activeTech} />;
      case "settings":
        return (
          <SettingsView
            theme={theme}
            onToggleTheme={onToggleTheme}
            session={session}
            userName={userName}
            onLogout={onLogout}
          />
        );
      case "support":
        return renderPlaceholder("support");
      case "profile":
        return (
          <ProfileView
            session={session}
            userName={userName}
            onAuth={onAuth}
            onNavigate={onNavigate}
            onLogout={onLogout}
            dbLessons={dbLessonsArr}
          />
        );
      default:
        return renderLessonCard();
    }
  };

  return <main className="content">{renderTabContent()}</main>;
}

export default MainContent;
