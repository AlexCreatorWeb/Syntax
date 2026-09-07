import {
  JsLogo,
  PyLogo,
  Html5Logo,
  CssLogo,
  NodeLogo,
  PostgresLogo,
  MongoLogo,
  ReactLogo,
  VueLogo,
  ClaudeLogo,
  CursorLogo,
  CopilotLogo,
} from "../components/TechLogos";

const TECHS = [
  { id: "html", label: "home.tech.html", lessons: 16, Logo: Html5Logo },
  { id: "css", label: "home.tech.css", lessons: 22, Logo: CssLogo },
  {
    id: "javascript",
    label: "home.tech.javascript",
    lessons: 42,
    Logo: JsLogo,
  },
  { id: "react", label: "home.tech.react", lessons: 18, Logo: ReactLogo },
  { id: "vue", label: "home.tech.vue", lessons: 22, Logo: VueLogo },
  { id: "node", label: "home.tech.node", lessons: 26, Logo: NodeLogo },
  { id: "mongo", label: "home.tech.mongo", lessons: 18, Logo: MongoLogo },
  { id: "python", label: "home.tech.python", lessons: 28, Logo: PyLogo },
  {
    id: "postgres",
    label: "home.tech.postgres",
    lessons: 20,
    Logo: PostgresLogo,
  },
  // II-инструменты (референс «Новый дизайн Херо»): доп-технологии платформы,
  // работают как обычные треки (tech-страница, «Start» → первый урок); курсы в разработке
  { id: "claude", label: "home.tech.claude", lessons: 18, Logo: ClaudeLogo },
  { id: "cursor", label: "home.tech.cursor", lessons: 18, Logo: CursorLogo },
  { id: "copilot", label: "home.tech.copilot", lessons: 16, Logo: CopilotLogo },
];

export const getTech = (id) => TECHS.find((tech) => tech.id === id);

export const TechList = TECHS;

export default TECHS;
