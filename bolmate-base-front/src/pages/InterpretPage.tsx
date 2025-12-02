import { Box, Typography } from "@mui/material";
import InterpretForm from "../components/InterpretForm";

export default function InterpretPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Extract & Learn (OCR & AI)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drop text or files to extract vocabulary and turn it into flashcards.
        </Typography>
      </Box>
      <InterpretForm />
    </Box>
  );
}
