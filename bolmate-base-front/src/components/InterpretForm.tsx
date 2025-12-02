import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from "@mui/material";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  interpretText,
  interpretFile,
  createFlashcard,
  type InterpretedItem,
} from "../api";
import { useLanguage } from "../context/LanguageContext";
import { useSnackbar } from "../context/SnackbarContext";

type InputMode = "text" | "file";

export default function InterpretForm() {
  const { nativeLanguage } = useLanguage();
  const { showSuccess } = useSnackbar();
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<InterpretedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "text/plain": [".txt"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    multiple: true,
  });

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);
    setAddedIds(new Set());
    try {
      if (inputMode === "text") {
        const res = await interpretText(input, nativeLanguage);
        setResults(res.data.items || []);
        showSuccess(`Interpreted ${res.data.items?.length || 0} words successfully`);
      } else {
        if (uploadedFiles.length === 0) {
          setError("Please upload at least one file");
          return;
        }
        const res = await interpretFile(uploadedFiles, nativeLanguage);
        setResults(res.data.items || []);
        showSuccess(
          `Interpreted ${res.data.items?.length || 0} words from ${uploadedFiles.length} file(s)`,
        );
      }
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
              Paste text or upload files (.pdf, .docx, .txt, .png, .jpg). We&#39;ll
              extract unique words, detect existing translations, and create flashcards.
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={(_, value) => {
              if (value !== null) {
                setInputMode(value);
                setError(null);
                setResults([]);
                setAddedIds(new Set());
              }
            }}
            aria-label="input mode"
            fullWidth
          >
            <ToggleButton value="text" aria-label="text input">
              <TextFieldsIcon sx={{ mr: 1 }} />
              Text Input
            </ToggleButton>
            <ToggleButton value="file" aria-label="file upload">
              <UploadFileIcon sx={{ mr: 1 }} />
              File Upload
            </ToggleButton>
          </ToggleButtonGroup>

          {inputMode === "text" ? (
            <TextField
              multiline
              minRows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text here... (supports existing translations like 'si - yes', 'yo - ich')"
              label="Notebook text"
              fullWidth
            />
          ) : (
            <Paper
              {...getRootProps()}
              sx={{
                p: 3,
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "divider",
                bgcolor: isDragActive ? "action.hover" : "background.paper",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              <input {...getInputProps()} />
              <Stack spacing={2} alignItems="center">
                <CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                <Typography variant="body1" align="center">
                  {isDragActive
                    ? "Drop files here..."
                    : "Drag & drop files here, or click to select"}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Supported formats: PDF, DOCX, TXT, PNG, JPG
                </Typography>
                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected files ({uploadedFiles.length}):
                    </Typography>
                    <List dense>
                      {uploadedFiles.map((file, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}

          <Stack direction="row" spacing={1} justifyContent="flex-start">
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
              onClick={handleInterpret}
              disabled={
                loading || (inputMode === "text" ? !input : uploadedFiles.length === 0)
              }
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
