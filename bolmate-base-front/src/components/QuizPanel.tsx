import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  getQuizQuestion,
  submitQuizAnswer,
  type QuizQuestion,
  type QuizAnswerResponse,
} from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function QuizPanel() {
  const { nativeLanguage } = useLanguage();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hint, setHint] = useState<Pick<
    QuizAnswerResponse,
    "hint" | "example_sentence" | "example_translation"
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);

  const loadQuestion = async () => {
    setFeedback(null);
    setHint(null);
    setAnswer("");
    try {
      const res = await getQuizQuestion(reverseMode, nativeLanguage);
      setQuestion(res.data);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setFeedback(errorMessage || "No questions available");
      setQuestion(null);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [reverseMode, nativeLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    try {
      const res = await submitQuizAnswer({
        flashcard_id: question.flashcard_id,
        answer,
      });
      setFeedback(
        res.data.correct
          ? "Correct!"
          : `Incorrect. Correct answer: ${res.data.correctAnswer}`,
      );
      setHint({
        hint: res.data.hint,
        example_sentence: res.data.example_sentence,
        example_translation: res.data.example_translation,
      });
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setFeedback(errorMessage || "Failed to submit answer");
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
        <FormControlLabel
          control={
            <Switch
              checked={reverseMode}
              onChange={(e) => setReverseMode(e.target.checked)}
            />
          }
          label="Reverse mode (native → target)"
        />
        {!question && (
          <Typography variant="body2" color="text.secondary">
            Loading question...
          </Typography>
        )}
        {question && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Translate from{" "}
                {reverseMode ? question.native_language : question.source_language} to{" "}
                {reverseMode ? question.source_language : question.native_language}.
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
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 140 }}
              >
                {loading ? "Checking..." : "Check"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={loadQuestion}
                sx={{ minWidth: 140 }}
              >
                Next word
              </Button>
            </Stack>
          </Box>
        )}

        {feedback && (
          <Alert
            severity={feedback.startsWith("Correct") ? "success" : "warning"}
            sx={{ mt: 2 }}
          >
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
