import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppTheme, darkTheme, lightTheme } from "./themes";

const STORAGE_KEY = "THRIVETRACK_THEME_IS_DARK";

type ThemeCtx = {
  theme: AppTheme;
  isDark: boolean;
  setDark: (v: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDarkState] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved != null) setIsDarkState(saved === "true");
    })();
  }, []);

  const setDark = async (v: boolean) => {
    setIsDarkState(v);
    await AsyncStorage.setItem(STORAGE_KEY, String(v));
  };

  const toggleTheme = () => setDark(!isDark);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}