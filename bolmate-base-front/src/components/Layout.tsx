import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { nativeLanguage, setNativeLanguage } = useContext(LanguageContext);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1>Bolmate Tutor</h1>
          <span className="tagline">Spanish notebook → flashcards → quiz</span>
        </div>
        <nav>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Start
          </Link>
          <Link className={location.pathname.startsWith("/flashcards") ? "active" : ""} to="/flashcards">
            Flashcards
          </Link>
          <Link className={location.pathname.startsWith("/quiz") ? "active" : ""} to="/quiz">
            Quiz
          </Link>
          <Link className={location.pathname.startsWith("/interpret") ? "active" : ""} to="/interpret">
            Interpret
          </Link>
        </nav>
        <div className="language-picker">
          <label>
            Native language
            <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)}>
              <option value="pl">Polish</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="nl">Dutch</option>
            </select>
          </label>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">React + Flask + PostgreSQL + OpenAI</footer>
    </div>
  );
}

export default Layout;
