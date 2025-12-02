import QuizPanel from "../components/QuizPanel";

export default function QuizPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Daily quiz</h2>
          <p className="muted">Translate one word at a time, track your progress, and get AI hints.</p>
        </div>
      </div>
      <QuizPanel />
    </div>
  );
}

