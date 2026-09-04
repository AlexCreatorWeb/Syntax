import { useState, useRef, useEffect, useCallback } from "react";
import CodeEditor from "../CodeEditor";
import { MdContent } from "../../lib/markdown-view";
import TechList, { getTech } from "../../lib/techs";
import { getLessonVideo } from "../../lib/lesson-video";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import { getCompleted } from "../../lib/progress";
import { LESSON_XP } from "../../lib/xp";
import { localizedLessonTitle } from "../../lib/lessonTitles";

// Статическая мапа логов (react-compiler: без getTech().Logo в рендере)
const LOGO_MAP = Object.fromEntries(TechList.map((x) => [x.id, x.Logo]));

// Лень-загрузка YouTube IFrame API (один раз на сессию)
let ytApiPromise = null;
function loadYouTubeApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return ytApiPromise;
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Видео урока: до клика — наша обложка + Play. По клику — кастомный плеер
// (подход: controls=0 через IFrame API + clickCatcher-слой поверх видео —
// он перехватывает hover и гасит YouTube-хад: «Другие видео», карточку
// канала, тултипы). Свои контролы снизу: Play/Pause + прогресс (drag =
// перемотка) + время. Логотип YouTube нельзя убрать полностью (ToS).
// Заглушка для уроков без ролика (задезейблена): та же брендовая обложка,
// без кнопки Play + чип «Видео скоро». Компонент без хуков (ветка рендера).
function LessonVideoPlaceholder({ video, soonText }) {
  return (
    <figure className="lesson-view__video lesson-view__video--soon">
      <div className="lesson-view__video-poster" aria-disabled="true">
        <img src={video.thumb} alt="" loading="lazy" />
        <span className="lesson-view__video-soon">{soonText}</span>
      </div>
    </figure>
  );
}

