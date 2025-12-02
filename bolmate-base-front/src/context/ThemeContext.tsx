import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = useMemo(() => {
    const newTheme = createTheme({
      palette: {
        mode: darkMode ? "dark" : "light",
        primary: {
          main: darkMode ? "#5c9cff" : "#2568ef",
        },
        secondary: {
          main: darkMode ? "#7c9de8" : "#1f3892",
        },
        background: {
          default: darkMode ? "#121212" : "#f7f7f9",
          paper: darkMode ? "#1e1e1e" : "#ffffff",
        },
      },
      typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      },
    });
    return responsiveFontSizes(newTheme);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
