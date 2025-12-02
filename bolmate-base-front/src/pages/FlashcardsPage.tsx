import { FormEvent, useContext, useEffect, useState } from "react";
import api from "../api";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/flashcards.css";

export type Flashcard = {
  id: number;
  source_word: string;
  translated_word: string;
  source_language: string;
  native_language: string;
  example_sentence?: string | null;
  example_sentence_translated?: string | null;
  difficulty_level?: string | null;
  correct_count: number;
  incorrect_count: number;
};

function FlashcardsPage() {
  const { nativeLanguage } = useContext(LanguageContext);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [sourceWord, setSourceWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = async () => {
    const response = await api.get<Flashcard[]>("/api/flashcards");
    setFlashcards(response.data);
  };

  useEffect(() => {
    fetchFlashcards().catch(console.error);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!sourceWord || !translation) {
      setError("Spanish word and translation are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/flashcards", {
        source_word: sourceWord,
        translated_word: translation,
        native_language: nativeLanguage,
        source_language: "es",
        is_manual: true,
      });
      setSourceWord("");
      setTranslation("");
      fetchFlashcards();
    } catch (err: unknown) {
      console.error(err);
      setError("Could not save flashcard (maybe duplicate)");
    } finally {
      setLoading(false);
    }
  };

  const removeFlashcard = async (id: number) => {
    await api.delete(`/api/flashcards/${id}`);
    fetchFlashcards();
  };

  return (
    <section className="flashcards">
      <header>
        <div>
          <h2>Flashcards</h2>
          <p>Add Spanish words and translations, see progress, and edit later.</p>
        </div>
      </header>

      <div className="grid">
        <form className="card" onSubmit={handleSubmit}>
          <label>
            Spanish word
            <input value={sourceWord} onChange={(e) => setSourceWord(e.target.value)} placeholder="gato" />
          </label>
          <label>
            Translation ({nativeLanguage})
            <input value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="kot" />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add flashcard"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        <div className="card list-card">
          <div className="list-header">
            <h3>Saved words</h3>
            <button type="button" onClick={fetchFlashcards}>Refresh</button>
          </div>
          {flashcards.length === 0 && <p>No flashcards yet.</p>}
          <ul className="flashcard-list">
            {flashcards.map((card) => (
              <li key={card.id}>
                <div>
                  <strong>{card.source_word}</strong> → {card.translated_word}
                  {card.example_sentence && (
                    <div className="example">
                      {card.example_sentence}
                      {card.example_sentence_translated && <span> / {card.example_sentence_translated}</span>}
                    </div>
                  )}
                  {card.difficulty_level && <small>Level: {card.difficulty_level}</small>}
                </div>
                <div className="meta">
                  <span className="badge success">✔ {card.correct_count}</span>
                  <span className="badge danger">✖ {card.incorrect_count}</span>
                  <button type="button" onClick={() => removeFlashcard(card.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default FlashcardsPage;

