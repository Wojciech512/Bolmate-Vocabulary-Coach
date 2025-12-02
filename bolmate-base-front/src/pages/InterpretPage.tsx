import InterpretForm from "../components/InterpretForm";

export default function InterpretPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Interpret (OCR & AI)</h2>
          <p className="muted">Drop text to extract vocabulary and turn it into flashcards.</p>
        </div>
      </div>
      <InterpretForm />
    </div>
  );
}

