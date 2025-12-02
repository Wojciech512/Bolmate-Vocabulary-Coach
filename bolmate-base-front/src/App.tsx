import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizPage from "./pages/QuizPage";
import InterpretPage from "./pages/InterpretPage";
import { useSnackbar } from "./context/SnackbarContext";
import { setGlobalErrorHandler } from "./api";

function App() {
  const { showError } = useSnackbar();

  useEffect(() => {
    setGlobalErrorHandler(showError);
  }, [showError]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/interpret" element={<InterpretPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
