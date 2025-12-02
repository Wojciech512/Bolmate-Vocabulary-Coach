import { Box, Typography } from "@mui/material";
import QuizPanel from "../components/QuizPanel";

export default function QuizPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Daily quiz
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Translate one word at a time, track your progress, and get AI hints.
        </Typography>
      </Box>
      <QuizPanel />
    </Box>
  );
}
