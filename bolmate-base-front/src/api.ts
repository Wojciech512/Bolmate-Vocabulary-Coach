import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ============= Request Types =============

export type CreateFlashcardInput = {
  source_word: string;
  translated_word: string;
  native_language?: string;
  source_language?: string;
  is_manual?: boolean;
  difficulty_level?: string;
  example_sentence?: string;
  example_sentence_translated?: string;
};

export type GenerateQuizPayload = {
  num_questions?: number;
  source_language?: string;
  difficulty_level?: string;
};

export type SubmitQuizAnswerPayload = {
  flashcard_id: number;
  answer: string;
};

export type InterpretTextPayload = {
  text: string;
  native_language: string;
};

// ============= Response Types =============

export type Flashcard = {
  id: number;
  source_word: string;
  source_language: string;
  translated_word: string;
  native_language: string;
  example_sentence: string | null;
  example_sentence_translated: string | null;
  difficulty_level: string | null;
  is_manual: boolean;
  correct_count: number;
  incorrect_count: number;
  created_at: string | null;
};

export type QuizQuestion = {
  flashcard_id: number;
  source_word: string;
  source_language: string;
  native_language: string;
  translated_word: string;
  correct_count: number;
  incorrect_count: number;
};

export type QuizAnswerResponse = {
  correct: boolean;
  correctAnswer: string;
  stats: {
    correct_count: number;
    incorrect_count: number;
  };
  hint?: string;
  example_sentence?: string;
  example_translation?: string;
};

export type GeneratedQuizQuestion = {
  question: string;
  type: string;
  answer: string;
  options?: string[];
};

export type GenerateQuizResponse = {
  questions: GeneratedQuizQuestion[];
};

export type InterpretedItem = {
  source_word: string;
  translated_word: string;
  native_language?: string;
  source_language?: string;
  example_sentence?: string;
  example_sentence_translated?: string;
};

export type InterpretResponse = {
  items: InterpretedItem[];
};

export type Language = {
  code: string;
  label: string;
};

export type LanguagesResponse = {
  languages: Language[];
};

export type SwitchLanguagePayload = {
  target_language: string;
  flashcard_ids?: number[];
  force_retranslate?: boolean;
};

export type SwitchLanguageResponse = {
  flashcards: Flashcard[];
  meta: {
    target_language: string;
    translated_count: number;
    skipped_count: number;
    force_retranslate: boolean;
  };
};

export type DeleteResponse = {
  status: string;
};
// TODO "Failed to switch language. Please try again." oraz łądowanie w postaci pojawiającego się snackbara
// TODO sticky header
// TODO błędy aplikacji przedstawioane w podstaci snackbarów
// TODO poprawne operacje przedstawiane w postaci snackbarów
// TODO "Flashcard already exists for this language pair." powinno dokładać tłumaczenie do listy
// TODO sprawdzanie duplikatów i agregowanie podobnych słów
// TODO paginacja w flashcards
// TODO rozróżnienie zwrotów od pojedyńczych słów
// TODO selektor języka na który mają być wykonywane tłumaczenia - przy zmianie języka w aplikacji wszystkie obecne fiszki zostają przetłumaczone na wybrany język
// TODO opisy aplikacji że jest uniwersalna dla każdego języka
// TODO interpretowanie danych z plików tekstowych (.pdf, .docx itd.), zdjęciowych w Interpret (OCR & AI)
// TODO skopiowanie przycisków z https://bolmate.nl/
// TODO quiz w postaci obracanych kart (animacje)
// TODO testy
// TODO wszystkie teksty w aplikacji po angielsku
// TODO konfetti jeżeli przejdzie się przez sekwencje 10 słów dobrze pod rząd
// TODO responsywność mobilne
export const fetchFlashcards = () => api.get<Flashcard[]>("/api/flashcards");

export const createFlashcard = (data: CreateFlashcardInput) =>
  api.post<Flashcard>("/api/flashcards", data);

export const deleteFlashcard = (id: number) =>
  api.delete<DeleteResponse>(`/api/flashcards/${id}`);

export const getQuizQuestion = () => api.get<QuizQuestion>("/api/quiz");

export const submitQuizAnswer = (payload: SubmitQuizAnswerPayload) =>
  api.post<QuizAnswerResponse>("/api/quiz", payload);

export const generateQuiz = (payload: GenerateQuizPayload) =>
  api.post<GenerateQuizResponse>("/api/quiz/generate", payload);

export const interpretText = (text: string, native_language: string) =>
  api.post<InterpretResponse>("/api/interpret", {
    text,
    native_language,
  } as InterpretTextPayload);

export const fetchLanguages = () => api.get<LanguagesResponse>("/api/languages");

export const switchLanguage = (payload: SwitchLanguagePayload) =>
  api.post<SwitchLanguageResponse>("/api/languages/switch", payload);

export default api;
