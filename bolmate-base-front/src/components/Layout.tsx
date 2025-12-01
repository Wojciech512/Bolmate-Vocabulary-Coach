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
        <h1>Bolmate Base</h1>
        <nav>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Start
          </Link>
          <Link
            className={location.pathname.startsWith("/users") ? "active" : ""}
            to="/users"
          >
            Users
          </Link>
        </nav>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">React + Flask + PostgreSQL boilerplate</footer>
    </div>
  );
}

export default Layout;
