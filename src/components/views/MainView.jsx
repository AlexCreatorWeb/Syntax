import { useState, useEffect, useRef } from "react";
import { useT } from "../../i18n/useT";
import TechCardsGrid from "../TechCardsGrid";

// Значения статистики (мокап): число + суффикс для count-up
const STATS = {
  students: { value: 50, decimals: 0, suffix: "k+" },
  tasks: { value: 1.2, decimals: 1, suffix: "M" },
  success: { value: 94, decimals: 0, suffix: "%" },
};

const PROOF_HUES = [152, 200, 262, 330, 42];

// Count-up с easeOutExpo (только на первый mount; reduced-motion → сразу финал)
function useCountUp(target, decimals = 0, duration = 800) {
  const [value, setValue] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, duration]);
  return value.toFixed(decimals);
}

function StatValue({ stat, className }) {
  const v = useCountUp(stat.value, stat.decimals);
  return (
    <span className={className}>
      {v}
      {stat.suffix}
    </span>
  );
}

// Mock окна редактора: typing-анимация строк + "tests passed"
// ch = точная длина строки в символах (моноширинный шрифт) — CSS печатает её за ch*RATE
const CODE_LINES = [
  { ch: 22, node: <span className="tk-c">// Your first function</span> },
  {
    ch: 37,
    node: (
      <>
        <span className="tk-k">const</span> url <span className="tk-p">=</span>{" "}
        <span className="tk-s">&quot;https://api.syntax.dev&quot;</span>;
      </>
    ),
  },
  { ch: 1, node: " " },
  {
    ch: 30,
    node: (
      <>
        <span className="tk-k">async function</span> <span className="tk-f">fetchStatus</span>(){" "}
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
        <span className="tk-k">await</span> <span className="tk-f">fetch</span>(url);
      </>
    ),
  },
  {
    ch: 34,
    node: (
      <>
        {"  "}<span className="tk-k">return</span> (<span className="tk-k">await</span> res.<span className="tk-f">json</span>()).status;
      </>
    ),
  },
  { ch: 1, node: <span className="tk-p">{"}"}</span> },
  {
    ch: 31,
    node: (
      <>
        <span className="tk-f">fetchStatus</span>().<span className="tk-f">then</span>(console.log);
      </>
    ),
  },
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
        carets[i].style.visibility = p > 0 && (isLast || now < d + dur + 0.6) ? "visible" : "hidden";
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5 9-10" />
          </svg>
          {t("home.offer.passed")}
        </span>
      </div>
    </div>
  );
}

