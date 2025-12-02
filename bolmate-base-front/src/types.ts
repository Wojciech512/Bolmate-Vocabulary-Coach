export type Flashcard = {
  id: number;
  source_word: string;
  source_language: string;
  translated_word: string;
  native_language: string;
  example_sentence?: string | null;
  example_sentence_translated?: string | null;
  difficulty_level?: string | null;
  is_manual: boolean;
  correct_count: number;
  incorrect_count: number;
  created_at?: string;
};

export type QuizQuestion = {
  question: string;
  type: "translation" | "multiple_choice" | "fill_in" | string;
  answer: string;
  options?: string[];
};
