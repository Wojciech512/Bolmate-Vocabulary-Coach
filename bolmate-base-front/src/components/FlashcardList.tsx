import { Flashcard } from "../types";
import { deleteFlashcard } from "../api";

type Props = {
  flashcards: Flashcard[];
  onDeleted: () => void;
};

export default function FlashcardList({ flashcards, onDeleted }: Props) {
  const handleDelete = async (id: number) => {
    await deleteFlashcard(id);
    onDeleted();
  };

  if (!flashcards.length) {
    return <p className="muted">No flashcards yet. Add your first word above.</p>;
  }

  return (
    <div className="card">
      <h3>Saved words</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Translation</th>
            <th>Stats</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flashcards.map((card) => (
            <tr key={card.id}>
              <td>
                <strong>{card.source_word}</strong>
                <div className="muted">{card.source_language.toUpperCase()}</div>
              </td>
              <td>
                {card.translated_word}
                {card.example_sentence && (
                  <div className="muted small">
                    {card.example_sentence}
                    {card.example_sentence_translated && ` — ${card.example_sentence_translated}`}
                  </div>
                )}
              </td>
              <td>
                ✅ {card.correct_count} / ❌ {card.incorrect_count}
                {card.difficulty_level && <div className="pill">{card.difficulty_level}</div>}
              </td>
              <td>
                <button className="secondary" onClick={() => handleDelete(card.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

