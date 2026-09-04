import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";
import AiChat from "../AiChat";

// Валидные внешние ссылки: официальная документация + актуальные справочники
// по каждой технологии платформы. Открываются в новой вкладке.
const TECH_RESOURCES = {
  html: [
    {
      label: "MDN · HTML Reference",
      href: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    },
    { label: "web.dev · Learn HTML", href: "https://web.dev/learn/html" },
    { label: "Can I Use · Browser Support", href: "https://caniuse.com" },
  ],
  css: [
    {
      label: "MDN · CSS Reference",
      href: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    },
    { label: "web.dev · Learn CSS", href: "https://web.dev/learn/css" },
    { label: "Can I Use · Browser Support", href: "https://caniuse.com" },
  ],
  javascript: [
    {
      label: "MDN · JavaScript Guide",
      href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    },
    {
      label: "JavaScript Cheatsheet",
      href: "https://www.html5rocks.com/en/tutorials/everyday/cheatsheet_js/",
    },
    { label: "Can I Use · Browser Support", href: "https://caniuse.com" },
  ],
  python: [
    { label: "Python 3 · Official Docs", href: "https://docs.python.org/3/" },
    { label: "Real Python · Tutorials", href: "https://realpython.com/" },
  ],
  react: [
    { label: "React · Official Docs", href: "https://react.dev" },
    { label: "react.dev · Learn React", href: "https://react.dev/learn" },
  ],
  vue: [
    {
      label: "Vue · Official Guide",
      href: "https://vuejs.org/guide/introduction.html",
    },
    { label: "Vue · API Reference", href: "https://vuejs.org/api/" },
  ],
  node: [
    { label: "Node.js · Official Docs", href: "https://nodejs.org/en/docs" },
    { label: "Node.js · Learn", href: "https://nodejs.org/en/learn" },
  ],
  mongo: [
    { label: "MongoDB · Documentation", href: "https://www.mongodb.com/docs/" },
    { label: "MongoDB · Free Courses", href: "https://learn.mongodb.com/" },
  ],
  postgres: [
    {
      label: "PostgreSQL · Official Docs",
      href: "https://www.postgresql.org/docs/current/",
    },
    {
      label: "PostgreSQL · Tutorial",
      href: "https://www.postgresqltutorial.com/",
    },
  ],
};

// Правый rail страницы технологии И страницы урока (lesson → тот же TechAside):
// Resources (реальные ссылки на документацию) + AI Assistant.
function TechAside({ techId }) {
  const t = useT();
  const tech = getTech(techId) || getTech("javascript");
  const resources = TECH_RESOURCES[tech.id] || TECH_RESOURCES.javascript;

  return (
    <>
      <section className="card rail-card">
        <h2 className="rail-card__title rail-card__title--icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
            <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
          </svg>
          {t("techPage.resources")}
        </h2>
        <ul className="tech-aside__resources">
          {resources.map((r) => (
            <li key={r.href}>
              <a
                className="tech-aside__resource"
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <AiChat techId={tech.id} />
    </>
  );
}

export default TechAside;
