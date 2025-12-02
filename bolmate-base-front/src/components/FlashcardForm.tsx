import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { createFlashcard } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  onCreated: () => void;
};

export default function FlashcardForm({ onCreated }: Props) {
  const { nativeLanguage } = useLanguage();
  const [sourceWord, setSourceWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWord || !translation) {
      setError("Spanish word and translation are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createFlashcard({
        source_word: sourceWord,
        translated_word: translation,
        source_language: sourceLanguage,
        native_language: nativeLanguage,
      });
      setSourceWord("");
      setTranslation("");
      onCreated();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(errorMessage || "Failed to save word");
    } finally {
      setLoading(false);
    }
  };

  const hasFieldError = Boolean(error);

  return (
    <Card variant="outlined" sx={{ mb: 3 }} component="form" onSubmit={handleSubmit}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add a new word
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Spanish / Source word"
            value={sourceWord}
            onChange={(e) => setSourceWord(e.target.value)}
            required
            error={hasFieldError && !sourceWord}
            helperText={hasFieldError && !sourceWord ? "Spanish word is required" : ""}
          />
          <TextField
            label={`Translation (${nativeLanguage.toUpperCase()})`}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
            error={hasFieldError && !translation}
            helperText={hasFieldError && !translation ? "Translation is required" : ""}
          />
          <TextField
            label="Source language"
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
          />
          {error && sourceWord && translation && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 3 }}>
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? "Saving..." : "Save word"}
        </Button>
      </CardActions>
    </Card>
  );
}
