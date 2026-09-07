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
            {/* Авторизованному «Начать бесплатно» = анти-CТА (он уже зарегистрирован):
              primary = «Продолжить обучение» (первый невыполненный урок),
              secondary = дорожная карта. Гостю — конверсионная пара. */}
            <div className="home__hero-cta">
              {isAuthed ? (
                <>
                  <button
                    type="button"
                    className="btn btn--primary home__hero-btn"
                    onClick={onDemo}
                  >
                    {t("home.lesson.continue")}
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
                    onClick={() => onNavigate("roadmap")}
                  >
                    {t("home.lesson.viewRoadmap")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn--primary home__hero-btn"
                    onClick={onSignup}
                  >
                    {t("home.offer.start")}
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
                </>
              )}
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
                {/* Референс «Новый стиль карточек нейронок»: верх — лого +
                    название/«N уроков», низ (на всю ширину) — точка + первый
                    урок + пилюля «Новое» справа */}
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

      {/* 2. Программа: каталог треков — что учить (UX-аудит Р8: поднято на 2-е место) */}
      <section className="home__techs">
        <h3 className="home__section-title">{t("home.section.program")}</h3>
        <p className="home__section-sub">{t("home.section.programDesc")}</p>
        <TechCardsGrid
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

      {/* 6. Final CTA */}
      <section className="card card--feature home__final spotlight">
        <h2 className="home__final-title">{t("home.final.title")}</h2>
        <button
          type="button"
          className="btn btn--primary home__hero-btn"
          onClick={isAuthed ? onDemo : onSignup}
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
      </div>

      {/* 7. Футер */}
      <footer className="home__footer">
        <div className="home__footer-brand">
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
          <p className="home__footer-tagline">{t("footer.tagline")}</p>
        </div>
        <div className="home__footer-cols">
          <div className="home__footer-col">
            <h5>{t("footer.product")}</h5>
            {/* Порядок синхронен сайдбару (UX-аудит Р17) */}
            <button type="button" onClick={() => onNavigate("roadmap")}>
              {t("sidebar.roadmap")}
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
      </footer>
    </div>
  );
}

export default MainView;
