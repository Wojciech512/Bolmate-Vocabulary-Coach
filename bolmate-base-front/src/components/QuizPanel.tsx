import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  getQuizQuestion,
  submitQuizAnswer,
  type QuizQuestion,
  type QuizAnswerResponse,
} from "../api";
import { useLanguage } from "../context/LanguageContext";
import { StyledButton } from "./ui";
import StreakProgressBar from "./StreakProgressBar";
import { triggerConfetti } from "../utils/confetti";

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
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState("");
  const [streak, setStreak] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  const loadQuestion = async () => {
    setFeedback(null);
    setHint(null);
    setAnswer("");
    setLastSubmittedAnswer("");
    setIsCorrect(false);
    setLoadingQuestion(true);
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
    } finally {
      setLoadingQuestion(false);
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
      const res = await submitQuizAnswer(
        {
          flashcard_id: question.flashcard_id,
          answer,
        },
        reverseMode,
      );
      setLastSubmittedAnswer(answer);

      if (res.data.correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setFeedback("Correct!");
        setIsCorrect(true);

        // Trigger confetti at milestones
        if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
          triggerConfetti(newStreak);
        }
      } else {
        setStreak(0);
        setFeedback(`Incorrect. Correct answer: ${res.data.correctAnswer}`);
        setIsCorrect(false);
      }

      setHint({
        hint: res.data.hint,
        example_sentence: res.data.example_sentence,
        example_translation: res.data.example_translation,
      });
    } catch {
      setFeedback("Failed to submit answer");
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
          label="Reverse mode (target → native)."
        />
        {loadingQuestion && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {!question && !loadingQuestion && !feedback && (
          <Typography variant="body2" color="text.secondary">
            No questions available
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
                {reverseMode
                  ? question.native_language.toUpperCase()
                  : question.source_language.toUpperCase()}{" "}
                to{" "}
                {reverseMode
                  ? question.source_language.toUpperCase()
                  : question.native_language.toUpperCase()}
                .
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {question.source_word}
              </Typography>
            </Box>
            <StreakProgressBar streak={streak} maxStreak={10} />
            <TextField
              placeholder="Your translation"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              label="Answer"
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Tooltip
                title={
                  isCorrect
                    ? "Let's go next!"
                    : feedback && answer === lastSubmittedAnswer
                      ? "Change your answer to check again"
                      : ""
                }
                arrow
              >
                <span>
                  <StyledButton
                    type="submit"
                    variant="primary"
                    disabled={
                      loading ||
                      isCorrect ||
                      (feedback !== null && answer === lastSubmittedAnswer)
                    }
                    sx={{ minWidth: 140 }}
                  >
                    {loading ? "Checking..." : "Check"}
                  </StyledButton>
                </span>
              </Tooltip>
              <StyledButton
                variant="outlined"
                onClick={loadQuestion}
                sx={{ minWidth: 140 }}
              >
                Next word
              </StyledButton>
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
