function Header({ theme, onToggleTheme }) {
    return (
       <header className="topbar">
        <div className="topbar__left">
            <a className="brand" href="#">Syn<span>tax</span></a>
        </div>
        <div className="topbar__right">
            <div className="lang">
                <button className="icon-btn icon-btn--flag lang__toggle" type="button" aria-haspopup="true"
                    aria-expanded="false" aria-label="Change language: English (UK)">
                    <span className="lang__flag" aria-hidden="true">🇬🇧</span>
                </button>
                <div className="lang__menu" role="menu" hidden>
                    <button className="lang__item is-active" type="button" role="menuitem" data-lang="en" data-flag="🇬🇧"
                        data-name="English (UK)"><span aria-hidden="true">🇬🇧</span> English (UK) <svg
                            className="lang__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12 5 5 9-10" />
                        </svg></button>
                    <button className="lang__item" type="button" role="menuitem" data-lang="ru" data-flag="🇷🇺"
                        data-name="Русский"><span aria-hidden="true">🇷🇺</span> Русский <svg className="lang__check"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12 5 5 9-10" />
                        </svg></button>
                    <button className="lang__item" type="button" role="menuitem" data-lang="de" data-flag="🇩🇪"
                        data-name="Deutsch"><span aria-hidden="true">🇩🇪</span> Deutsch <svg className="lang__check"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12 5 5 9-10" />
                        </svg></button>
                </div>
            </div>
            <button className="icon-btn theme-toggle" type="button" aria-label="Toggle theme" onClick={onToggleTheme}>
                <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path
                        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
            </button>
            <button className="icon-btn" type="button" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
            </button>
            <button className="avatar" type="button" aria-label="Account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
                </svg>
            </button>
        </div>
    </header> 
    )
}

export default Header;