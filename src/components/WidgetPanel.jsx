function WidgetPanel() {
  return (
    <aside className="rail">
      {/* Daily challenge */}
      <section className="card rail-card rail-card--challenge">
        <h2 className="rail-card__title">Daily Challenge</h2>
        <div className="challenge">
          <div className="challenge__head">
            <span className="challenge__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
                <path d="M7 6H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4M17 6h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4" />
              </svg>
            </span>
            <strong>Async Crawler</strong>
          </div>
          <p>
            Build a simple async web crawler that fetches 5 URLs concurrently
            and returns their status codes.
          </p>
          <a className="btn btn--secondary btn--full" href="#">
            Start Challenge
          </a>
        </div>
      </section>

      {/* AI Mentor */}
      <section className="card rail-card rail-card--mentor">
        <h2 className="rail-card__title">AI Mentor</h2>
        <div className="mentor">
          <div className="mentor__msg">
            <span className="mentor__avatar" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="8" width="14" height="11" rx="2" />
                <path d="M12 8V5M9 5h6" />
                <circle cx="9.5" cy="13" r=".5" fill="currentColor" />
                <circle cx="14.5" cy="13" r=".5" fill="currentColor" />
                <path d="M9.5 16h5" />
              </svg>
            </span>
            <p>
              Hello! Do you need help understanding
              <code>asyncio.gather()</code>?
            </p>
          </div>
          <form className="mentor__form" onSubmit={(e) => e.preventDefault()}>
            <input
              className="field"
              type="text"
              placeholder="Ask a question..."
              aria-label="Ask the AI mentor a question"
            />
            <button
              className="btn btn--primary btn--send"
              type="submit"
              aria-label="Send"
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
                <path d="m4 12 16-8-6 16-2.5-6L4 12Z" />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </aside>
  );
}

export default WidgetPanel;
