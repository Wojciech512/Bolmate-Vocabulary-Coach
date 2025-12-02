import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json"
  }
});

export type CreateFlashcardInput = {
  source_word: string;
  translated_word: string;
  native_language?: string;
  source_language?: string;
};

// TODO selektor języka na który mają być wykonywane tłumaczenia - przy zmianie języka w aplikacji wszystkie obecne fiszki zostają przetłumaczone na wybrany język
// TODO opisy aplikacji że jest uniwersalna dla każdego języka
// TODO interpretowanie danych z plików tekstowych (.pdf, .docx itd.), zdjęciowych w Interpret (OCR & AI)
// TODO skopiowanie szaty graficznej https://bolmate.nl/
// TODO quiz w postaci obracanych kart (animacje)
// TODO logo "Bolmate - Language tutor"
// TODO testy
// TODO responsywność
export const fetchFlashcards = () => api.get("/api/flashcards");
export const createFlashcard = (data: CreateFlashcardInput) => api.post("/api/flashcards", data);
export const deleteFlashcard = (id: number) => api.delete(`/api/flashcards/${id}`);
export const submitQuizAnswer = (payload: { flashcard_id: number; answer: string }) =>
  api.post("/api/quiz", payload);
export const getQuizQuestion = () => api.get("/api/quiz");
export const generateQuiz = (payload: any) => api.post("/api/quiz/generate", payload);
export const interpretText = (text: string, native_language: string) =>
  api.post("/api/interpret", { text, native_language });
export const fetchLanguages = () => api.get("/api/languages");

export default api;
