import "../styles/home.css";

function HomePage() {
  return (
    <section className="home">
      <h2>Spanish vocabulary coach</h2>
      <p>Move from paper notebook → digital flashcards → daily quiz.</p>
      <ol>
        <li>Add new words on the Flashcards page (Spanish + your translation).</li>
        <li>Use Quiz for rapid recall; stats update per word.</li>
        <li>Try Interpret to upload notebook photos/PDFs or paste text and auto-build cards.</li>
      </ol>
      <p className="note">OpenAI is called from the backend only for hints, examples, and OCR.</p>
    </section>
  );
}

export default HomePage;
