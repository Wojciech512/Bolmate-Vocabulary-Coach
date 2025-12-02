import { Link } from "react-router-dom";
import "../styles/home.css";

function HomePage() {
  return (
    <section className="home">
      <h2>Bolmate Vocabulary Coach</h2>
      <p>
        Add Spanish (or any language) words from your notebook, practice them daily in a fast Q&A flow,
        and get AI-powered hints, examples, and OCR/interpretation support.
      </p>
      <div className="home-grid">
        <div className="card">
          <h3>Add words</h3>
          <p>Type your Spanish word and translation. Progress counters stay visible.</p>
          <Link to="/flashcards" className="button">Go to Flashcards</Link>
        </div>
        <div className="card">
          <h3>Practice</h3>
          <p>One-word quiz loop with instant correctness check and AI hints when you miss.</p>
          <Link to="/quiz" className="button">Start Quiz</Link>
        </div>
        <div className="card">
          <h3>Interpret</h3>
          <p>Paste notebook text or upload files to extract vocabulary with translations.</p>
          <Link to="/interpret" className="button">Try Interpret</Link>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
