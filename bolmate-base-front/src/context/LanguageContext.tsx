import { createContext, useContext, useEffect, useState } from "react";

export type LanguageContextValue = {
  nativeLanguage: string;
  setNativeLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [nativeLanguage, setNativeLanguageState] = useState<string>(() => {
    return localStorage.getItem("nativeLanguage") || "en";
  });

  const setNativeLanguage = (code: string) => {
    setNativeLanguageState(code);
    localStorage.setItem("nativeLanguage", code);
  };

  useEffect(() => {
    localStorage.setItem("nativeLanguage", nativeLanguage);
  }, [nativeLanguage]);

  return (
    <LanguageContext.Provider value={{ nativeLanguage, setNativeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
