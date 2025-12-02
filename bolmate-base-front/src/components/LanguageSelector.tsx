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
        setStatus(
          `Przetłumaczono ${response.meta.translated_count} fiszek (pominięto ${response.meta.skipped_count}).`,
        );
      }
    } catch (error) {
      console.error("Language switch failed", error);
      setStatus("Nie udało się przełączyć języka. Spróbuj ponownie.");
      setSelected(nativeLanguage);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <LanguageIcon color="action" />
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel id="language-selector-label">Język docelowy</InputLabel>
        <Select
          labelId="language-selector-label"
          label="Język docelowy"
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
        <Tooltip title="Ostatnia synchronizacja fiszek">
          <Typography variant="caption" color="text.secondary">
            {status}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
};

export default LanguageSelector;
