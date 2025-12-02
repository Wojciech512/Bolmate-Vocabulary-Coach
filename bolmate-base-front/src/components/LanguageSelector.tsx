import LanguageIcon from "@mui/icons-material/Language";
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Alert,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const LanguageSelector = () => {
  const { nativeLanguage, languages, isSwitching, switchToLanguage } = useLanguage();
  const [selected, setSelected] = useState(nativeLanguage);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  useEffect(() => {
    setSelected(nativeLanguage);
  }, [nativeLanguage]);

  const options = useMemo(() => languages || [], [languages]);

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    setSelected(newLang);
    setSnackbar({ open: false, message: "", severity: "info" });
    try {
      const response = await switchToLanguage(newLang);
      if (response) {
        if (response.meta.translated_count === 0 && response.meta.skipped_count === 0) {
          setSnackbar({
            open: true,
            message: "Language switched. No flashcards to translate yet.",
            severity: "info",
          });
        } else {
          setSnackbar({
            open: true,
            message: `Translated ${response.meta.translated_count} flashcard${response.meta.translated_count !== 1 ? 's' : ''} (skipped ${response.meta.skipped_count}).`,
            severity: "success",
          });
        }
      } else {
        // Language was already selected or no change needed
        setSnackbar({
          open: true,
          message: "Language updated.",
          severity: "info",
        });
      }
    } catch (error: any) {
      console.error("Language switch failed", error);
      const errorMsg = error?.response?.data?.error;
      if (errorMsg && errorMsg.includes("No flashcards")) {
        setSnackbar({
          open: true,
          message: "Language switched. Add flashcards to translate them.",
          severity: "info",
        });
        // Still update the language even if no flashcards exist
        return;
      }
      setSnackbar({
        open: true,
        message: "Failed to switch language. Please try again.",
        severity: "error",
      });
      setSelected(nativeLanguage);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <LanguageIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="language-selector-label">Target Language</InputLabel>
          <Select
            labelId="language-selector-label"
            label="Target Language"
            value={selected}
            disabled={!options.length || isSwitching}
            onChange={handleChange}
          >
            {options.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.label} ({lang.code.toUpperCase()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isSwitching && <CircularProgress size={20} thickness={5} />}
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LanguageSelector;
