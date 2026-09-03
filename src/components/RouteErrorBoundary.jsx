import { Component } from "react";
import { useT } from "../i18n/useT";

// Fallback-экран (функция — хук useT доступен здесь)
function ErrorFallback({ onRetry, onNavigate }) {
  const t = useT();
  return (
    <section className="card error-fallback">
      <span className="error-fallback__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.5v.5" />
        </svg>
      </span>
      <h1 className="error-fallback__title">{t("error.title")}</h1>
      <p className="error-fallback__desc">{t("error.desc")}</p>
      <div className="error-fallback__actions">
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          {t("error.retry")}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onNavigate && onNavigate("home")}>
          {t("error.home")}
        </button>
      </div>
    </section>
  );
}

// Route-уровень: падение вьюхи не роняет весь UI (пустой тёмный экран) —
// заглушка «Something went wrong» + «Try again» (перемонтирование).
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, resetKey: 0 };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    console.error("[Syntax] route crashed:", error, info && info.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({ crashed: false, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.crashed) {
      return (
        <ErrorFallback
          onRetry={this.handleRetry}
          onNavigate={this.props.onNavigate}
        />
      );
    }
    // key: перемонтирование subtree при «Try again» (свежий state)
    return <div className="route-error-bounds" key={this.state.resetKey}>{this.props.children}</div>;
  }
}
