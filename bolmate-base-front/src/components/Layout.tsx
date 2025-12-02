import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../styles/layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { nativeLanguage, setNativeLanguage } = useLanguage();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Bolmate Vocabulary Coach</h1>
          <p className="subtitle">Add words fast, practice faster.</p>
        </div>
        <nav>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Home
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
          <label htmlFor="native-language">Native language</label>
          <select
            id="native-language"
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="pl">Polish</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="nl">Dutch</option>
          </select>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">React + Flask + PostgreSQL + OpenAI</footer>
    </div>
  );
}

export default Layout;
