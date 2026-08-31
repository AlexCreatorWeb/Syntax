import { JsLogo, PyLogo, Html5Logo, ReactLogo, VueLogo } from "../components/TechLogos";

const TECHS = [
  { id: "javascript", label: "home.tech.javascript", lessons: 42, Logo: JsLogo },
  { id: "python", label: "home.tech.python", lessons: 28, Logo: PyLogo },
  { id: "htmlcss", label: "home.tech.htmlcss", lessons: 24, Logo: Html5Logo },
  { id: "react", label: "home.tech.react", lessons: 18, Logo: ReactLogo },
  { id: "vue", label: "home.tech.vue", lessons: 22, Logo: VueLogo },
];

export const getTech = (id) => TECHS.find((tech) => tech.id === id);

export default TECHS;
