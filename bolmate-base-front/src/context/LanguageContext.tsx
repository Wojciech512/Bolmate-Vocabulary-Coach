import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Language,
  fetchLanguages,
} from "../api";

type LanguageContextValue = {
  nativeLanguage: string;
  setNativeLanguage: (code: string) => void;
  languages: Language[];
  switchToLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nativeLanguage, setNativeLanguageState] = useState<string>(() => {
    return localStorage.getItem("nativeLanguage") || "pl";
  });
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    localStorage.setItem("nativeLanguage", nativeLanguage);
  }, [nativeLanguage]);

  useEffect(() => {
    fetchLanguages()
      .then((res) => setLanguages(res.data.languages))
      .catch(() => setLanguages([]));
  }, []);

  const setNativeLanguage = (code: string) => setNativeLanguageState(code);

  const switchToLanguage = (code: string) => {
    if (code) {
      setNativeLanguage(code);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        nativeLanguage,
        setNativeLanguage,
        languages,
        switchToLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
};
