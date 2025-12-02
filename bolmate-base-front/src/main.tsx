import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";

let theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2568ef",
    },
    secondary: {
      main: "#1f3892",
    },
    background: {
      default: "#f7f7f9",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

theme = responsiveFontSizes(theme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
