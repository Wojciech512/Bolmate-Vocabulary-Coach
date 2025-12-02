import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SnackbarProvider } from "./context/SnackbarContext";
import { LoadingProvider } from "./context/LoadingContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <SnackbarProvider>
        <LoadingProvider>
          <BrowserRouter>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </BrowserRouter>
        </LoadingProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
