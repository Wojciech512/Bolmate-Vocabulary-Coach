import { Link } from "react-router-dom";
import "../styles/home.css";

function HomePage() {
  return (
    <section className="home">
      <h2>Spanish notebook → flashcards → quiz</h2>
      <p>
        Add the words from your notebook, practice one-by-one, and import new ones with AI/OCR
        when you are ready. Keep the flow lightweight: type, submit, practice.
      </p>
      <div className="home-actions">
        <Link to="/flashcards" className="button primary">Add flashcards</Link>
        <Link to="/quiz" className="button secondary">Start quiz</Link>
        <Link to="/interpret" className="button">Import from photo/text</Link>
      </div>
      <div className="home-grid">
        <article>
          <h3>1. Add</h3>
          <p>Enter Spanish + translation, or upload text/images to let AI extract them.</p>
        </article>
        <article>
          <h3>2. Practice</h3>
          <p>One card at a time. Instant correctness feedback with optional AI hint.</p>
        </article>
        <article>
          <h3>3. Track</h3>
          <p>See per-word correct/incorrect counters to focus on the tough ones.</p>
        </article>
      </div>
    </section>
  );
}

export default HomePage;
