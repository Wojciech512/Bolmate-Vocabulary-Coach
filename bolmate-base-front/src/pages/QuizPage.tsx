import { FormEvent, useEffect, useState } from "react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";
import "../styles/quiz.css";

interface QuizCard {
  flashcard_id: number;
  source_word: string;
  source_language: string;
  translated_word: string;
  native_language: string;
  example_sentence?: string;
  example_sentence_translated?: string;
}

interface QuizResult {
  correct: boolean;
  submitted: string;
  correct_answer: string;
  hint?: string;
  example_sentence?: string;
  example_sentence_translated?: string;
}

function QuizPage() {
  const { nativeLanguage } = useLanguage();
  const [question, setQuestion] = useState<QuizCard | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = async () => {
    setError(null);
    setResult(null);
    setAnswer("");
    try {
      const res = await api.get<QuizCard>("/quiz", {
        params: { native_language: nativeLanguage },
      });
      setQuestion(res.data);
    } catch (err: any) {
      setQuestion(null);
      setError(err?.response?.data?.error || "No flashcards available yet.");
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [nativeLanguage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<QuizResult>("/quiz", {
        flashcard_id: question.flashcard_id,
        answer,
        native_language: nativeLanguage,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not check answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quiz">
      <header>
        <div>
          <h2>Quiz</h2>
          <p>Type the translation for the Spanish word shown. Case-insensitive.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {question && (
        <div className="quiz-card">
          <div className="question">{question.source_word}</div>
          <form onSubmit={handleSubmit} className="quiz-form">
            <input
              placeholder={`Translation (${nativeLanguage})`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Checking..." : "Check"}
            </button>
          </form>
          {result && (
            <div className={`quiz-result ${result.correct ? "correct" : "incorrect"}`}>
              {result.correct ? "Correct!" : "Not quite."} Correct answer: {result.correct_answer}
              {result.hint && <div className="muted">{result.hint}</div>}
              {result.example_sentence && (
                <div className="muted small">
                  {result.example_sentence} — {result.example_sentence_translated}
                </div>
              )}
            </div>
          )}
          <div className="quiz-actions">
            <button className="button" onClick={loadQuestion}>
              Next word
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default QuizPage;
