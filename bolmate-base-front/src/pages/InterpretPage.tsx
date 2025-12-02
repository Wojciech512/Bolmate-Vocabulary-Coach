import { ChangeEvent, FormEvent, useContext, useState } from "react";
import api from "../api";
import { LanguageContext } from "../context/LanguageContext";
import { Flashcard } from "./FlashcardsPage";
import "../styles/interpret.css";

type InterpretResponse = {
  candidates: Flashcard[];
  job_id?: number;
};

function InterpretPage() {
  const { nativeLanguage } = useContext(LanguageContext);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("native_language", nativeLanguage);
        const response = await api.post<InterpretResponse>("/api/interpret", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCandidates(response.data.candidates);
      } else if (text.trim()) {
        const response = await api.post<InterpretResponse>("/api/interpret", {
          text,
          native_language: nativeLanguage,
        });
        setCandidates(response.data.candidates);
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage("Interpretation failed. Try simpler text.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (candidates.length === 0) return;
    setLoading(true);
    try {
      await api.post("/api/interpret/save", { flashcards: candidates });
      setMessage("Saved to flashcards!");
    } catch (err: unknown) {
      console.error(err);
      setMessage("Could not save flashcards.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="interpret">
      <header>
        <div>
          <h2>Interpret</h2>
          <p>Upload notebook photos, PDFs, or paste text to turn into flashcards.</p>
        </div>
      </header>

      <form className="card" onSubmit={submit}>
        <label>
          Paste text
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="hola\nadiós"
            rows={4}
          />
        </label>
        <label>
          Or upload file (jpg/png/pdf)
          <input type="file" onChange={handleFile} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Interpret"}
        </button>
        {message && <p className="info">{message}</p>}
      </form>

      {candidates.length > 0 && (
        <div className="card">
          <div className="list-header">
            <h3>Detected words</h3>
            <button type="button" onClick={save} disabled={loading}>
              Save as flashcards
            </button>
          </div>
          <ul className="flashcard-list">
            {candidates.map((c) => (
              <li key={c.source_word}>
                <strong>{c.source_word}</strong> → {c.translated_word}
                {c.example_sentence && (
                  <div className="example">
                    {c.example_sentence}
                    {c.example_sentence_translated && <span> / {c.example_sentence_translated}</span>}
                  </div>
                )}
                {c.difficulty_level && <small>Level: {c.difficulty_level}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default InterpretPage;

