import { useEffect, useState } from "react";
import { getQuizQuestion, submitQuizAnswer } from "../api";

type QuizState = {
  flashcard_id: number;
  source_word: string;
  translated_word: string;
};

export default function QuizPanel() {
  const [question, setQuestion] = useState<QuizState | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hint, setHint] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadQuestion = async () => {
    setFeedback(null);
    setHint(null);
    setAnswer("");
    try {
      const res = await getQuizQuestion();
      setQuestion(res.data);
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || "No questions available");
    }
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    try {
      const res = await submitQuizAnswer({ flashcard_id: question.flashcard_id, answer });
      setFeedback(res.data.correct ? "Correct!" : `Incorrect. Correct answer: ${res.data.correctAnswer}`);
      setHint({
        hint: res.data.hint,
        example_sentence: res.data.example_sentence,
        example_translation: res.data.example_translation,
      });
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Quiz</h3>
      {!question && <p className="muted">Loading question...</p>}
      {question && (
        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="question">
            <div className="muted">Translate this word</div>
            <div className="big">{question.source_word}</div>
          </div>
          <input
            placeholder="Your translation"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? "Checking..." : "Check"}</button>
            <button type="button" className="secondary" onClick={loadQuestion}>Next word</button>
          </div>
        </form>
      )}
      {feedback && <p className="feedback">{feedback}</p>}
      {hint && (hint.hint || hint.example_sentence) && (
        <div className="hint-box">
          {hint.hint && <p><strong>Hint:</strong> {hint.hint}</p>}
          {hint.example_sentence && (
            <p>
              <strong>Example:</strong> {hint.example_sentence}
              {hint.example_translation && <span className="muted"> — {hint.example_translation}</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

