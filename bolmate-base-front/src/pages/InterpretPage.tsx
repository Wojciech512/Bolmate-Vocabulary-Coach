import { FormEvent, useState } from "react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";
import "../styles/interpret.css";

interface Candidate {
  source_word: string;
  source_language: string;
  translated_word: string;
  native_language: string;
}

function InterpretPage() {
  const { nativeLanguage } = useLanguage();
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInterpret = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post<{ candidates: Candidate[] }>("/interpret", {
        text,
        native_language: nativeLanguage,
        source_language: "es",
      });
      setCandidates(res.data.candidates);
      setMessage(`Found ${res.data.candidates.length} words`);
    } catch (err: any) {
      setMessage(err?.response?.data?.error || "Could not interpret text");
    } finally {
      setLoading(false);
    }
  };

  const saveCandidate = async (candidate: Candidate) => {
    await api.post("/flashcards", { ...candidate, is_manual: false });
    setMessage(`Saved ${candidate.source_word}`);
  };

  const saveAll = async () => {
    for (const candidate of candidates) {
      await api.post("/flashcards", { ...candidate, is_manual: false });
    }
    setMessage(`Saved ${candidates.length} flashcards`);
  };

  return (
    <section className="interpret">
      <header>
        <div>
          <h2>Interpret / OCR</h2>
          <p>Paste raw text from your notes or use the backend OCR endpoint via file upload.</p>
        </div>
      </header>

      <form className="interpret-form" onSubmit={handleInterpret}>
        <label>
          Raw text or lines of words
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="hola\ncasa\ngato"
          />
        </label>
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? "Interpreting..." : "Interpret"}
        </button>
      </form>
      {message && <p className="muted">{message}</p>}

      {candidates.length > 0 && (
        <div className="candidates">
          <div className="candidates-header">
            <h3>Suggested flashcards</h3>
            <button className="button secondary" onClick={saveAll}>
              Save all
            </button>
          </div>
          <ul>
            {candidates.map((c) => (
              <li key={`${c.source_word}-${c.native_language}`}>
                <div>
                  <strong>{c.source_word}</strong> → {c.translated_word} ({c.source_language} →
                  {c.native_language})
                </div>
                <button className="link" onClick={() => saveCandidate(c)}>
                  Save
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default InterpretPage;
