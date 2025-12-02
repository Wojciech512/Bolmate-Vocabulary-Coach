import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Global error handler - will be set up by the app
let globalErrorHandler: ((message: string) => void) | null = null;

export function setGlobalErrorHandler(handler: (message: string) => void) {
  globalErrorHandler = handler;
}

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    if (globalErrorHandler) {
      const message =
        error.response?.data?.error || error.message || "An unexpected error occurred";
      globalErrorHandler(message);
    }
    return Promise.reject(error);
  },
);

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
  is_reversed?: boolean;
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
// TODO healthchecks dla serwisów
// TODO aktualizacja dokumentacji

// TODO generowanie memów tak aby zapamiętywać słowa?
// TODO quiz w postaci obracanych kart (animacje)
// TODO konfetti z boków jeżeli przejdzie się przez sekwencje 10 słów dobrze pod rząd
// TODO responsywność mobilne
export const fetchFlashcards = () => api.get<Flashcard[]>("/api/flashcards");

export const createFlashcard = (data: CreateFlashcardInput) =>
  api.post<Flashcard>("/api/flashcards", data);

export const deleteFlashcard = (id: number) =>
  api.delete<DeleteResponse>(`/api/flashcards/${id}`);

export const getQuizQuestion = (reverseMode: boolean, targetLanguage?: string) =>
  api.get<QuizQuestion>("/api/quiz", {
    params: { reverse: reverseMode, target_language: targetLanguage },
  });

export const submitQuizAnswer = (payload: SubmitQuizAnswerPayload) =>
  api.post<QuizAnswerResponse>("/api/quiz", payload);

export const generateQuiz = (payload: GenerateQuizPayload) =>
  api.post<GenerateQuizResponse>("/api/quiz/generate", payload);

export const interpretText = (text: string, native_language: string) =>
  api.post<InterpretResponse>("/api/interpret", {
    text,
    native_language,
  } as InterpretTextPayload);

export const interpretFile = (files: File[], native_language: string) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("native_language", native_language);

  return api.post<InterpretResponse>("/api/interpret/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const fetchLanguages = () => api.get<LanguagesResponse>("/api/languages");

export const switchLanguage = (payload: SwitchLanguagePayload) =>
  api.post<SwitchLanguageResponse>("/api/languages/switch", payload);

export default api;
