import { useState } from "react";
import { createFlashcard } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  onCreated: () => void;
};

export default function FlashcardForm({ onCreated }: Props) {
  const { nativeLanguage } = useLanguage();
  const [sourceWord, setSourceWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWord || !translation) {
        setError("Spanish word and translation are required");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      await createFlashcard({
        source_word: sourceWord,
        translated_word: translation,
        source_language: sourceLanguage,
        native_language: nativeLanguage,
      });
      setSourceWord("");
      setTranslation("");
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to save word");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Add a new word</h3>
      <div className="form-row">
        <label>Spanish / Source word</label>
        <input value={sourceWord} onChange={(e) => setSourceWord(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Translation ({nativeLanguage.toUpperCase()})</label>
        <input value={translation} onChange={(e) => setTranslation(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Source language</label>
        <input value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save word"}</button>
    </form>
  );
}

