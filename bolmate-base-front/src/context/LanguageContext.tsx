import { createContext, ReactNode, useEffect, useState } from "react";

type LanguageContextType = {
  nativeLanguage: string;
  setNativeLanguage: (code: string) => void;
};

export const LanguageContext = createContext<LanguageContextType>({
  nativeLanguage: "pl",
  setNativeLanguage: () => {},
});

type ProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: ProviderProps) {
  const [nativeLanguage, setNativeLanguage] = useState("pl");

  useEffect(() => {
    const stored = localStorage.getItem("nativeLanguage");
    if (stored) setNativeLanguage(stored);
  }, []);

  const update = (code: string) => {
    setNativeLanguage(code);
    localStorage.setItem("nativeLanguage", code);
  };

  return (
    <LanguageContext.Provider value={{ nativeLanguage, setNativeLanguage: update }}>
      {children}
    </LanguageContext.Provider>
  );
}