function LessonVideo({ video, label, onWatched }) {
  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const barRef = useRef(null);
  const rafRef = useRef(null);
  const rootRef = useRef(null);
  // Прогресс по видео (механика Udemy): макс. позиция просмотра ≥ 75% длительности
  // → onWatched() один раз; дальше только UI, без повторных вызовов
  const watchedRef = useRef(0);
  const watchedSentRef = useRef(false);

  // Fullscreen — TOGGLE той же кнопкой: клик во вс-экране = выход.
  // iOS Safari не поддерживает Element Fullscreen API — fallback: CSS-оверлей
  // (класс --fs), та же кнопка выводит, состояние держим в isFullscreen.
  const cssFsRef = useRef(false);
  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      return;
    }
    if (cssFsRef.current) {
      cssFsRef.current = false;
      el.classList.remove("lesson-view__player--fs");
      setIsFullscreen(false);
      return;
    }
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else {
      cssFsRef.current = true;
      el.classList.add("lesson-view__player--fs");
      setIsFullscreen(true);
    }
  };

  // Esc/крестик браузера тоже меняют fullscreen — синхронизируем иконку кнопки
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Инициализация IFrame API-плеера
  useEffect(() => {
    if (!playing) return undefined;
    let destroyed = false;
    loadYouTubeApi().then((YT) => {
      if (destroyed || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId: video.id,
        playerVars: {
          autoplay: 1,
          controls: 0, // без нативных контроллов
          modestbranding: 1,
          rel: 0, // без «следующих видео» других каналов
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            setDuration(e.target.getDuration());
            setIsReady(true);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.PLAYING)
              setDuration(e.target.getDuration());
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (playerRef.current && playerRef.current.destroy)
        playerRef.current.destroy();
    };
  }, [playing, video.id]);

  // Опрос позиции (rAF ~раз в кадр, пока не тащим ползунок); тут же —
  // детект «просмотрели ≥ 75%» (по макс. позиции, как на Udemy)
  useEffect(() => {
    if (!playing || isDragging) return undefined;
    const tick = () => {
      const p = playerRef.current;
      if (p && p.getCurrentTime) {
        const time = p.getCurrentTime();
        setCurrent(time);
        if (onWatched && !watchedSentRef.current) {
          watchedRef.current = Math.max(watchedRef.current, time);
          const d = p.getDuration ? p.getDuration() : 0;
          if (d > 0 && watchedRef.current >= d * 0.75) {
            watchedSentRef.current = true;
            onWatched();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, isDragging, onWatched]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }, [isPlaying]);

  const seekToClientX = useCallback(
    (clientX) => {
      const bar = barRef.current;
      const p = playerRef.current;
      if (!bar || !p || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      const time = ratio * duration;
      setCurrent(time);
      p.seekTo(time, true);
    },
    [duration],
  );

  const onBarPointerDown = (e) => {
    setIsDragging(true);
    seekToClientX(e.clientX);
    const onMove = (ev) => seekToClientX(ev.clientX);
    const onUp = (ev) => {
      seekToClientX(ev.clientX);
      setIsDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <figure className="lesson-view__video">
      {playing ? (
        <div className="lesson-view__player" ref={rootRef}>
          <div className="lesson-view__player-box">
            <div ref={hostRef} className="lesson-view__player-host" />
            {/* Прозрачный слой: клик = play/pause, hover не доходит до YT-худа */}
            <div
              className="lesson-view__player-catcher"
              onClick={togglePlay}
              role="button"
              aria-label={isPlaying ? "Pause" : "Play"}
            />
            {/* Брендовая верхняя полоса: закрывает YT-заголовок и авто-
                всплывающую карточку «следующее видео» (её параметра нет);
                справа — свой фуллскрин (весь плеер, включая контролы) */}
            <div className="lesson-view__player-top">
              <span className="lesson-view__player-top-chip">
                LESSON {String(video.num).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="lesson-view__player-fs"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? label + " (exit)" : label}
                title={isFullscreen ? "Exit full screen" : "Full screen"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isFullscreen ? (
                    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                  ) : (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                  )}
                </svg>
              </button>
            </div>
            {/* Бейдж внизу слева: закрывает авто-кнопку «поделиться» */}
            <div
              className="lesson-view__player-badge"
              onClick={togglePlay}
              aria-hidden="true"
            >
              <span>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5Z" />
                </svg>
              </span>
            </div>
            {(!isPlaying || !isReady) && (
              <button
                type="button"
                className="lesson-view__player-bigplay"
                onClick={togglePlay}
                aria-label={label}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5Z" />
                </svg>
              </button>
            )}
          </div>
          <div className="lesson-view__player-controls">
            <button
              type="button"
              className="lesson-view__player-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5Z" />
                </svg>
              )}
            </button>
            <div
              ref={barRef}
              className="lesson-view__player-bar"
              onPointerDown={onBarPointerDown}
              role="slider"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(current)}
            >
              <span
                className="lesson-view__player-fill"
                style={{ width: `${progress}%` }}
              />
              <span
                className="lesson-view__player-thumb"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="lesson-view__player-time">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>
        </div>
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
function LessonView({
  job,
  theme,
  onNavigate,
  lessonCtx = null,
  onOpenLesson,
}) {
  const t = useT();
  const { langCode } = useLanguage();
  const [tab, setTab] = useState("material");
  const [taskVisited, setTaskVisited] = useState(false);
  // UX-аудит H2: «только что сдал» (сигнал из CodeEditor) — панель «Урок пройден»
  const [justDone, setJustDone] = useState(false);

  const tech = job && job.techId ? getTech(job.techId) : null;
  const Logo = job && job.techId ? LOGO_MAP[job.techId] : null;
  const video = getLessonVideo(job);

  // Урок уже пройден (повторное посещение) — панель «пройден» показываем всегда;
  // чтение из LS в рендере — штатный паттерн (так же roadmap/profile)
  const isDone =
    justDone ||
    (job.lessonId && job.techId
      ? getCompleted(job.techId).includes(job.lessonId)
      : false);
  const neighborTitle = (lesson, n) =>
    lesson ? localizedLessonTitle(job.techId, n, lesson.title, langCode) : "";

  // UX-аудит H2: только что сдал урок — выводим на вкладку Task (там панель
  // «Урок пройден» + CTA); setTab — в обработчике (не в effect)
  const handleSuccess = () => {
    setJustDone(true);
    setTab("task");
  };

  // Видео ≥ 75% просмотрено (механика Udemy) — урок засчитан тем же путём,
  // что и успешный Submit (progress + lesson_progress в БД + XP), но БЕЗ
  // переключения вкладки: студент читает материал, чип «✓ Урок N из M»
  // и панель «пройден» на Task обновятся сами.
  const videoDoneRef = useRef(false);
  const handleVideoWatched = useCallback(() => {
    if (videoDoneRef.current) return;
    videoDoneRef.current = true;
    if (job && job.onComplete) job.onComplete();
    setJustDone(true);
  }, [job]);
  const prevTitle =
    lessonCtx && lessonCtx.prev
      ? neighborTitle(lessonCtx.prev, lessonCtx.n - 1)
      : "";
  const nextTitle =
    lessonCtx && lessonCtx.next
      ? neighborTitle(lessonCtx.next, lessonCtx.n + 1)
      : "";

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
        {/* UX-аудит H2: позиция в курсе + статус «пройден» */}
        {lessonCtx && (
          <span
            className={`lesson-view__pos ${isDone ? "lesson-view__pos--done" : ""}`}
          >
            {isDone && <span aria-hidden="true">✓ </span>}
            {t("lessonView.lessonOf", { n: lessonCtx.n, m: lessonCtx.m })}
          </span>
        )}
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
          {video &&
            (video.placeholder ? (
              <LessonVideoPlaceholder
                video={video}
                soonText={t("lessonView.videoSoon")}
              />
            ) : (
              <LessonVideo
                video={video}
                label={t("lessonView.video")}
                onWatched={handleVideoWatched}
              />
            ))}
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
        {/* UX-аудит H2: панель «Урок пройден» + CTA «Следующий урок» — разрыв цикла закрыт */}
        {isDone && (
          <div className="lesson-view__donebar" role="status">
            <div className="lesson-view__donebar-info">
              <span className="lesson-view__donebar-ico" aria-hidden="true">
                ✓
              </span>
              <div className="lesson-view__donebar-text">
                <strong>{t("lessonView.doneTitle", { xp: LESSON_XP })}</strong>
                {nextTitle && (
                  <span className="lesson-view__donebar-next">
                    {t("lessonView.upNext")}: {nextTitle}
                  </span>
                )}
              </div>
            </div>
            <div className="lesson-view__donebar-actions">
              {nextTitle && onOpenLesson && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onOpenLesson(lessonCtx.next, job.techId)}
                >
                  {t("lessonView.nextLesson")}
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
              )}
              {job.techId && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    onNavigate("technology", { techId: job.techId })
                  }
                >
                  {t("lessonView.courseList")}
                </button>
              )}
            </div>
          </div>
        )}
        <CodeEditor
          language="javascript"
          theme={theme}
          job={{ ...job, kind: "lesson", onSuccess: handleSuccess }}
          defaultShowPreview={false}
          onNavigate={onNavigate}
        />
      </div>

      {/* UX-аудит H6: навигация по курсу (prev/next) — всегда под уроком */}
      {lessonCtx && onOpenLesson && (
        <nav className="lesson-view__pager" aria-label="Course navigation">
          {lessonCtx.prev ? (
            <button
              type="button"
              className="btn btn--ghost lesson-view__pager-btn"
              onClick={() => onOpenLesson(lessonCtx.prev, job.techId)}
            >
              <span aria-hidden="true">←</span> {t("lessonView.prev")}:{" "}
              <span className="lesson-view__pager-title">{prevTitle}</span>
            </button>
          ) : (
            <span className="lesson-view__pager-spacer" aria-hidden="true" />
          )}
          {lessonCtx.next ? (
            <button
              type="button"
              className="btn btn--ghost lesson-view__pager-btn"
              onClick={() => onOpenLesson(lessonCtx.next, job.techId)}
            >
              <span className="lesson-view__pager-title">
                {t("lessonView.next")}: {nextTitle}
              </span>{" "}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <span className="lesson-view__pager-spacer" aria-hidden="true" />
          )}
        </nav>
      )}

      {/* UX-аудит L22: мобилка (≤900) — плавающая кнопка «К заданию» на вкладке материла */}
      {tab === "material" && (
        <button
          type="button"
          className="lesson-view__task-fab"
          onClick={goTask}
        >
          {t("lessonView.taskFab")}
        </button>
      )}
    </div>
  );
}

export default LessonView;