function MainView({ onNavigate, onSignup, onDemo, activeTech, onSelectTech }) {
  const t = useT();

  // Success-rate кольцо: r=52 => окружность ~326.7. Sweep при mount (двойной rAF —
  // transition обязан стартовать от полного C, иначе браузер «догонит» мгновенно),
  // после sweep'а — дышащее свечение (is-live): блок «живой», а не статичный.
  const C = 326.7;
  const [ringOffset, setRingOffset] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? C * (1 - STATS.success.value / 100) : C
  );
  // reduced-motion: сразу в финальном состоянии (без свипа и свечения-таймера)
  const [ringLive, setRingLive] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (ringLive) return;
    let t2;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRingOffset(C * (1 - STATS.success.value / 100)))
    );
    t2 = setTimeout(() => setRingLive(true), 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t2);
    };
  }, [ringLive, C]);

  return (
    <div className="home">
      {/* 1. Гостевой hero: оффер + продукт (mock редактора) в первом экране */}
      <section className="card card--feature home__hero spotlight">
        <div className="home__hero-text">
          <span className="label-caps home__eyebrow">{t("home.offer.eyebrow")}</span>
          <h1 className="home__hero-title">{t("home.offer.title")}</h1>
          <p className="home__hero-desc">{t("home.offer.desc")}</p>
          <div className="home__hero-cta">
            <button type="button" className="btn btn--primary home__hero-btn" onClick={onSignup}>
              {t("home.offer.start")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button type="button" className="btn btn--secondary home__hero-btn" onClick={onDemo}>
              {t("home.offer.demo")}
            </button>
          </div>
          <span className="home__trust">{t("home.offer.trust")}</span>
          <div className="home__proof">
            <span className="home__proof-avatars" aria-hidden="true">
              {PROOF_HUES.map((hue, i) => (
                <span
                  key={i}
                  className="avatar-dot avatar-dot--sm home__proof-avatar"
                  style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 18%))` }}
                />
              ))}
            </span>
            <span className="home__proof-text">
              {t("home.proof")} · <span className="home__proof-rating">★ 4.8</span>
            </span>
          </div>
        </div>
        <HeroDemo t={t} />
      </section>

      {/* 2. Программа: каталог треков — что учить (UX-аудит Р8: поднято на 2-е место) */}
      <section className="home__techs">
        <h3 className="home__section-title">{t("home.section.program")}</h3>
        <p className="home__section-sub">{t("home.section.programDesc")}</p>
        <TechCardsGrid
          activeTech={activeTech}
          onOpenTech={(id) => {
            onSelectTech(id); // выбор трека (лого в хедере) — К4: персистится
            onNavigate("technology", { techId: id }); // сразу на страницу технологии
          }}
        />
      </section>

      {/* 3. Bento-статистика: доказательство (UX-аудит Р9: личное обещание — на 2-й позиции) */}
      <section className="home__stats">
        <div className={`stat-card stat-card--success spotlight${ringLive ? " is-live" : ""}`}>
          {/* Кольцо — центр композиции: число считается В ПУЗЕ, sweep при загрузке,
              после — мягкое дышащее свечение (живой элемент, не статичный круг) */}
          <div className="success-ring" role="img" aria-label={`${t("home.stats.success")}: ${STATS.success.value}${STATS.success.suffix}`}>
            <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <linearGradient id="success-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent-2, #5eead4)" />
                </linearGradient>
              </defs>
              <circle className="ring__track" cx="60" cy="60" r="52" fill="none" strokeWidth="10" />
              <circle
                className="ring__fill"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="url(#success-ring-grad)"
                strokeDasharray={C}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="success-ring__center">
              <span className="success-ring__value">
                <StatValue stat={STATS.success} className="success-ring__num" />
              </span>
              <span className="success-ring__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
                {t("home.stats.successDelta")}
              </span>
            </div>
          </div>
          <div className="stat-card__main">
            <span className="stat-card__label">{t("home.stats.success")}</span>
            <span className="success-ring__sub">{t("home.stats.successSub")}</span>
          </div>
        </div>
        <div className="stat-card spotlight">
          <span className="stat-card__label">{t("home.firstProject")}</span>
          <span className="stat-card__value">{t("home.firstProjectValue")}</span>
          <div className="stat-card__delta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            {t("home.firstProjectDelta")}
          </div>
        </div>
        <div className="stat-card spotlight">
          <span className="stat-card__label">{t("home.stats.students")}</span>
          <StatValue stat={STATS.students} className="stat-card__value" />
          <div className="stat-card__delta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            {t("home.stats.studentsDelta")}
          </div>
        </div>
        <div className="stat-card stat-card--spark spotlight">
          <span className="stat-card__label">{t("home.stats.tasks")}</span>
          <StatValue stat={STATS.tasks} className="stat-card__value" />
          <div className="stat-card__delta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            {t("home.stats.tasksDelta")}
          </div>
          <svg className="sparkline" viewBox="0 0 320 48" preserveAspectRatio="none" aria-hidden="true">
            <path className="sparkline__line" d="M0 40 L32 38 L64 34 L96 36 L128 28 L160 30 L192 22 L224 24 L256 16 L288 14 L320 8" />
            <circle className="sparkline__dot" cx="320" cy="8" r="3.5" />
          </svg>
        </div>
        <div className="stat-card spotlight">
          <span className="stat-card__label">{t("home.projects")}</span>
          <span className="stat-card__value">{t("home.projectsValue")}</span>
          <div className="stat-card__delta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
            {t("home.projectsDelta")}
          </div>
        </div>
      </section>

      {/* 4. Live-preview дашборда: аргумент «что получите» (UX-аудит Р7: в конверсионной зоне перед CTA,
          без дублирующего primary; единственный выход — «View the roadmap», Р13/Р14)
          (отзыв-ученика удалён — выглядел неорганично, 2026-09) */}
      <section className="card card--feature home__resume spotlight">
        <span className="home__preview-note">{t("home.preview")}</span>
        <div className="home__resume-head">
          <div>
            <span className="label-caps home__greeting">{t("home.greeting")}</span>
            <h2 className="home__lesson-title">{t("home.lessonTitle")}</h2>
          </div>
          <span className="home__resume-pct">{t("home.lessonProgress")}</span>
        </div>
        <div className="home__resume-progress">
          <div className="bar">
            <div className="bar__fill bar__fill--shimmer" style={{ width: "45%" }} />
          </div>
        </div>
        <div className="home__resume-actions">
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate("roadmap")}>
            {t("home.lesson.viewRoadmap")}
          </button>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="card card--feature home__final spotlight">
        <h2 className="home__final-title">{t("home.final.title")}</h2>
        <span className="home__trust">{t("home.offer.trust")}</span>
        <button type="button" className="btn btn--primary home__hero-btn" onClick={onSignup}>
          {t("header.signup")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>

      {/* 7. Футер */}
      <footer className="home__footer">
        <div className="home__footer-brand">
          <span className="brand__word">
            Syn<span className="brand__accent">tax</span>
          </span>
          <p className="home__footer-tagline">{t("footer.tagline")}</p>
        </div>
        <div className="home__footer-cols">
          <div className="home__footer-col">
            <h5>{t("footer.product")}</h5>
            {/* Порядок синхронен сайдбару (UX-аудит Р17) */}
            <button type="button" onClick={() => onNavigate("roadmap")}>{t("sidebar.roadmap")}</button>
            <button type="button" onClick={() => onNavigate("tasks")}>{t("sidebar.tasks")}</button>
            <button type="button" onClick={() => onNavigate("editor")}>{t("sidebar.editor")}</button>
            <button type="button" onClick={() => onNavigate("documentation")}>{t("sidebar.documentation")}</button>
          </div>
          <div className="home__footer-col">
            <h5>{t("footer.company")}</h5>
            <button type="button" onClick={() => onNavigate("community")}>{t("sidebar.community")}</button>
            <button type="button" onClick={() => onNavigate("rankings")}>{t("sidebar.rankings")}</button>
            <button type="button" onClick={() => onNavigate("support")}>{t("sidebar.support")}</button>
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
