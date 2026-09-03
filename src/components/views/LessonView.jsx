import { useState, useRef, useEffect } from "react";
import CodeEditor from "../CodeEditor";
import { MdContent } from "../../lib/markdown-view";
import TechList, { getTech } from "../../lib/techs";
import { getLessonVideo } from "../../lib/lesson-video";
import { useT } from "../../i18n/useT";

// Статическая мапа логов (react-compiler: без getTech().Logo в рендере)
const LOGO_MAP = Object.fromEntries(TechList.map((x) => [x.id, x.Logo]));

// Видео урока: до клика — наша обложка + кнопка Play. По клику — чистый
// iframe (rel=0, controls=0, IFrame API) и НИЧЕГО сверху, кроме индикатора
// просмотра: тонкий прогресс-бар внизу (клик = перемотка). Без масок и
// лишних кнопок.
function LessonVideo({ video, label }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef(null);
  const barRef = useRef(null);

  const cmd = (func, args = []) => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (win)
      win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  // IFrame API (enablejsapi=1): onReady → длительность; ответы команд
  useEffect(() => {
    if (!playing) return undefined;
    const onMsg = (e) => {
      if (e.origin !== "https://www.youtube.com") return;
      let d;
      try {
        d = JSON.parse(e.data);
      } catch {
        return;
      }
      if (d.event === "onReady") cmd("getDuration");
      if (d.func === "getDuration")
        setDuration(Number(d.args && d.args[0]) || 0);
      if (d.func === "getCurrentTime" && d.playerTime != null)
        setTime(d.playerTime);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [playing]);

  // Опрос позиции раз в секунду (в IFrame API нет push-событий времени)
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => cmd("getCurrentTime"), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const seek = (e) => {
    const bar = barRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    cmd("seekTo", [frac * duration, true]);
  };
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <figure className="lesson-view__video">
      {playing ? (
        <>
          <iframe
            ref={iframeRef}
            className="lesson-view__video-frame"
            src={video.src}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <div
            className="lesson-view__video-progress"
            ref={barRef}
            onClick={seek}
            role="slider"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            tabIndex={-1}
          >
            <span
              className="lesson-view__video-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          className="lesson-view__video-poster"
          onClick={() => setPlaying(true)}
          aria-label={label}
        >
          <img src={video.thumb} alt="" loading="lazy" />
          <span className="lesson-view__video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5Z" />
            </svg>
          </span>
        </button>
      )}
    </figure>
  );
}

// Страница урока из базы (Supabase `lessons`):
// хлебные крошки (тех › Уроки) → заголовок → ТАБЫ «Материал | Задание».
// Обе панели всегда смонтированы (неактивная прячется CSS'ом):
// код Monaco, консоль и scroll-позиция переживают переключение табов.
function LessonView({ job, theme, onNavigate }) {
  const t = useT();
  const [tab, setTab] = useState("material");
  const [taskVisited, setTaskVisited] = useState(false);

  const tech = job && job.techId ? getTech(job.techId) : null;
  const Logo = job && job.techId ? LOGO_MAP[job.techId] : null;
  const video = getLessonVideo(job);

  const goTask = () => {
    setTab("task");
    setTaskVisited(true);
  };
  const listHref = tech
    ? `#/technology/${tech.id}`
    : `#/${job.backTab || "roadmap"}`;

  return (
    <div className="lesson-view">
      {/* Хлебные крошки: выход на список уроков технологии */}
      <nav className="lesson-view__crumbs" aria-label="Breadcrumb">
        {tech && (
          <>
            <a className="crumb crumb--tech" href={listHref}>
              {Logo && (
                <span className="crumb__logo" aria-hidden="true">
                  <Logo />
                </span>
              )}
              {t(tech.label)}
            </a>
            <svg
              className="crumb__sep"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </>
        )}
        <a className="crumb crumb--list" href={listHref}>
          {t("techPage.dbLessons")}
        </a>
      </nav>

      <div className="lesson-view__head">
        <h1 className="lesson-view__title">{job.title}</h1>
        {/* (RU-чип убран, фидбек 2026-09: «лишний» — язык курса очевиден из текста) */}
      </div>

      {/* Табы: материал / задание (редактор не размонтируется) */}
      <div className="lesson-view__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "material"}
          className={`lesson-view__tab ${tab === "material" ? "lesson-view__tab--active" : ""}`}
          onClick={() => setTab("material")}
        >
          {t("lessonView.tabMaterial")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "task"}
          className={`lesson-view__tab ${tab === "task" ? "lesson-view__tab--active" : ""}`}
          onClick={goTask}
        >
          {t("lessonView.tabTask")}
          {!taskVisited && (
            <span className="lesson-view__tab-dot" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Панели: обе смонтированы, неактивная — display:none (состояние Monaco сохраняется) */}
      <div
        className={`lesson-view__panel ${tab !== "material" ? "lesson-view__panel--hidden" : ""}`}
      >
        <div className="card lesson-view__material">
          {video && <LessonVideo video={video} label={t("lessonView.video")} />}
          <MdContent src={job.content} t={t} />
          <button
            type="button"
            className="btn btn--primary lesson-view__goto"
            onClick={goTask}
          >
            {t("lessonView.goToTask")}
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
      </div>
      <div
        className={`lesson-view__panel lesson-view__panel--editor ${tab !== "task" ? "lesson-view__panel--hidden" : ""}`}
      >
        <CodeEditor
          language="javascript"
          theme={theme}
          job={{ ...job, kind: "lesson" }}
          defaultShowPreview={false}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

export default LessonView;
