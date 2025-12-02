import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { interpretText, createFlashcard, type InterpretedItem } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { useSnackbar } from "../context/SnackbarContext";

export default function InterpretForm() {
  const { nativeLanguage } = useLanguage();
  const { showSuccess } = useSnackbar();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<InterpretedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);
    setAddedIds(new Set());
    try {
      const res = await interpretText(input, nativeLanguage);
      setResults(res.data.items || []);
      showSuccess(`Interpreted ${res.data.items?.length || 0} words successfully`);
    } catch {
      // Error is handled by global interceptor
      setError("Interpretation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlashcard = async (item: InterpretedItem, index: number) => {
    setAddingIds((prev) => new Set(prev).add(index));
    setError(null);
    try {
      await createFlashcard({
        source_word: item.source_word,
        translated_word: item.translated_word,
        native_language: item.native_language || nativeLanguage,
        source_language: item.source_language || "es",
      });
      setAddedIds((prev) => new Set(prev).add(index));
      showSuccess("Flashcard added successfully");
    } catch {
      // Error is handled by global interceptor
      setError("Failed to add flashcard");
    } finally {
      setAddingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    setError(null);
    try {
      const toAdd = results.filter((_, i) => !addedIds.has(i));
      for (let i = 0; i < results.length; i++) {
        if (!addedIds.has(i)) {
          await createFlashcard({
            source_word: results[i].source_word,
            translated_word: results[i].translated_word,
            native_language: results[i].native_language || nativeLanguage,
            source_language: results[i].source_language || "es",
          });
          setAddedIds((prev) => new Set(prev).add(i));
        }
      }
      showSuccess(`Added ${toAdd.length} flashcards successfully`);
    } catch {
      // Error is handled by global interceptor
      setError("Failed to add all flashcards");
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Interpret notebook text</Typography>
            <Typography variant="body2" color="text.secondary">
              Paste text or sentences from your notebook. We&#39;ll extract unique words
              and and translate them.
            </Typography>
          </Box>

          <TextField
            multiline
            minRows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text here..."
            label="Notebook text"
            fullWidth
          />

          <Stack direction="row" spacing={1} justifyContent="flex-start">
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              onClick={handleInterpret}
              disabled={loading || !input}
            >
              {loading ? "Processing..." : "Interpret"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAll}
              disabled={
                addingAll || results.length === 0 || addedIds.size === results.length
              }
            >
              {addingAll
                ? "Adding..."
                : `Add all (${Math.max(results.length - addedIds.size, 0)})`}
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}

          {results.length > 0 && (
            <Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Suggested flashcards ({results.length})
              </Typography>
              <List dense>
                {results.map((item, idx) => {
                  const isSameLanguage = item.source_language === nativeLanguage;
                  return (
                    <ListItem
                      key={`${item.source_word}-${idx}`}
                      divider
                      secondaryAction={
                        <Button
                          size="small"
                          variant={addedIds.has(idx) ? "outlined" : "contained"}
                          color={addedIds.has(idx) ? "success" : "primary"}
                          onClick={() => handleAddFlashcard(item, idx)}
                          disabled={addingIds.has(idx) || addedIds.has(idx)}
                        >
                          {addingIds.has(idx)
                            ? "Adding..."
                            : addedIds.has(idx)
                              ? "Added"
                              : "Add"}
                        </Button>
                      }
                      sx={{
                        bgcolor: isSameLanguage ? "warning.50" : "transparent",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box>
                            {`${item.source_word} → ${item.translated_word} (${item.native_language || nativeLanguage})`}
                            {isSameLanguage && (
                              <Typography
                                component="span"
                                variant="caption"
                                color="warning.main"
                                sx={{ ml: 1, fontWeight: 600 }}
                              >
                                ⚠ Same as target language
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          item.example_sentence
                            ? `${item.example_sentence}${
                                item.example_sentence_translated
                                  ? ` — ${item.example_sentence_translated}`
                                  : ""
                              }`
                            : undefined
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
