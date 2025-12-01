import "../styles/home.css";

function HomePage() {
  return (
    <section className="home">
      <h2>Welcome</h2>
      <p>
        This template wires together a React frontend, a Flask backend, and a PostgreSQL
        database. Use the navigation above to explore the example users module or extend the
        layout with your own pages.
      </p>
      <ul>
        <li>React Router for navigation</li>
        <li>Axios-based API helper</li>
        <li>Environment-driven API base URL</li>
      </ul>
    </section>
  );
}

export default HomePage;
