import { useState } from "react";
import { interpretText, createFlashcard } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function InterpretForm() {
  const { nativeLanguage } = useLanguage();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);
    setAddedIds(new Set());
    try {
      const res = await interpretText(input, nativeLanguage);
      setResults(res.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Interpretation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlashcard = async (item: any, index: number) => {
    setAddingIds(prev => new Set(prev).add(index));
    setError(null);
    try {
      await createFlashcard({
        source_word: item.source_word,
        translated_word: item.translated_word,
        native_language: item.native_language || nativeLanguage,
        source_language: item.source_language || "es"
      });
      setAddedIds(prev => new Set(prev).add(index));
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to add flashcard");
    } finally {
      setAddingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    setError(null);
    try {
      for (let i = 0; i < results.length; i++) {
        if (!addedIds.has(i)) {
          await createFlashcard({
            source_word: results[i].source_word,
            translated_word: results[i].translated_word,
            native_language: results[i].native_language || nativeLanguage,
            source_language: results[i].source_language || "es"
          });
          setAddedIds(prev => new Set(prev).add(i));
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to add all flashcards");
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="card">
      <h3>Interpret notebook text</h3>
      <p className="muted">Paste text or sentences from your notebook. We'll extract unique words and translate them.</p>
      <textarea
        rows={5}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste text here..."
      />
      <button onClick={handleInterpret} disabled={loading || !input}>
        {loading ? "Processing..." : "Interpret"}
      </button>
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <div className="results">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4>Suggested flashcards ({results.length})</h4>
            <button
              onClick={handleAddAll}
              disabled={addingAll || addedIds.size === results.length}
              style={{ fontSize: "0.9em", padding: "0.4em 0.8em" }}
            >
              {addingAll ? "Adding..." : `Add all (${results.length - addedIds.size})`}
            </button>
          </div>
          <ul>
            {results.map((item, idx) => (
              <li key={`${item.source_word}-${idx}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5em" }}>
                <span>
                  <strong>{item.source_word}</strong> → {item.translated_word} ({item.native_language})
                </span>
                <button
                  onClick={() => handleAddFlashcard(item, idx)}
                  disabled={addingIds.has(idx) || addedIds.has(idx)}
                  style={{ fontSize: "0.8em", padding: "0.3em 0.6em", marginLeft: "1em" }}
                >
                  {addingIds.has(idx) ? "..." : addedIds.has(idx) ? "✓ Added" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

