import {
  Alert,
  Card,
  CardActions,
  CardContent,
  Stack,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState, useEffect } from "react";
import { createFlashcard, fetchLanguages, type Language } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { useLoading } from "../context/LoadingContext";
import { useSnackbar } from "../context/SnackbarContext";
import LanguageIcon from "@mui/icons-material/Language";
import { StyledButton } from "./ui";

type Props = {
  onCreated: () => void;
};

export default function FlashcardForm({ onCreated }: Props) {
  const { nativeLanguage } = useLanguage();
  const { withLoading } = useLoading();
  const { showSuccess } = useSnackbar();
  const [sourceWord, setSourceWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("es");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    fetchLanguages()
      .then((res) => setLanguages(res.data.languages))
      .catch(() => setLanguages([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWord || !translation) {
      setError("Spanish word and translation are required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await withLoading(async () => {
        await createFlashcard({
          source_word: sourceWord,
          translated_word: translation,
          source_language: sourceLanguage,
          native_language: nativeLanguage,
        });
      });
      setSourceWord("");
      setTranslation("");
      showSuccess("Flashcard created successfully");
      onCreated();
    } catch {
      // Error is handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  const hasFieldError = Boolean(error);
  const isSameLanguage = sourceLanguage === nativeLanguage;

  return (
    <Card variant="outlined" sx={{ mb: 3 }} component="form" onSubmit={handleSubmit}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add a new word
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              label="Source word"
              value={sourceWord}
              onChange={(e) => setSourceWord(e.target.value)}
              required
              error={hasFieldError && !sourceWord}
              helperText={hasFieldError && !sourceWord ? "Source word is required" : ""}
              sx={{ flex: 1 }}
            />
            <LanguageIcon color="action" />
            <FormControl sx={{ width: "150px" }} error={isSameLanguage}>
              <InputLabel id="source-language-label">Source language</InputLabel>
              <Select
                labelId="source-language-label"
                label="Source language"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.label} ({lang.code.toUpperCase()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {isSameLanguage && (
            <Alert severity="warning" variant="outlined">
              Warning: Source language is the same as target language (
              {nativeLanguage.toUpperCase()}). You may be translating to the same
              language.
            </Alert>
          )}
          <TextField
            label={`Translation (${nativeLanguage.toUpperCase()})`}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
            error={hasFieldError && !translation}
            helperText={hasFieldError && !translation ? "Translation is required" : ""}
          />

          {error && sourceWord && translation && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 3 }}>
        <StyledButton type="submit" variant="primary" disabled={loading} fullWidth>
          {loading ? "Saving..." : "Save word"}
        </StyledButton>
      </CardActions>
    </Card>
  );
}
