function MainContent() {
  return (
    <main className="content">
      {/* Lesson card */}
      <section className="card lesson">
        <div className="lesson__top">
          <span className="chip chip--module">Module 4 &bull; Lesson 2</span>
          <a className="btn btn--primary" href="#">
            Continue Learning
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
          </a>
        </div>
        <h1 className="lesson__title">Async Loops in Python</h1>
        <p className="lesson__desc">
          Master concurrent execution in Python using the <code>asyncio</code>{" "}
          library. Learn how to manage tasks, gather results, and optimize
          I/O-bound operations.
        </p>
        <div className="lesson__progress">
          <div className="progress-labels">
            <span className="label-caps">Lesson Progress</span>
            <span className="label-caps progress-value">45%</span>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-valuenow="45"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="bar__fill" style={{ width: "45%" }}></div>
          </div>
        </div>
      </section>

      {/* Code editor card */}
      <section className="card code-card">
        <header className="code-card__head">
          <span className="code-card__file">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m8 8-5 4 5 4M16 8l5 4-5 4M13 5l-2 14" />
            </svg>
            main.py
          </span>
          <button
            className="icon-btn icon-btn--sm"
            type="button"
            aria-label="Copy code"
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
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          </button>
        </header>
        <pre className="code">
            <code>
                <span className="tk-kw">import</span> asyncio{'\n'}
                <span className="tk-kw">import</span> time{'\n\n'}
                <span className="tk-kw">async def</span> <span className="tk-fn">fetch_data</span>(id: <span className="tk-type">int</span>, delay: <span className="tk-type">int</span>):{'\n'}
                {'    '}<span className="tk-cm"># Simulate an I/O operation (like fetching from an API)</span>{'\n'}
                {'    '}<span className="tk-fn">print</span>(<span className="tk-str">f"Task &#123;id&#125;: Starting download..."</span>){'\n'}
                {'    '}<span className="tk-kw">await</span> asyncio.sleep(delay){'\n'}
                {'    '}<span className="tk-fn">print</span>(<span className="tk-str">f"Task &#123;id&#125;: Download finished!"</span>){'\n'}
                {'    '}<span className="tk-kw">return</span> &#123;<span className="tk-str">"id"</span>: id, <span className="tk-str">"status"</span>: <span className="tk-str">"ok"</span>&#125;{'\n\n'}
                <span className="tk-kw">async def</span> <span className="tk-fn">main</span>():{'\n'}
                {'    '}<span className="tk-cm"># Run multiple tasks concurrently</span>{'\n'}
                {'    '}start_time = time.perf_counter(){'\n'}
                {'    '}results = <span className="tk-kw">await</span> asyncio.gather({'\n'}
                {'        '}fetch_data(1, 2),{'\n'}
                {'        '}fetch_data(2, 3),{'\n'}
                {'        '}fetch_data(3, 1),{'\n'}
                {'    '}){'\n'}
                {'    '}elapsed = time.perf_counter() - start_time{'\n'}
                {'    '}<span className="tk-fn">print</span>(<span className="tk-str">f"Done in &#123;elapsed:.2f&#125;s"</span>){'\n'}
            </code>
        </pre>
      </section>
    </main>
  );
}

export default MainContent;
