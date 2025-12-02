import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
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
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quiz
        </Typography>
        {!question && (
          <Typography variant="body2" color="text.secondary">
            Loading question...
          </Typography>
        )}
        {question && (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Translate this word
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {question.source_word}
              </Typography>
            </Box>
            <TextField
              placeholder="Your translation"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              label="Answer"
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 140 }}>
                {loading ? "Checking..." : "Check"}
              </Button>
              <Button variant="outlined" color="secondary" onClick={loadQuestion} sx={{ minWidth: 140 }}>
                Next word
              </Button>
            </Stack>
          </Box>
        )}

        {feedback && (
          <Alert severity={feedback.startsWith("Correct") ? "success" : "warning"} sx={{ mt: 2 }}>
            {feedback}
          </Alert>
        )}

        {hint && (hint.hint || hint.example_sentence) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "primary.50", borderRadius: 2 }}>
            {hint.hint && (
              <Typography gutterBottom>
                <strong>Hint:</strong> {hint.hint}
              </Typography>
            )}
            {hint.example_sentence && (
              <Typography variant="body2" color="text.secondary">
                <strong>Example:</strong> {hint.example_sentence}
                {hint.example_translation && ` — ${hint.example_translation}`}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

