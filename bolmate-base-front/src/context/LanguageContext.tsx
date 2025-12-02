import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Language,
  SwitchLanguageResponse,
  fetchLanguages,
  switchLanguage,
} from "../api";

type LanguageContextValue = {
  nativeLanguage: string;
  setNativeLanguage: (code: string) => void;
  languages: Language[];
  isSwitching: boolean;
  switchToLanguage: (code: string) => Promise<SwitchLanguageResponse | null>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nativeLanguage, setNativeLanguageState] = useState<string>(() => {
    return localStorage.getItem("nativeLanguage") || "pl";
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    localStorage.setItem("nativeLanguage", nativeLanguage);
  }, [nativeLanguage]);

  useEffect(() => {
    fetchLanguages()
      .then((res) => setLanguages(res.data.languages))
      .catch(() => setLanguages([]));
  }, []);

  const setNativeLanguage = (code: string) => setNativeLanguageState(code);

  const switchToLanguage = async (
    code: string,
  ): Promise<SwitchLanguageResponse | null> => {
    if (!code || code === nativeLanguage) {
      setNativeLanguage(code);
      return null;
    }

    setIsSwitching(true);
    try {
      const res = await switchLanguage({ target_language: code });
      setNativeLanguage(code);
      return res.data;
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        nativeLanguage,
        setNativeLanguage,
        languages,
        isSwitching,
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
