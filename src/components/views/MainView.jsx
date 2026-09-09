import { useEffect, useRef } from "react";
import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";
import { ClaudeLogo, CursorLogo, CopilotLogo } from "../TechLogos";
import TechCardsGrid from "../TechCardsGrid";
import DailyChallenge from "../DailyChallenge";
import PromoCard from "../PromoCard";

// II-инструменты: доп-технологии платформы (референс «Новый дизайн Херо»).
// Ведут себя как обычные треки: клик = выбрать трек + страница технологии.
const AI_TOOL_TECHS = [
  { id: "claude", Logo: ClaudeLogo },
  { id: "cursor", Logo: CursorLogo },
  { id: "copilot", Logo: CopilotLogo },
];

// Mock окна редактора: typing-анимация строк + "tests passed"
// ch = точная длина строки в символах (моноширинный шрифт) — CSS печатает её за ch*RATE
// 6 строк (референс «Новый дизайн Херо») — hero компактнее по высоте
const CODE_LINES = [
  { ch: 22, node: <span className="tk-c">// Your first function</span> },
  {
    ch: 29,
    node: (
      <>
        <span className="tk-k">const</span> url <span className="tk-p">=</span>{" "}
        <span className="tk-s">&quot;api.syntax.dev&quot;</span>;
      </>
    ),
  },
  {
    ch: 30,
    node: (
      <>
        <span className="tk-k">async function</span>{" "}
        <span className="tk-f">fetchStatus</span>(){" "}
        <span className="tk-p">{"{"}</span>
      </>
    ),
  },
  {
    ch: 31,
    node: (
      <>
        {"  "}
        <span className="tk-k">const</span> res <span className="tk-p">=</span>{" "}
        <span className="tk-k">await</span> <span className="tk-f">fetch</span>
        (url);
      </>
    ),
  },
  {
    ch: 34,
    node: (
      <>
        {"  "}
        <span className="tk-k">return</span> (
        <span className="tk-k">await</span> res.
        <span className="tk-f">json</span>()).status;
      </>
    ),
  },
  { ch: 1, node: <span className="tk-p">{"}"}</span> },
  // Аудит 2026-09: окно редактора заполнено — пустая зона под 3 строками
  // читалась как недоработка; 9 строк закрывают высоту карточки
  {
    ch: 28,
    node: (
      <>
        <span className="tk-f">fetchStatus</span>().then((code) =&gt;)
      </>
    ),
  },
  {
    ch: 18,
    node: (
      <>
        {"  "}
        <span className="tk-f">setStatus</span>(code);
      </>
    ),
  },
  { ch: 1, node: <span className="tk-p">);</span> },
];

// Тайминг «печати»: ~0.05с на символ, пауза 0.1с между строками → весь блок ~10.4с
const CODE_RATE = 0.05;
const CODE_START = 0.3;
const CODE_PAUSE = 0.1;
const CODE_TIMING = CODE_LINES.reduce((acc, line, i) => {
  const d = i === 0 ? CODE_START : acc[i - 1].end + CODE_PAUSE;
  const dur = line.ch * CODE_RATE;
  acc[i] = { d, dur, end: d + dur };
  return acc;
}, {});

