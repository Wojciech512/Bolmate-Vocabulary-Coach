import LanguageIcon from "@mui/icons-material/Language";
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const LanguageSelector = () => {
  const { nativeLanguage, languages, isSwitching, switchToLanguage } = useLanguage();
  const [selected, setSelected] = useState(nativeLanguage);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSelected(nativeLanguage);
  }, [nativeLanguage]);

  const options = useMemo(() => languages || [], [languages]);

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    setSelected(newLang);
    setStatus(null);
    try {
      const response = await switchToLanguage(newLang);
      if (response) {
        if (response.meta.translated_count === 0 && response.meta.skipped_count === 0) {
          setStatus("Language switched. No flashcards to translate yet.");
        } else {
          setStatus(
            `Translated ${response.meta.translated_count} flashcard${response.meta.translated_count !== 1 ? 's' : ''} (skipped ${response.meta.skipped_count}).`,
          );
        }
      } else {
        // Language was already selected or no change needed
        setStatus("Language updated.");
      }
    } catch (error: any) {
      console.error("Language switch failed", error);
      const errorMsg = error?.response?.data?.error;
      if (errorMsg && errorMsg.includes("No flashcards")) {
        setStatus("Language switched. Add flashcards to translate them.");
        // Still update the language even if no flashcards exist
        return;
      }
      setStatus("Failed to switch language. Please try again.");
      setSelected(nativeLanguage);
    }
  };

  return (
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
      {status && (
        <Tooltip title="Last flashcard synchronization">
          <Typography variant="caption" color="text.secondary">
            {status}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
};

export default LanguageSelector;
