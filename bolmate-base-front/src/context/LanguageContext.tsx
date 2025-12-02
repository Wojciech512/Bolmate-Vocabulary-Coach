import React, { createContext, useContext, useEffect, useState } from "react";

type LanguageContextValue = {
  nativeLanguage: string;
  setNativeLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nativeLanguage, setNativeLanguageState] = useState<string>(() => {
    return localStorage.getItem("nativeLanguage") || "pl";
  });

  useEffect(() => {
    localStorage.setItem("nativeLanguage", nativeLanguage);
  }, [nativeLanguage]);

  const setNativeLanguage = (code: string) => setNativeLanguageState(code);

  return (
    <LanguageContext.Provider value={{ nativeLanguage, setNativeLanguage }}>
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

