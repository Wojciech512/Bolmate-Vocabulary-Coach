import { FormEvent, useContext, useEffect, useState } from "react";
import api from "../api";
import { LanguageContext } from "../context/LanguageContext";
import { Flashcard } from "./FlashcardsPage";
import "../styles/quiz.css";

type CheckResponse = {
  correct: boolean;
  correctAnswer: string;
  flashcard: Flashcard;
  hint?: string;
  example_sentence?: string;
  example_sentence_translated?: string;
};

function QuizPage() {
  const { nativeLanguage } = useContext(LanguageContext);
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = async () => {
    setLoading(true);
    setResult(null);
    setAnswer("");
    try {
      const response = await api.get<{ flashcard: Flashcard }>("/api/quiz");
      setFlashcard(response.data.flashcard);
    } catch (err: unknown) {
      console.error(err);
      setError("No flashcards available yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const submitAnswer = async (event: FormEvent) => {
    event.preventDefault();
    if (!flashcard) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<CheckResponse>("/api/quiz", {
        flashcard_id: flashcard.id,
        answer,
        native_language: nativeLanguage,
      });
      setResult(response.data);
    } catch (err: unknown) {
      console.error(err);
      setError("Could not check answer.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.post<{ questions: any[] }>("/api/quiz/generate", {
        num_questions: 3,
        native_language: nativeLanguage,
      });
      alert("AI quiz generated:\n" + JSON.stringify(response.data.questions, null, 2));
    } catch (err: unknown) {
      console.error(err);
      setError("AI quiz generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quiz">
      <header>
        <div>
          <h2>Quiz</h2>
          <p>Answer the translation of each Spanish word. Stats update automatically.</p>
        </div>
        <button type="button" onClick={generateQuiz} disabled={loading}>
          Generate AI quiz
        </button>
      </header>

      <div className="card">
        {!flashcard && !error && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {flashcard && (
          <form onSubmit={submitAnswer}>
            <div className="question">{flashcard.source_word}</div>
            <label>
              Translation ({nativeLanguage})
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="type your answer" />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Check"}
            </button>
          </form>
        )}
        {result && (
          <div className={`feedback ${result.correct ? "correct" : "incorrect"}`}>
            {result.correct ? "Correct!" : "Incorrect."} Correct answer: {result.correctAnswer}
            {result.example_sentence && (
              <div className="example">
                {result.example_sentence}
                {result.example_sentence_translated && <span> / {result.example_sentence_translated}</span>}
              </div>
            )}
            {result.hint && <p className="hint">Hint: {result.hint}</p>}
            <button type="button" onClick={loadQuestion} disabled={loading}>
              Next word
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default QuizPage;

