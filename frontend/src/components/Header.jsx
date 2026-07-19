// components/Header.jsx — Navigation bar with route links and API status
// NOTE: Uses NavLink/Link — must be rendered inside <BrowserRouter> in App.jsx

import { NavLink } from 'react-router-dom'

export default function Header({ apiOnline }) {
  return (
    <header className="header">
      {/* Brand — use NavLink so no router hook needed outside context */}
      <NavLink to="/" className="header-brand-link">
        <div className="header-brand">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="url(#iconGrad)"
              />
              <defs>
                <linearGradient id="iconGrad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="header-title">OsteoAI</div>
            <div className="header-subtitle">Dual-Branch Deep Learning Analysis</div>
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="header-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/patient"
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          Patient
        </NavLink>
        <NavLink
          to="/analyze"
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          Analyze
        </NavLink>

        <div className="nav-divider"></div>

        <div className="nav-chip">
          <span className="chip-dot blue"></span>
          MobileNetV4
        </div>
        <div className="nav-chip">
          <span className="chip-dot purple"></span>
          ViT
        </div>

        <div className={`header-status ${apiOnline ? 'online' : ''}`}>
          <div className={`status-dot ${apiOnline ? '' : 'offline'}`}></div>
          {apiOnline ? 'Model Ready' : 'API Offline'}
        </div>
      </nav>
    </header>
  )
}
