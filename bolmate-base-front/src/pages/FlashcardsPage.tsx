import { FormEvent, useEffect, useState } from "react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";
import "../styles/flashcards.css";

interface Flashcard {
  id: number;
  source_word: string;
  source_language: string;
  translated_word: string;
  native_language: string;
  example_sentence?: string;
  example_sentence_translated?: string;
  difficulty_level?: string;
  is_manual: boolean;
  correct_count: number;
  incorrect_count: number;
}

function FlashcardsPage() {
  const { nativeLanguage } = useLanguage();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [form, setForm] = useState({
    source_word: "",
    translated_word: "",
    source_language: "es",
    native_language: nativeLanguage,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFlashcards = async () => {
    const res = await api.get<Flashcard[]>("/flashcards");
    setFlashcards(res.data);
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, native_language: nativeLanguage }));
  }, [nativeLanguage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/flashcards", form);
      setForm((prev) => ({ ...prev, source_word: "", translated_word: "" }));
      fetchFlashcards();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Unable to save flashcard");
    } finally {
      setLoading(false);
    }
  };

  const deleteFlashcard = async (id: number) => {
    await api.delete(`/flashcards/${id}`);
    fetchFlashcards();
  };

  return (
    <section className="flashcards">
      <header>
        <div>
          <h2>Flashcards</h2>
          <p>Add Spanish words with translations. Duplicates are prevented per language pair.</p>
        </div>
      </header>

      <form className="card-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Spanish word
            <input
              value={form.source_word}
              onChange={(e) => setForm({ ...form, source_word: e.target.value })}
              required
            />
          </label>
          <label>
            Translation ({form.native_language})
            <input
              value={form.translated_word}
              onChange={(e) => setForm({ ...form, translated_word: e.target.value })}
              required
            />
          </label>
          <label>
            Source language
            <select
              value={form.source_language}
              onChange={(e) => setForm({ ...form, source_language: e.target.value })}
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </label>
          <label>
            Native language
            <select
              value={form.native_language}
              onChange={(e) => setForm({ ...form, native_language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="pl">Polish</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="nl">Dutch</option>
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? "Saving..." : "Add flashcard"}
        </button>
      </form>

      <div className="card-list">
        <h3>Saved words</h3>
        {flashcards.length === 0 && <p>No flashcards yet. Start by adding one above.</p>}
        {flashcards.map((card) => (
          <div key={card.id} className="card-row">
            <div>
              <strong>{card.source_word}</strong> → {card.translated_word} ({card.source_language}
              → {card.native_language})
              <div className="muted">Correct {card.correct_count} · Incorrect {card.incorrect_count}</div>
              {card.example_sentence && (
                <div className="muted small">
                  {card.example_sentence} — {card.example_sentence_translated}
                </div>
              )}
            </div>
            <button className="link danger" onClick={() => deleteFlashcard(card.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FlashcardsPage;
