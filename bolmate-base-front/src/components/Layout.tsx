import { Link, useLocation } from "react-router-dom";
import "../styles/layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Bolmate Coach</h1>
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
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">React + Flask + PostgreSQL vocabulary coach</footer>
    </div>
  );
}

export default Layout;