function HeroDemo({ t }) {
  const rootRef = useRef(null);

  // Время-базовая «печать» на rAF: CSS-анимации с fill в Chrome недёргано теряют
  // финальное состояние (строки оставались невидимы), а по-времени типинг при любом
  // сталле часов просто «допрыгивает» до правильного положения.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("hero-demo--done");
      return;
    }
    const lines = [...root.querySelectorAll(".hero-demo__line")];
    const codes = lines.map((l) => l.querySelector("code"));
    const carets = lines.map((l) => l.querySelector(".hero-demo__caret"));
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const now = (performance.now() - t0) / 1000;
      let allDone = true;
      CODE_LINES.forEach((line, i) => {
        const { d, dur } = CODE_TIMING[i];
        const p = now < d ? 0 : now >= d + dur ? 1 : (now - d) / dur;
        if (p < 1) allDone = false;
        const chars = p >= 1 ? line.ch : Math.floor(p * line.ch + 1e-6);
        lines[i].style.opacity = p > 0 ? "1" : "0";
        codes[i].style.width = chars + "ch";
        const isLast = i === CODE_LINES.length - 1;
        carets[i].style.visibility =
          p > 0 && (isLast || now < d + dur + 0.6) ? "visible" : "hidden";
        carets[i].style.left = `calc(34px + ${chars}ch)`;
      });
      if (allDone) {
        root.classList.add("hero-demo--done");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={rootRef} className="hero-demo" aria-hidden="true">
      <div className="hero-demo__bar">
        <span className="hero-demo__dot" />
        <span className="hero-demo__dot" />
        <span className="hero-demo__dot" />
        <span className="hero-demo__file">app.js</span>
      </div>
      <pre className="hero-demo__code">
        {CODE_LINES.map((line, i) => (
          <span key={i} className="hero-demo__line">
            <span className="hero-demo__ln">{i + 1}</span>
            <code>{line.node}</code>
            <span className="hero-demo__caret" />
          </span>
        ))}
      </pre>
      <div className="hero-demo__foot">
        <span className="btn btn--primary hero-demo__run">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run
        </span>
        <span className="hero-demo__pass">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
          {t("home.offer.passed")}
        </span>
      </div>
    </div>
  );
}

const PROOF_HUES = [152, 200, 262, 330, 42];

