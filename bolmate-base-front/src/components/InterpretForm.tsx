import { useState } from "react";
import { interpretText } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function InterpretForm() {
  const { nativeLanguage } = useLanguage();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interpretText(input, nativeLanguage);
      setResults(res.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Interpretation failed");
    } finally {
      setLoading(false);
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
          <h4>Suggested flashcards</h4>
          <ul>
            {results.map((item, idx) => (
              <li key={`${item.source_word}-${idx}`}>
                <strong>{item.source_word}</strong> → {item.translated_word} ({item.native_language})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

