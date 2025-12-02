import { useEffect, useState } from "react";
import FlashcardForm from "../components/FlashcardForm";
import FlashcardList from "../components/FlashcardList";
import { fetchFlashcards } from "../api";
import { Flashcard } from "../types";

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const loadFlashcards = async () => {
    const res = await fetchFlashcards();
    setFlashcards(res.data);
  };

  useEffect(() => {
    loadFlashcards();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Your notebook</h2>
          <p className="muted">Add Spanish words with translations, then practice them.</p>
        </div>
      </div>
      <FlashcardForm onCreated={loadFlashcards} />
      <FlashcardList flashcards={flashcards} onDeleted={loadFlashcards} />
    </div>
  );
}

