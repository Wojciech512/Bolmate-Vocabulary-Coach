import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import FlashcardForm from "../components/FlashcardForm";
import FlashcardList from "../components/FlashcardList";
import { fetchFlashcards } from "../api";
import { Flashcard } from "../types";

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const loadFlashcards = async () => {
    const res = await fetchFlashcards();
    setFlashcards(res.data);
  };

  useEffect(() => {
    loadFlashcards();
  }, []);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Your notebook
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add Spanish words with translations, then practice them.
        </Typography>
      </Box>
      <Stack spacing={2}>
        <FlashcardForm onCreated={loadFlashcards} />
        <FlashcardList flashcards={flashcards} onDeleted={loadFlashcards} />
      </Stack>
    </Box>
  );
}