// Лёгкая community-карточка в rail (аудит H5: пустой rail во второй половине
// страницы) — демо-данные + честный SAMPLE-чип. Топ-уровень (react-compiler).
const COMMUNITY_HUES = [152, 200, 262, 330, 42];
function CommunityPreview({ onNavigate }) {
  const t = useT();
  return (
    <div className="card community-preview">
      <div className="community-preview__head">
        <span className="label-caps community-preview__title">
          {t("home.communityPreview.title")}
        </span>
        <span className="chip chip--sample">{t("tasks.sample")}</span>
      </div>
      <div className="community-preview__avatars" aria-hidden="true">
        {COMMUNITY_HUES.map((hue, i) => (
          <span
            key={i}
            className="avatar-dot avatar-dot--sm community-preview__avatar"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 18%))`,
            }}
          />
        ))}
      </div>
      <p className="community-preview__text">
        {t("home.communityPreview.body")}
      </p>
      <button
        type="button"
        className="community-preview__cta"
        onClick={() => onNavigate("community")}
      >
        {t("home.communityPreview.cta")}
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
  );
}

// How it works: лого треков — static-мапа (react-compiler: никаких getTech().Logo в рендере)
const HOW_LOGOS = {
  html: getTech("html").Logo,
  css: getTech("css").Logo,
  javascript: getTech("javascript").Logo,
};

function LogoWrap({ L }) {
  return (
    <span className="track-chip__logo">
      <L />
    </span>
  );
}

function MainView({
  onNavigate,
  onSignup,
  onDemo,
  onContinue,
  activeTech,
  onSelectTech,
  dbLessons,
  isAuthed,
  onAuth,
}) {
  const t = useT();

  // Scroll-reveal секций home (UX-аудит: язык движения; reduced-motion — CSS
  // не прячет .reveal, без JS всё тоже видимо)
  useEffect(() => {
    const els = document.querySelectorAll(
      ".home__techs, .home__how, .home__final",
    );
    if (!els.length) return;
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="home">
      {/* 1. Гостевой hero: оффер + продукт (mock редактора) в первом экране */}
      <section className="card card--feature home__hero spotlight">
        {/* Референс «Новый стиль карточек нейронок»: заголовок + текст — левая
            половина, mock-редактор — правая; оба по верхней (основной) линии */}
        <div className="home__hero-row">
          <div className="home__hero-text">
            <span className="label-caps home__eyebrow">
              {t("home.offer.eyebrow")}
            </span>
            <h1 className="home__hero-title">{t("home.offer.title")}</h1>
            <p className="home__hero-desc">{t("home.offer.desc")}</p>
            {/* Пара CTA с РАЗДЕЛЁННЫМИ задачами (2026-07, фидбэк: «демо-урок =
              первый урок; начать бесплатно ≠ демо — не дублировать»):
              гость — «Start for free» (регистрация) + демо; авторизованный —
              «Continue learning» (первый НЕВЫПОЛНЕННЫЙ урок) + демо. Демо =
              ВСЕГДА первый урок трека (openFirstLesson), без гейта. */}
            <div className="home__hero-cta">
              <button
                type="button"
                className="btn btn--primary home__hero-btn"
                onClick={isAuthed ? onContinue : onSignup}
              >
                {isAuthed ? t("home.lesson.continue") : t("home.offer.start")}
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
              <button
                type="button"
                className="btn btn--secondary home__hero-btn"
                onClick={onDemo}
              >
                {t("home.offer.demo")}
              </button>
            </div>
            <div className="home__proof">
              <span className="home__proof-avatars" aria-hidden="true">
                {PROOF_HUES.map((hue, i) => (
                  <span
                    key={i}
                    className="avatar-dot avatar-dot--sm home__proof-avatar"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 18%))`,
                    }}
                  />
                ))}
              </span>
              <span className="home__proof-text">
                {t("home.proof")} ·{" "}
                <span className="home__proof-rating">★ 4.8</span>
              </span>
            </div>
          </div>
          <HeroDemo t={t} />
        </div>
      </section>

      {/* 1b. II-инструменты: Claude / Cursor / GitHub Copilot — доп-технологии
          (референс «Новый дизайн Херо»); кликаются как карточки треков */}
      <section className="home__aitools">
        <h3 className="home__section-title">{t("home.aiTools.title")}</h3>
        <p className="home__section-sub">{t("home.aiTools.sub")}</p>
        <div className="home__aitools-grid">
          {AI_TOOL_TECHS.map((item) => {
            const L = item.Logo;
            const Tech = getTech(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`ai-tool spotlight ai-tool--${item.id}`}
                onClick={() => {
                  onSelectTech(item.id);
                  onNavigate("technology", { techId: item.id });
                }}
              >
                <span className="ai-tool__head">
                  <span className="ai-tool__logo">
                    <L />
                  </span>
                  <span className="ai-tool__info">
                    <span className="ai-tool__title">
                      {t(`home.tech.${item.id}`)}
                    </span>
                    <span className="ai-tool__meta">
                      {t("home.aiTools.lessons", { n: Tech.lessons })}
                    </span>
                  </span>
                </span>
                <span className="ai-tool__foot">
                  <span className="ai-tool__dot" aria-hidden="true" />
                  <span className="ai-tool__first-text">
                    {t(`home.aiTools.${item.id}.first`)}
                  </span>
                  <span className="chip ai-tool__badge">
                    {t("home.aiTools.new")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Программа: каталог core-треков — что учить (II-инструменты — секцией выше) */}
      <section className="home__techs">
        <h3 className="home__section-title">{t("home.section.program")}</h3>
        <p className="home__section-sub">{t("home.section.programDesc")}</p>
        <TechCardsGrid
          coreOnly
          activeTech={activeTech}
          dbLessons={dbLessons}
          onOpenTech={(id) => {
            onSelectTech(id); // выбор трека (лого в хедере) — К4: персистится
            onNavigate("technology", { techId: id }); // сразу на страницу технологии
          }}
        />
      </section>

      {/* 3. How it works: демонстрация ПРОДУКТА вместо демо-bento (UX-аудит V6:
          «5 карточек статистики подряд = дашборд, а не учебный продукт»; ценность
          показываем, а не «продаём цифрами» — цифры уходят в SAMPLE-строку ниже) */}
      <section className="home__how">
        <h3 className="home__section-title">{t("home.how.title")}</h3>
        <p className="home__section-sub">{t("home.how.sub")}</p>
        <div className="home__how-grid">
          <div className="card card--feature home__how-step spotlight">
            <span className="home__how-num">1</span>
            <h4>{t("home.how.s1t")}</h4>
            <p>{t("home.how.s1")}</p>
            <div
              className="home__how-mock home__how-mock--tracks"
              aria-hidden="true"
            >
              <span className="track-chip">
                <LogoWrap L={HOW_LOGOS.html} />
                <em>HTML</em>
              </span>
              <span className="track-chip">
                <LogoWrap L={HOW_LOGOS.css} />
                <em>CSS</em>
              </span>
              <span className="track-chip">
                <LogoWrap L={HOW_LOGOS.javascript} />
                <em>JavaScript</em>
              </span>
              <span className="track-chip track-chip--more">+6</span>
            </div>
          </div>
          <div className="card card--feature home__how-step spotlight">
            <span className="home__how-num">2</span>
            <h4>{t("home.how.s2t")}</h4>
            <p>{t("home.how.s2")}</p>
            <div
              className="home__how-mock home__how-mock--learn"
              aria-hidden="true"
            >
              <div className="mock-video">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="m8 6 8 6-8 6V6Z" />
                </svg>
                {/* Аудит 2026-09: прогресс-бар — мок читается как плеер урока,
                    а не как сломанный пустой прямоугольник */}
                <i className="mock-video__progress" style={{ width: "42%" }} />
              </div>
              <div className="mock-lines">
                <i style={{ width: "92%" }} />
                <i style={{ width: "78%" }} />
                <i style={{ width: "85%" }} />
              </div>
              <div className="mock-callout">
                <b>TIP</b>
                <i style={{ width: "70%" }} />
              </div>
            </div>
          </div>
          <div className="card card--feature home__how-step spotlight">
            <span className="home__how-num">3</span>
            <h4>{t("home.how.s3t")}</h4>
            <p>{t("home.how.s3")}</p>
            <div
              className="home__how-mock home__how-mock--code"
              aria-hidden="true"
            >
              <div className="mock-code">
                <span className="tk-c">{"// tests:"}</span>
                <span className="tk-f">run</span>
                <span>
                  (tests).<span className="tk-f">then</span>(show)
                </span>
              </div>
              <div className="mock-tests">
                <span className="mock-test">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <em>page skeleton</em>
                </span>
                <span className="mock-test">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <em>valid nav</em>
                </span>
                <span className="mock-test mock-test--xp">
                  <em>+50 XP</em>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Демо-цифры — одной честной строкой + SAMPLE (V5), не дашбордом из 5 карточек */}
        <div className="home__strip">
          <span className="chip chip--sample">{t("tasks.sample")}</span>
          <span>{t("home.strip.devs")}</span>
          <span className="home__strip-dot">·</span>
          <span>{t("home.strip.tasks")}</span>
          <span className="home__strip-dot">·</span>
          <span>{t("home.strip.members")}</span>
        </div>
      </section>

      {/* (Live-preview дашборд с заголовком урока убран, 2026-09 — фидбек: плашка не нужна;
          конверсионную зону закрывает final CTA ниже) */}

      {/* 6. Final CTA (аудит P1: muted-строка доверия + secondary «Try a demo lesson») */}
      <section className="card card--feature home__final spotlight">
        <h2 className="home__final-title">{t("home.final.title")}</h2>
        <span className="home__final-trust">{t("home.final.trust")}</span>
        <div className="home__final-actions">
          <button
            type="button"
            className="btn btn--primary home__hero-btn"
            onClick={isAuthed ? onContinue : onSignup}
          >
            {t(isAuthed ? "home.lesson.continue" : "header.signup")}
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
          <button
            type="button"
            className="btn btn--secondary home__hero-btn"
            onClick={onDemo}
          >
            {t("home.offer.demo")}
          </button>
        </div>
      </section>

      {/* Мобайл (≤640px): rail-виджеты (Daily Challenge + книга) — ДО футера, а не после
          (фидбек 2026-09: правая колонка на мобильном уезжала вниз страницы, после футера);
          сама rail на home скрыта этим же брейкпоинтом */}
      <div className="home__mobile-rail">
        <DailyChallenge
          dbLessons={dbLessons}
          isAuthed={isAuthed}
          onAuth={onAuth}
          onNavigate={onNavigate}
          backTab="home"
        />
        <PromoCard id="book" />
        <CommunityPreview onNavigate={onNavigate} />
      </div>

      {/* 7. Футер (аудит P2: нижняя строка — copyright + соцссылки) */}
      <footer className="home__footer">
        <div className="home__footer-brand">
          {/* Лого одной строкой: иконка + слово (nowrap, по центру) */}
          <div className="home__footer-logo">
            <svg
              className="brand__mark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m8 8-4.5 4L8 16" />
              <path d="m16 8 4.5 4L16 16" />
              <path d="M13.5 5.5 10.5 18.5" />
            </svg>
            <span className="brand__word">
              Syn<span className="brand__accent">tax</span>
            </span>
          </div>
          <p className="home__footer-tagline">{t("footer.tagline")}</p>
        </div>
        <div className="home__footer-cols">
          <div className="home__footer-col">
            <h5>{t("footer.product")}</h5>
            {/* Порядок синхронен сайдбару (UX-аудит Р17) */}
            <button type="button" onClick={() => onNavigate("roadmap")}>
              {t("sidebar.roadmap")}
            </button>
            <button type="button" onClick={() => onNavigate("courses")}>
              {t("sidebar.courses")}
            </button>
            <button type="button" onClick={() => onNavigate("tasks")}>
              {t("sidebar.tasks")}
            </button>
            <button type="button" onClick={() => onNavigate("editor")}>
              {t("sidebar.editor")}
            </button>
            <button type="button" onClick={() => onNavigate("documentation")}>
              {t("sidebar.documentation")}
            </button>
          </div>
          <div className="home__footer-col">
            <h5>{t("footer.company")}</h5>
            <button type="button" onClick={() => onNavigate("community")}>
              {t("sidebar.community")}
            </button>
            <button type="button" onClick={() => onNavigate("rankings")}>
              {t("sidebar.rankings")}
            </button>
            <button type="button" onClick={() => onNavigate("support")}>
              {t("sidebar.support")}
            </button>
          </div>
          <div className="home__footer-col">
            <h5>{t("footer.legal")}</h5>
            <button type="button">{t("footer.privacy")}</button>
            <button type="button">{t("footer.terms")}</button>
          </div>
        </div>
        <div className="home__footer-bottom">
          <span className="home__footer-copy">© 2026 Syntax</span>
          <div className="home__footer-social">
            <a
              href="https://x.com/syntax"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Syntax on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/syntax"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Syntax on GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11.04 11.04 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
            </a>
            <a
              href="https://discord.gg/syntax"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Syntax on Discord"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.78 13.78 0 0 0-.64 1.28 18.27 18.27 0 0 0-5.5 0 12.64 12.64 0 0 0-.64-1.28c-1.71.29-3.37.8-4.93 1.51A20.26 20.26 0 0 0 .1 18.06a19.9 19.9 0 0 0 6.04 3.03c.49-.66.92-1.37 1.29-2.1a12.9 12.9 0 0 1-2.03-.98c.17-.12.34-.25.5-.38a14.2 14.2 0 0 0 12.2 0c.16.13.33.26.5.38-.65.38-1.33.71-2.04.98.37.73.8 1.44 1.29 2.1a19.84 19.84 0 0 0 6.05-3.03 20.2 20.2 0 0 0-3.63-13.69zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42zm7.96 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.09 2.16 2.42 0 1.34-.94 2.42-2.16 2.42z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainView;
// Экспорт для WidgetPanel (rail главной, аудит H5) — тот же компонент, что в моб. rail
export { CommunityPreview };
