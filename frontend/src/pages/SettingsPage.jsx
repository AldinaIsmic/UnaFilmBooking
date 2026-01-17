import { useEffect, useState } from "react";
import "../styles/settings.css";

export default function SettingsPage() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("theme-dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const avatarSrc =
      user?.role === "ADMIN" ? "/admin.png" : "/referent.png";

  const roleLabel =
      user?.role === "ADMIN" ? "Admin" : "Referent";

  const roleSub =
      user?.role === "ADMIN"
          ? "Una Film Admin"
          : "Una Film Referent";

  return (
      <div className="settings-page">
        <h1 className="settings-title">Postavke</h1>
        <div className="settings-divider" />

        <div className="settings-container">
          <div className="settings-card">
            <div className="settings-card-top">
              <div />
              <span className="settings-chip">Postavke</span>
            </div>

            <div className="settings-profile">
              <div
                  className={`settings-avatar ${
                      user?.role === "ADMIN"
                          ? "avatar-admin"
                          : "avatar-referent"
                  }`}
              >
                <img src={avatarSrc} alt={`${roleLabel} avatar`} />
              </div>

              <h2 className="settings-role">{roleLabel}</h2>
              <p className="settings-sub">{roleSub}</p>
            </div>

            <div className="settings-inner-divider" />

            <div className="settings-row">
              <span className="settings-label">Tema</span>

              <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label="Tema"
                  title="Tema"
              >
              <span className="theme-toggle-icon">
                {dark ? "🌒" : "☀️"}
              </span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
