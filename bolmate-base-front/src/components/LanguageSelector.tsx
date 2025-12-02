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
  Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const LanguageSelector = () => {
  const { nativeLanguage, languages, isSwitching, switchToLanguage } = useLanguage();
  const [selected, setSelected] = useState(nativeLanguage);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });

  useEffect(() => {
    setSelected(nativeLanguage);
  }, [nativeLanguage]);

  const options = useMemo(() => languages || [], [languages]);

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    setSelected(newLang);
    setSnackbar({ open: false, message: "", severity: "info" });

    try {
      await switchToLanguage(newLang);
      setSnackbar({
        open: true,
        message: `Target language changed to ${languages.find((l) => l.code === newLang)?.label || newLang}.`,
        severity: "success",
      });
    } catch (error: any) {
      console.error("Language switch failed", error);
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

        <Tooltip
          open={tooltipOpen && !selectOpen}
          title="The language used for translations and questions."
          placement="bottom-start"
          slotProps={{
            tooltip: {
              sx: { mt: 1, fontSize: "0.8rem", maxWidth: 260 },
            },
          }}
        >
          <FormControl
            size="small"
            sx={{ minWidth: 170, position: "relative" }}
            onMouseEnter={() => !selectOpen && setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
          >
            <InputLabel id="language-selector-label">Target Language</InputLabel>
            <Select
              labelId="language-selector-label"
              label="Target Language"
              value={selected}
              disabled={!options.length || isSwitching}
              onChange={handleChange}
              onOpen={() => {
                setSelectOpen(true);
                setTooltipOpen(false);
              }}
              onClose={() => setSelectOpen(false)}
              IconComponent={isSwitching ? () => null : undefined}
              endAdornment={
                isSwitching ? (
                  <CircularProgress
                    size={20}
                    thickness={5}
                    sx={{
                      position: "absolute",
                      right: 14,
                      pointerEvents: "none",
                    }}
                  />
                ) : null
              }
              sx={{
                "& .MuiSelect-select": {
                  pr: isSwitching ? "48px !important" : undefined,
                },
              }}
            >
              {options.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.label} ({lang.code.toUpperCase()})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LanguageSelector;
